// preload.js
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.invoke('message', message),
  saveFile: (fileName, fileData) => ipcRenderer.invoke('saveFile', fileName, fileData),
  loadFile: (fileName) => ipcRenderer.invoke('loadFile', fileName),
  openFile: (fileName) => ipcRenderer.invoke('openFile', fileName),
  deleteFile: (fileName) => ipcRenderer.invoke('deleteFile', fileName)
});