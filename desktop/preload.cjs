const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('hackerTubeDesktop', {
  platform: process.platform,
  get: key => ipcRenderer.invoke('library:get', key),
  set: (key, value) => ipcRenderer.invoke('library:set', key, value),
  api: path => ipcRenderer.invoke('catalog:api', path),
  exportBackup: state => ipcRenderer.invoke('backup:export', state),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  onAction: callback => {
    const listener = (_event, action) => { if (['export', 'import', 'settings'].includes(action)) callback(action); };
    ipcRenderer.on('library:action', listener);
    return () => ipcRenderer.removeListener('library:action', listener);
  }
});
