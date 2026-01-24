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
  deleteAttachment: (id) => ipcRenderer.invoke('deleteAttachment', id),
  listCollections: () => ipcRenderer.invoke('listCollections'),
  createCollection: (collection) => ipcRenderer.invoke('createCollection', collection),
  updateCollection: (collection) => ipcRenderer.invoke('updateCollection', collection),
  deleteCollection: (id) => ipcRenderer.invoke('deleteCollection', id),
  getCollectionAttachments: (collectionId) => ipcRenderer.invoke('getCollectionAttachments', collectionId),
  getAttachmentCollections: (attachmentId) => ipcRenderer.invoke('getAttachmentCollections', attachmentId),
  addAttachmentToCollection: (collectionId, attachmentId) => ipcRenderer.invoke('addAttachmentToCollection', collectionId, attachmentId),
  removeAttachmentFromCollection: (collectionId, attachmentId) => ipcRenderer.invoke('removeAttachmentFromCollection', collectionId, attachmentId)
});