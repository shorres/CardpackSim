// Preload script for security
// This script runs in the renderer process before the web content begins loading
// It has access to both DOM APIs and Node.js APIs

const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // You can add any APIs you need to expose to the renderer here
  // For this simple app, we don't need any specific APIs yet
  platform: process.platform,
  version: process.versions.electron
});