// Service Worker ─ ニューロサイエンスヨガ（ケン・ハラクマ × 宮崎ほくと）
//
// 戦略：Network First（新しいコードを最優先で拾う → FNT PWA開発ナレッジ §2 準拠）。
//       オフライン時だけキャッシュへフォールバック。
//       index.html 側で controllerchange を検知して location.reload() する前提。
//
// 🔴 プリキャッシュに音声を全部は入れない。
//    23ポーズぶんの音声は 16MB あり、install で全部取ると初回が重く、失敗すると
//    SW ごと入らない。**無料の3ポーズ（約2MB）だけ先に取り、残りは再生したときに
//    キャッシュへ落とす**（runtime cache）。2回目からはオフラインで聴ける。
const CACHE_NAME = 'neuro-yoga-v1.0.6';   // ★デプロイのたびにここを上げる★

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './data.js',
  './assets/bgm/list.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap'
];

// 無料で開いている3ポーズ（No.1 / No.6 / No.24）の絵と音声
// 🔴 BGMは先に取らない。4曲で9.3MBあり、install で取ると初回が重く、
//    失敗すると SW ごと入らない。**選んで再生したものだけ**キャッシュに落ちる
const FREE_ASSETS = [
  './assets/img/no01.webp',
  './assets/audio/no01a.mp3',
  './assets/audio/no01b.mp3',
  './assets/audio/no01c.mp3',
  './assets/img/no06.webp',
  './assets/img/no06b.webp',
  './assets/audio/no06a.mp3',
  './assets/audio/no06b.mp3',
  './assets/audio/no06c.mp3',
  './assets/img/no24.webp',
  './assets/img/no24b.webp',
  './assets/audio/no24a.mp3',
  './assets/audio/no24b.mp3',
  './assets/audio/no24c.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // シェルは1つでも欠けたら止める（壊れた状態で入れない）
      await cache.addAll(SHELL);
      // 素材は取れなかったものがあっても install を失敗させない
      await Promise.all(FREE_ASSETS.map((u) => cache.add(u).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;
  const sameOrigin = url.startsWith(self.location.origin);
  const isFont = url.startsWith('https://fonts.');
  if (!sameOrigin && !isFont) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => {
        if (hit) return hit;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
