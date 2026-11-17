import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verify caller JWT
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify caller is an active Admin
    const { data: callerProfile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('id, is_admin, name')
      .eq('auth_user_id', userData.user.id)
      .single();

    if (profErr || !callerProfile || !callerProfile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only the active Admin can create or manage roommates.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const action = body.action || 'create';

    // Optional action: Admin resets a roommate's password
    if (action === 'reset_password') {
      const { profileId, newPassword } = body;
      if (!profileId || !newPassword || String(newPassword).length < 6) {
        return new Response(
          JSON.stringify({ error: 'profileId and newPassword (min 6 chars) are required.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id, name')
        .eq('id', profileId)
        .single();

      if (!targetProfile?.auth_user_id) {
        return new Response(
          JSON.stringify({ error: 'Roommate auth account not found.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: resetErr } = await supabaseAdmin.auth.admin.updateUserById(
        targetProfile.auth_user_id,
        { password: String(newPassword) }
      );

      if (resetErr) {
        return new Response(
          JSON.stringify({ error: resetErr.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: `Password updated for ${targetProfile.name}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default action: Create new roommate
    const rawUsername = String(body.username || '').trim().toLowerCase();
    const cleanUsername = rawUsername.replace(/[^a-z0-9._-]/g, '');
    const name = String(body.name || '').trim();
    const password = String(body.password || '');
    const upiId = String(body.upi_id || '').trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const color = String(body.color || '#8b5cf6');

    if (!cleanUsername || cleanUsername.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Username must be at least 3 alphanumeric characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!name) {
      return new Response(
        JSON.stringify({ error: 'Display name is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = `${cleanUsername}@penthouse.ak37`;
    const profileId = `user_${cleanUsername}_${Date.now().toString(36).slice(-4)}`;

    // Check username uniqueness
    const { data: existingProf } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (existingProf) {
      return new Response(
        JSON.stringify({ error: `Username "${cleanUsername}" is already taken.` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Auth user with auto-confirmed email
    const { data: createdAuth, error: createAuthErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username: cleanUsername, name },
    });

    if (createAuthErr || !createdAuth?.user) {
      return new Response(
        JSON.stringify({ error: createAuthErr?.message || 'Failed to create auth user.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Profile row
    const { data: insertedProfile, error: insertErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: profileId,
        auth_user_id: createdAuth.user.id,
        username: cleanUsername,
        name,
        email,
        upi_id: upiId || `${cleanUsername}@upi`,
        phone,
        color,
        is_admin: false,
        is_active: true,
      })
      .select()
      .single();

    if (insertErr) {
      // Rollback auth user on profile insert failure
      await supabaseAdmin.auth.admin.deleteUser(createdAuth.user.id);
      return new Response(
        JSON.stringify({ error: insertErr.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ profile: insertedProfile }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
