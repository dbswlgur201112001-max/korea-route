const CACHE='korea-route-public-beta-v146-0901';
const CORE=['/','/index.html'];
const OPTIONAL=['/manifest.json','/icon-192.png','/icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await Promise.allSettled(OPTIONAL.map(url=>cache.add(new Request(url,{cache:'reload'}))));
  })());
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
  if(url.origin===self.location.origin && url.pathname.startsWith('/api/')) return;
  if(url.origin!==self.location.origin) return;
  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request,{cache:'no-store'})
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
  event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match(request)));
});
