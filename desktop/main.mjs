import {app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, session, shell} from 'electron';
import {readFile, writeFile, stat} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {APP_URL, isAppDocument, apiURL, externalURL, isAllowedRequest, localAsset} from './policy.mjs';
import {LibraryStorage} from './storage.mjs';
import {validateState} from '../extension/core.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
app.setName('HackerTube');
if (process.env.HACKERTUBE_USER_DATA) app.setPath('userData', process.env.HACKERTUBE_USER_DATA);
protocol.registerSchemesAsPrivileged([{scheme: 'hackertube', privileges: {standard: true, secure: true, supportFetchAPI: true, corsEnabled: true}}]);
const library = new LibraryStorage(join(app.getPath('userData'), 'library.json'));
let win;
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' https://i.ytimg.com data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";
function trusted(event) {
  if (!win || event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || !isAppDocument(event.senderFrame.url)) throw Error('Untrusted sender');
}
function handle(name, fn) { ipcMain.handle(name, async (event, ...args) => { trusted(event); return fn(...args); }); }
function sendAction(action) { if (win && !win.isDestroyed()) win.webContents.send('library:action', action); }
async function openExternal(input) {
  const url = externalURL(input);
  if (url) await shell.openExternal(url);
}

function registerIPC() {
  handle('library:get', key => library.get(key));
  handle('library:set', (key, value) => library.set(key, value));
  handle('catalog:api', async path => {
    const response = await net.fetch(apiURL(path), {credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: AbortSignal.timeout(15000)});
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    const reader = response.body.getReader();
    const chunks = []; let size = 0;
    try {
      while (true) {
        const {done, value} = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) throw Error('Catalog response exceeds limit');
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel().catch(() => {}); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  });
  handle('backup:export', async raw => {
    const state = validateState(raw);
    const result = await dialog.showSaveDialog(win, {title: '导出 HackerTube 备份', defaultPath: `hackertube-backup-${new Date().toISOString().slice(0, 10)}.json`, filters: [{name: 'JSON backup', extensions: ['json']}]});
    if (result.canceled || !result.filePath) return false;
    await writeFile(result.filePath, JSON.stringify(state, null, 2), {mode: 0o600});
    return true;
  });
  handle('backup:import', async () => {
    const result = await dialog.showOpenDialog(win, {title: '导入 HackerTube 备份', properties: ['openFile'], filters: [{name: 'JSON backup', extensions: ['json']}]});
    if (result.canceled || !result.filePaths[0]) return null;
    const file = result.filePaths[0];
    if ((await stat(file)).size > 2_000_000) throw Error('备份文件不能超过 2 MB');
    return validateState(JSON.parse(await readFile(file, 'utf8')));
  });
}
function installMenu() {
  const menu = [
    ...(process.platform === 'darwin' ? [{label: 'HackerTube', submenu: [{label: '关于 HackerTube', click: showAbout}, {type: 'separator'}, {label: '设置与数据…', accelerator: 'CmdOrCtrl+,', click: () => sendAction('settings')}, {type: 'separator'}, {role: 'hide'}, {role: 'hideOthers'}, {role: 'unhide'}, {type: 'separator'}, {role: 'quit'}]}] : []),
    {label: '片库', submenu: [
      {label: '导入备份…', accelerator: 'CmdOrCtrl+O', click: () => sendAction('import')},
      {label: '导出备份…', accelerator: 'CmdOrCtrl+Shift+S', click: () => sendAction('export')},
      {label: '设置与数据…', click: () => sendAction('settings')},
      {type: 'separator'}, process.platform === 'darwin' ? {role: 'close'} : {role: 'quit'}
    ]},
    {label: '编辑', submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'}, {role: 'cut'}, {role: 'copy'}, {role: 'paste'}, {role: 'selectAll'}]},
    {label: '显示', submenu: [{role: 'reload'}, ...(app.isPackaged ? [] : [{role: 'toggleDevTools'}]), {type: 'separator'}, {role: 'resetZoom'}, {role: 'zoomIn'}, {role: 'zoomOut'}, {role: 'togglefullscreen'}]},
    {label: '窗口', submenu: [{role: 'minimize'}, {role: 'zoom'}, ...(process.platform === 'darwin' ? [{role: 'front'}] : [])]},
    {label: '帮助', submenu: [{label: '开源代码', click: () => openExternal('https://github.com/cq0206/HackerTube')}, {label: '下载新版本', click: () => openExternal('https://github.com/cq0206/HackerTube/releases')}, {label: '数据来源与许可', click: () => openExternal('https://hackertube.org/data')}, {label: '关于 HackerTube', click: showAbout}]}
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}
function showAbout() {
  dialog.showMessageBox(win, {type: 'info', title: '关于 HackerTube', message: `HackerTube ${app.getVersion()}`, detail: '开源的私人放映室。\n代码：MIT · 数据：ODC-By v1.0\n数据来自 HackerTube / open-index/hacker-news。\n独立项目，与原站、YouTube 或 Hacker News 无隶属关系。\n\n本地片库：' + app.getPath('userData')});
}
function createWindow() {
  win = new BrowserWindow({width: 1440, height: 960, minWidth: 780, minHeight: 600, title: 'HackerTube', backgroundColor: '#0d0f12', show: false,
    icon: join(root, 'desktop/assets/icon.png'),
    webPreferences: {preload: join(root, 'desktop/preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false, spellcheck: false}
  });
  win.webContents.setWindowOpenHandler(({url}) => { openExternal(url).catch(() => {}); return {action: 'deny'}; });
  win.webContents.on('will-navigate', event => { if (!isAppDocument(event.url)) { event.preventDefault(); openExternal(event.url).catch(() => {}); } });
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.on('will-frame-navigate', event => { if (!isAppDocument(event.url)) event.preventDefault(); });
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => { win = null; });
  win.loadURL(APP_URL);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  app.whenReady().then(() => {
    protocol.handle('hackertube', async request => {
      const asset = localAsset(request.url);
      if (request.method !== 'GET' || !asset) return new Response('Not found', {status: 404});
      try {
        return new Response(await readFile(join(root, 'extension', asset[0])), {headers: {'Content-Type': asset[1], 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer'}});
      } catch { return new Response('Not found', {status: 404}); }
    });
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({cancel: !isAllowedRequest(details.url)}));
    registerIPC(); installMenu(); createWindow();
    app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
  let quitting = false;
  app.on('before-quit', event => {
    if (quitting) return;
    event.preventDefault();
    library.flush().catch(() => {}).finally(() => { quitting = true; app.quit(); });
  });
}
