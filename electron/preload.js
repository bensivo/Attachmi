// preload.js
const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.invoke('message', message),
  saveFile: (fileName, fileData) => ipcRenderer.invoke('saveFile', fileName, fileData),
  loadFile: (fileName) => ipcRenderer.invoke('loadFile', fileName),
  openFile: (fileName) => ipcRenderer.invoke('openFile', fileName),
  downloadFile: (fileName, displayName) => ipcRenderer.invoke('downloadFile', fileName, displayName),
  deleteFile: (fileName) => ipcRenderer.invoke('deleteFile', fileName),
  listAttachments: () => ipcRenderer.invoke('listAttachments'),
  createAttachment: (attachment) => ipcRenderer.invoke('createAttachment', attachment),
  updateAttachment: (attachment) => ipcRenderer.invoke('updateAttachment', attachment),
  deleteAttachment: (id) => ipcRenderer.invoke('deleteAttachment', id)
});