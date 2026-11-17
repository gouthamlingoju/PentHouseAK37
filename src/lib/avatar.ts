import { supabase, isSupabaseConfigured } from './supabase';

export const MAX_AVATAR_INPUT_BYTES = 10 * 1024 * 1024; // 10 MB before compression

export interface CroppedAvatarResult {
  blob: Blob;
  contentType: string;
  ext: string;
}

/**
 * Validates that a chosen file is an image within the size limit.
 */
export function validateAvatarFile(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose a valid image file (JPG, PNG, or WebP).';
  }
  if (file.size > MAX_AVATAR_INPUT_BYTES) {
    return 'Image is too large (max 10 MB).';
  }
  return null;
}

/**
 * Renders the user-adjusted crop (pan, zoom, rotation, aspect ratio) into a crisp
 * compressed WebP (or JPEG fallback) Blob ready for upload.
 */
export async function exportCroppedAvatar(params: {
  image: HTMLImageElement;
  cropWidth: number;
  cropHeight: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
  rotationDeg: number;
  maxOutputDim?: number;
}): Promise<CroppedAvatarResult> {
  const {
    image,
    cropWidth,
    cropHeight,
    offsetX,
    offsetY,
    zoom,
    rotationDeg,
    maxOutputDim = 384,
  } = params;

  const isRotatedOdd = Math.abs(rotationDeg % 180) === 90;
  const effW = isRotatedOdd ? image.naturalHeight : image.naturalWidth;
  const effH = isRotatedOdd ? image.naturalWidth : image.naturalHeight;

  const baseScale = Math.max(cropWidth / effW, cropHeight / effH);
  const displayScale = baseScale * zoom;

  // Output canvas dimensions matching chosen aspect ratio
  const exportRatio = maxOutputDim / Math.max(cropWidth, cropHeight);
  const outW = Math.round(cropWidth * exportRatio);
  const outH = Math.round(cropHeight * exportRatio);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser canvas is unavailable.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, outW, outH);

  ctx.save();
  ctx.translate(outW / 2 + offsetX * exportRatio, outH / 2 + offsetY * exportRatio);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(displayScale * exportRatio, displayScale * exportRatio);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.restore();

  let blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', 0.88)
  );
  let contentType = 'image/webp';
  let ext = 'webp';

  if (!blob || blob.type !== 'image/webp') {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
    );
    contentType = 'image/jpeg';
    ext = 'jpg';
  }

  if (!blob) throw new Error('Failed to export cropped image.');

  return { blob, contentType, ext };
}

/**
 * Uploads a pre-cropped Blob to Supabase Storage (avatars/<authUid>/avatar.webp)
 * and returns a cache-busted public URL.
 */
export async function uploadCroppedAvatarBlob(
  authUserId: string | null | undefined,
  cropped: CroppedAvatarResult
): Promise<{ url?: string; error?: string }> {
  try {
    if (isSupabaseConfigured && supabase && authUserId) {
      const storagePath = `${authUserId}/avatar.${cropped.ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, cropped.blob, {
          upsert: true,
          contentType: cropped.contentType,
          cacheControl: '3600',
        });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(storagePath);
      return { url: `${data.publicUrl}?v=${Date.now()}` };
    }

    // Local fallback mode
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image data.'));
      reader.readAsDataURL(cropped.blob);
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
    // Ignore cleanup errors
  }
}
