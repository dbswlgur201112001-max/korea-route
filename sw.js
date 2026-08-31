const CACHE='korea-route-public-beta-v67-0831';
const ASSETS=['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);

  // Serverless APIs must always stay network-only.
  if(url.origin===self.location.origin && url.pathname.startsWith('/api/')) return;

  // External map/library resources keep their normal network behavior.
  if(url.origin!==self.location.origin) return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          if(response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put('/index.html',copy)).catch(()=>{});
          }
          return response;
        })
        .catch(()=>caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(()=>caches.match(request))
  );
});
