import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BOeN2gbn-uhfToxS7YYnDXQqefqop7PM8UU5GGAfvqSisAuup6LxfLAEzm5-I-3MnFpbf9LY64v0IH7b2sZNZ-c';

/**
 * Converts a base64url string to Uint8Array for applicationServerKey
 */
export function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if the browser supports Service Worker & Push Notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Registers the service worker /sw.js
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    try {
      await reg.update();
    } catch {}
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Subscribes user device to Web Push and saves subscription in Supabase
 */
export async function subscribeUserToPush(profileId: string): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications are not supported on this browser or device.' };
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return { success: false, error: 'Notification permission was denied.' };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'Failed to register service worker.' };
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const convertedVapidKey = urlB64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    const subJson = sub.toJSON();
    const endpoint = subJson.endpoint;
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return { success: false, error: 'Incomplete push keys from browser PushManager.' };
    }

    if (supabase) {
      const { error: upsertErr } = await supabase.from('push_subscriptions').upsert(
        {
          profile_id: profileId,
          endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent.slice(0, 255),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

      if (upsertErr) {
        console.error('Failed to save push subscription in Supabase:', upsertErr);
        return { success: false, error: upsertErr.message };
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error during push subscription:', err);
    return { success: false, error: err?.message || 'Failed to subscribe to push notifications' };
  }
}

/**
 * Unsubscribes from Web Push
 */
export async function unsubscribeUserFromPush(profileId: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();

      if (supabase) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
    } else if (supabase) {
      await supabase.from('push_subscriptions').delete().eq('profile_id', profileId);
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing from push:', err);
    return false;
  }
}

/**
 * Checks if the current browser device has an active push subscription
 */
export async function checkDevicePushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub);
  } catch {
    return false;
  }
}

/**
 * Dispatches a push notification via the Supabase Edge Function
 */
export async function dispatchPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  authorId?: string;
  targetProfileIds?: string[];
}) {
  if (!supabase) return;
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: payload,
    });
  } catch (err) {
    console.error('Failed to dispatch push notification:', err);
  }
}
