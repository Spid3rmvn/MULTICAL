const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Securely exposes APIs to renderer
 * Using contextBridge for security
 */

// API exposed to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Application info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => process.platform,
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // Backend communication
  getBackendUrl: () => ipcRenderer.invoke('backend:url'),
  checkBackendHealth: () => ipcRenderer.invoke('backend:health'),
  
  // File system (if needed)
  selectFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  selectDirectory: (options) => ipcRenderer.invoke('dialog:openDirectory', options),
  
  // IPC communication
  send: (channel, data) => {
    const validChannels = ['app:ready', 'window:minimize', 'window:maximize', 'window:close'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, callback) => {
    const validChannels = ['app:update', 'backend:status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  invoke: (channel, data) => {
    const validChannels = ['app:version', 'backend:url', 'backend:health', 'dialog:openFile', 'dialog:openDirectory'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error('Invalid channel'));
  }
});

// Notify main process that preload is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded');
});
