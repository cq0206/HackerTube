// A single UI works in Chrome, a browser preview, and the sandboxed desktop app.
export const desktop = globalThis.hackerTubeDesktop;
export const extension = !desktop && !!globalThis.chrome?.storage?.local;
export const store = {
  async get(key) {
    if (desktop) return desktop.get(key);
    if (extension) return (await chrome.storage.local.get(key))[key];
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  },
  async set(key, value) {
    if (desktop) return desktop.set(key, value);
    if (extension) return chrome.storage.local.set({[key]: value});
    localStorage.setItem(key, JSON.stringify(value));
  }
};
export async function catalogAPI(path) {
  if (desktop) return desktop.api(path);
  const response = await fetch('https://hackertube.org' + path, {
    credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw Error(`HTTP ${response.status}`);
  return response.json();
}
