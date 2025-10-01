// Preload script for security
// This script runs in the renderer process before the web content begins loading
// It has access to both DOM APIs and Node.js APIs

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  version: process.versions.electron,
  
  // New Game functionality
  onNewGameRequest: (callback) => {
    ipcRenderer.on('request-new-game', callback);
  },
  
  onResetGame: (callback) => {
    ipcRenderer.on('reset-game', callback);
  },
  
  newGameConfirmed: () => {
    ipcRenderer.send('new-game-confirmed');
  },
  
  newGameCancelled: () => {
    ipcRenderer.send('new-game-cancelled');
  }
});