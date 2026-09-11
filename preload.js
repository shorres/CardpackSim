// Preload script for security
// Runs in the renderer before web content loads, with access to both DOM and Node APIs.
// Keep this surface as small as possible: everything exposed here is reachable by any
// script running in the renderer.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info (read at preload time; no IPC, no input)
  platform: process.platform,
  version: process.versions.electron,
  isDev: process.argv.includes('--dev-mode'),

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
  },

  // Save file I/O. The main process owns the path; callers pass only the document.
  saveGame: (payload) => ipcRenderer.invoke('save-game', payload),
  loadGame: () => ipcRenderer.invoke('load-game')
});
