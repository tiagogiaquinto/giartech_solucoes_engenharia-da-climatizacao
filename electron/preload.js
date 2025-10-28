const { contextBridge, ipcRenderer } = require('electron')

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  platform: process.platform,
  isElectron: true
})
