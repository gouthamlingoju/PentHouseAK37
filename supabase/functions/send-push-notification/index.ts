import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VAPID_PUBLIC_KEY =
  Deno.env.get('VAPID_PUBLIC_KEY') ||
  'BOeN2gbn-uhfToxS7YYnDXQqefqop7PM8UU5GGAfvqSisAuup6LxfLAEzm5-I-3MnFpbf9LY64v0IH7b2sZNZ-c';

const VAPID_PRIVATE_KEY =
  Deno.env.get('VAPID_PRIVATE_KEY') ||
  '4SFkoCV0qH_841bMpP4osuaYXw4dlHqYLXh_u7dIvxI';

const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:penthouseak37@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const {
      title = 'PentHouse AK37',
      body: messageBody = 'A new transaction was logged.',
      url = '/',
      authorId,
      targetProfileIds,
    } = body;

    // Fetch all push subscriptions
    let query = supabaseAdmin.from('push_subscriptions').select('id, profile_id, endpoint, p256dh, auth');

    if (authorId) {
      query = query.neq('profile_id', authorId);
    }

    if (targetProfileIds && Array.isArray(targetProfileIds) && targetProfileIds.length > 0) {
      query = query.in('profile_id', targetProfileIds);
    }

    const { data: subs, error: subError } = await query;
    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subs || subs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No subscriptions to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      url,
      timestamp: Date.now(),
    });

    const deadSubIds: string[] = [];
    let sentCount = 0;

    await Promise.all(
      subs.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err: any) {
          console.error(`Failed to push to endpoint for profile ${sub.profile_id}:`, err?.statusCode || err);
          // 404 or 410 indicates expired/unregistered subscription
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            deadSubIds.push(sub.id);
          }
        }
      })
    );

    // Clean up dead subscriptions
    if (deadSubIds.length > 0) {
      await supabaseAdmin.from('push_subscriptions').delete().in('id', deadSubIds);
    }

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: subs.length, cleaned: deadSubIds.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Unexpected error in send-push-notification:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
