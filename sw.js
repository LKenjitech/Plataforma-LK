/* Plataforma LK – service worker: deixa o site instalável e funcionando sem internet */
const V = 'lk-v4.2.0';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;            // não mexe em YouTube, Google etc.

  if (r.mode === 'navigate') {                          // página: tenta a internet primeiro (pega a versão nova) e usa o guardado se estiver offline
    e.respondWith(
      fetch(r).then(res => {
        const cp = res.clone();
        caches.open(V).then(c => c.put('index.html', cp));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }
  e.respondWith(                                        // arquivos: usa o guardado e atualiza em segundo plano
    caches.match(r).then(m => {
      const net = fetch(r).then(res => {
        if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => m);
      return m || net;
    })
  );
});
