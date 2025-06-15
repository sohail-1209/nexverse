// Import the Firebase SDK for Firebase Cloud Messaging.
// This service worker is intentionally kept simple. The Firebase SDK, when initialized
// in your main app (firebase.ts), should handle the registration and configuration
// of this service worker automatically if it's named 'firebase-messaging-sw.js'
// and placed in the public root.

// It is critical that the main application's Firebase initialization (including
// providing the config and VAPID key) correctly sets up messaging such that the SDK
// can communicate its config to this service worker.

try {
  // These imports will be handled by the Firebase SDK when it loads this service worker
  // Ensure you are using a compatible version of Firebase SDK in your main app.
  // For Firebase v9+, modular imports are used.
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

  // Firebase app is initialized by the SDK.
  // The configuration is also expected to be provided by the SDK when it registers this SW.
  // If `firebase.messaging()` is not available, it means the SDK hasn't loaded or initialized properly.

  if (firebase.apps.length) { // Check if Firebase has been initialized by the SDK
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message: ', payload);

      const notificationTitle = payload.notification?.title || 'NExVERSE Update';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification.',
        icon: payload.notification?.icon || '/icons/icon-192x192.png', // Ensure this icon exists
        data: payload.data, // Pass along data for click actions (e.g., URL to open)
        tag: payload.notification?.tag || payload.fcmMessageId || String(Date.now()) // Use a tag to manage notifications
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.error('[firebase-messaging-sw.js] Firebase app not initialized in SW. Cannot set up background message handler. Ensure your main app initializes Firebase and Messaging correctly.');
  }
} catch (error) {
    console.error('[firebase-messaging-sw.js] Error setting up Firebase Messaging in Service Worker:', error);
    // If this error occurs, background notifications will not work.
}

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification);
  event.notification.close();

  // Default URL to open if not specified in notification data
  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a NExVERSE tab open to the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) { // Check base URL
          try {
            return client.focus();
          } catch (err) {
            // Ignore focus errors on some platforms.
          }
        }
      }
      // If no tab is found or can't be focused, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
