import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

// 1. Inisialisasi Antrean (Queue) Sinkronisasi Latar Belakang
const vibeSyncQueue = new BackgroundSyncPlugin('vibe-offline-queue', {
  maxRetentionTime: 24 * 60, // Simpan request yang gagal maksimal selama 24 jam (dalam menit)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone());
        console.log('[Service Worker] Background sync berhasil untuk:', entry.request.url);
      } catch (error) {
        console.error('[Service Worker] Background sync gagal, dikembalikan ke antrean.', error);
        // Kembalikan ke antrean jika masih gagal
        await queue.unshiftRequest(entry);
        throw error; 
      }
    }
  },
});

// 2. Daftarkan Rute yang Akan Di-intercept
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [vibeSyncQueue],
  }),
  'POST'
);

// 3. Passthrough untuk event SW lainnya
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
