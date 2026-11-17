import { supabase, isSupabaseConfigured } from './supabase';

const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB before compression
const AVATAR_SIZE_PX = 256;

/**
 * Center-crops and resizes an uploaded image file to a crisp 256x256 square Blob
 * in WebP (or JPEG fallback) so profile pictures load fast and stay tiny (~20-40 KB).
 */
export async function resizeAvatarImage(
  file: File
): Promise<{ blob: Blob; contentType: string; ext: string }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (JPG, PNG, or WebP).');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image is too large (max 10 MB).');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not decode the selected image.'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE_PX;
    canvas.height = AVATAR_SIZE_PX;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser canvas is unavailable.');
    }

    // Center-crop square
    const minSide = Math.min(img.width, img.height);
    const sx = (img.width - minSide) / 2;
    const sy = (img.height - minSide) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, AVATAR_SIZE_PX, AVATAR_SIZE_PX);

    // Prefer WebP; fall back to JPEG if unsupported
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.85)
    );
    let contentType = 'image/webp';
    let ext = 'webp';

    if (!blob || blob.type !== 'image/webp') {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88)
      );
      contentType = 'image/jpeg';
      ext = 'jpg';
    }

    if (!blob) {
      throw new Error('Failed to compress profile picture.');
    }

    return { blob, contentType, ext };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Compresses and uploads a roommate's avatar to Supabase Storage (avatars/<authUid>/avatar.webp)
 * and returns a cache-busted public URL.
 */
export async function uploadProfileAvatarFile(
  authUserId: string | null | undefined,
  file: File
): Promise<{ url?: string; error?: string }> {
  try {
    const { blob, contentType, ext } = await resizeAvatarImage(file);

    if (isSupabaseConfigured && supabase && authUserId) {
      const storagePath = `${authUserId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, blob, {
          upsert: true,
          contentType,
          cacheControl: '3600',
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      return { url: `${data.publicUrl}?v=${Date.now()}` };
    }

    // Local fallback mode: convert small 256x256 blob to data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image data.'));
      reader.readAsDataURL(blob);
    });
    return { url: dataUrl };
  } catch (err: any) {
    return { error: err?.message || 'Failed to upload profile picture.' };
  }
}

/**
 * Best-effort cleanup of stored avatar files for a user.
 */
export async function deleteStoredAvatarFiles(authUserId: string | null | undefined): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !authUserId) return;
  try {
    await supabase.storage
      .from('avatars')
      .remove([`${authUserId}/avatar.webp`, `${authUserId}/avatar.jpg`, `${authUserId}/avatar.png`]);
  } catch {
    // Ignore cleanup errors if file didn't exist
  }
}
