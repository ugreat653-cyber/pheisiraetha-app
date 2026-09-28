const CACHE='pheisiraetha-v05';

const ASSETS=[
  './',
  './index.html',
  './app.css',
  './app.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install',e=>
  e.waitUntil(
    caches.open(CACHE)
      .then(c=>
        Promise.all(
          ASSETS.map(asset=>
            fetch(asset,{cache:'reload'}).then(response=>{
              if(!response.ok){
                throw new Error(`Failed to fetch ${asset}: ${response.status}`);
              }
              return c.put(asset,response);
            })
          )
        )
      )
      .then(()=>self.skipWaiting())
  )
);

self.addEventListener('activate',e=>
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(
        keys
          .filter(k=>k.startsWith('pheisiraetha-')&&k!==CACHE)
          .map(k=>caches.delete(k))
      )
    )
    .then(()=>self.clients.claim())
  )
);

self.addEventListener('fetch',e=>
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  )
);
