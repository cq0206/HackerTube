export const APP_ORIGIN = 'hackertube://app';
export const APP_URL = APP_ORIGIN + '/index.html';
export const API_ORIGIN = 'https://hackertube.org';
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function isAppDocument(input) {
  try {
    const u = new URL(input);
    return u.protocol === 'hackertube:' && u.hostname === 'app' && !u.port &&
      !u.username && !u.password && u.pathname === '/index.html' && !u.search;
  } catch { return false; }
}

export function apiURL(input) {
  if (typeof input !== 'string' || input.length > 1000 || !input.startsWith('/api/')) throw Error('Unsupported API request');
  const u = new URL(input, API_ORIGIN);
  if (u.origin !== API_ORIGIN || u.hash || u.username || u.password) throw Error('Unsupported API origin');
  const q = u.searchParams;
  if (u.pathname === '/api/docs') {
    if ([...q.keys()].join(',') !== 'vids') throw Error('Unexpected API parameters');
    const ids = q.get('vids').split(',');
    if (!ids.length || ids.length > 40 || ids.some(id => !VIDEO_ID.test(id))) throw Error('Invalid video IDs');
  } else if (u.pathname === '/api/list') {
    if ([...q.keys()].sort().join(',') !== 'dur,n,offset' || q.get('dur') !== 'xlong' || q.get('n') !== '100' || !/^\d{1,4}$/.test(q.get('offset')) || Number(q.get('offset')) % 100) throw Error('Invalid Longs request');
  } else throw Error('Unsupported API endpoint');
  return u.href;
}

export function externalURL(input) {
  try {
    if (typeof input !== 'string' || input.length > 2048) return null;
    const u = new URL(input);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || u.hash) return null;
    if (u.hostname === 'www.youtube.com' && u.pathname === '/watch' &&
      [...u.searchParams.keys()].join(',') === 'v' && VIDEO_ID.test(u.searchParams.get('v'))) return u.href;
    if (u.hostname === 'news.ycombinator.com' && u.pathname === '/item' &&
      [...u.searchParams.keys()].join(',') === 'id' && /^[1-9]\d{0,12}$/.test(u.searchParams.get('id'))) return u.href;
    if (u.hostname === 'hackertube.org' && ['/', '/about', '/data'].includes(u.pathname) && !u.search && !u.hash) return u.href;
    if (u.hostname === 'huggingface.co' && u.pathname === '/datasets/open-index/hacker-news' && !u.search) return u.href;
    if (u.hostname === 'github.com' && /^\/cq0206\/HackerTube(?:\/(?:releases|issues)(?:\/new)?)?\/?$/.test(u.pathname) && !u.search && !u.hash) return u.href;
  } catch { /* Untrusted URL: fail closed. */ }
  return null;
}

export function isAllowedRequest(input) {
  try {
    const u = new URL(input);
    if (u.protocol === 'hackertube:' && u.hostname === 'app') return true;
    if (u.protocol === 'https:' && u.hostname === 'i.ytimg.com' && !u.port && !u.username && !u.password &&
      /^\/vi\/[A-Za-z0-9_-]{11}\/(?:hq2|hqdefault)\.jpg$/.test(u.pathname) && !u.search) return true;
    if (u.origin === API_ORIGIN) { apiURL(u.pathname + u.search); return true; }
  } catch { /* Deny anything outside this application's network contract. */ }
  return false;
}

export const ASSETS = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ...['app.js', 'core.js', 'icons.js', 'platform.js'].map(p => ['/' + p, [p, 'text/javascript; charset=utf-8']]),
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/data/videos.jsonl', ['data/videos.jsonl', 'application/x-ndjson; charset=utf-8']],
  ...[16, 32, 48, 128].map(n => [`/icons/${n}.png`, [`icons/${n}.png`, 'image/png']])
]);
export function localAsset(input) {
  try {
    const u = new URL(input);
    if (u.protocol !== 'hackertube:' || u.hostname !== 'app' || u.port || u.username || u.password || u.search) return null;
    return ASSETS.get(u.pathname) || null;
  } catch { return null; }
}
