const CACHE='korea-route-public-beta-v174-0901';
const CORE=['/','/index.html','/foreigner-access.json','/taxi-fare.json','/price-baseline.json'];
const OPTIONAL=['/manifest.json','/icon-192.png','/icon-512.png'];
const DATA_PATHS=new Set(['/foreigner-access.json','/taxi-fare.json','/price-baseline.json']);

async function taggedResponse(response,source){
  if(!response) return response;
  const headers=new Headers(response.headers);
  headers.set('X-Korea-Route-Data-Source',source);
  const body=await response.clone().arrayBuffer();
  return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

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
  if(DATA_PATHS.has(url.pathname)){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(!response.ok) throw new Error('HTTP '+response.status);
        return taggedResponse(response,'network');
      }catch(_){
        const cached=await caches.match(request);
        return cached?taggedResponse(cached,'cache'):Response.error();
      }
    })());
    return;
  }
  event.respondWith(fetch(request,{cache:'no-store'}).catch(()=>caches.match(request)));
});
