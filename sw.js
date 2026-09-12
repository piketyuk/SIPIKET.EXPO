self.addEventListener('install',e=>e.waitUntil(caches.open('sipiket-v1').then(c=>c.addAll(['/','/index.html','/styles.css','/script.js','/favicon.svg']))));
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('/offline.html')))); });
