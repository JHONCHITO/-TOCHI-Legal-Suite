self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const payload = event.notification.data || {};
  const targetUrl = new URL(payload.url || "/dashboard/notificaciones", self.location.origin).toString();

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          await client.focus();
          return;
        }
      }

      if (windowClients.length > 0) {
        const firstClient = windowClients[0];
        if ("focus" in firstClient) {
          await firstClient.focus();
        }
        if ("navigate" in firstClient) {
          await firstClient.navigate(targetUrl);
          return;
        }
      }

      await self.clients.openWindow(targetUrl);
    })()
  );
});
