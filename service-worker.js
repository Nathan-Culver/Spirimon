const CACHE='spirimon-offline-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./assets/spirimon-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spirimon-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),url=new URL(event.request.url),immutable=/\/(?:game|style)-[a-f0-9]{12}\.(?:js|css)$/.test(url.pathname);
  if(immutable){const cached=await cache.match(event.request);if(cached)return cached;}
  try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
  catch(error){const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;if(event.request.mode==='navigate')return await cache.match('./index.html');throw error;}
 })());
});
