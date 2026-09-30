const CACHE='pheisiraetha-v13';

const ASSETS=[
  './',
  './index.html',
  './app.css',
  './launch.js',
  './app.js',
  './locales.js',
  './manifest.webmanifest?v=07',
  './launch-screen.jpg',
  './icon-192.png?v=07',
  './icon-512.png?v=07',
  './icon-maskable-192.png?v=07',
  './icon-maskable-512.png?v=07'
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
