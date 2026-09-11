const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      additionalArguments: process.argv.includes('--dev') ? ['--dev-mode'] : [],
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, 'assets', 'icon.png'), // Uncomment when you have an icon
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the app. Resolve against __dirname rather than the process working directory,
  // which is not guaranteed to be the app root.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up the menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Request new game with confirmation
            if (mainWindow) {
              requestNewGame();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        // Kept in the shipped menu (this is where F12 / Ctrl+Shift+I come from).
        // This is a single-player offline game with a plaintext save file, so DevTools
        // exposes nothing a player could not already read, and removing it costs real
        // debuggability.
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function requestNewGame() {
  // Send a request to the renderer to show confirmation dialog
  if (mainWindow) {
    mainWindow.webContents.send('request-new-game');
  }
}

// IPC handlers for new game functionality
ipcMain.on('new-game-confirmed', () => {
  // User confirmed - reset the game properly
  if (mainWindow) {
    mainWindow.webContents.send('reset-game');
  }
});

// ---------------------------------------------------------------------------
// Save file I/O
//
// The renderer never supplies a path: these handlers decide the filename. Writes are
// atomic (temp file + rename) with the previous save kept as a backup, so a crash or a
// full disk cannot leave a half-written save as the only copy.
// ---------------------------------------------------------------------------

function savePaths() {
  const dir = app.getPath('userData');
  return {
    dir,
    file: path.join(dir, 'save.json'),
    backup: path.join(dir, 'save.bak.json'),
    temp: path.join(dir, 'save.json.tmp')
  };
}

ipcMain.handle('save-game', (event, payload) => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'invalid save payload' };
  }

  const { dir, file, backup, temp } = savePaths();
  try {
    fs.mkdirSync(dir, { recursive: true });
    const json = JSON.stringify(payload);

    fs.writeFileSync(temp, json, 'utf8');

    // Rotate the previous save to the backup slot, but only if it was actually a playable
    // save. Copying unconditionally meant the empty first-run document -- or a file that
    // had since been corrupted -- could overwrite the last good backup, which defeats the
    // whole point of having one.
    if (fs.existsSync(file)) {
      let previousIsUsable = false;
      try {
        const previous = JSON.parse(fs.readFileSync(file, 'utf8'));
        previousIsUsable = !!(previous && previous.game);
      } catch (_) {
        previousIsUsable = false;
      }
      if (previousIsUsable) {
        fs.copyFileSync(file, backup);
      }
    }

    fs.renameSync(temp, file);

    // Make sure a backup exists from the FIRST playable save onward. Rotation alone only
    // produces one on the second save, which would leave a first-session player with no
    // recovery copy at all. After this, the backup is the previous good version.
    if (payload.game && !fs.existsSync(backup)) {
      fs.copyFileSync(file, backup);
    }

    return { ok: true, bytes: Buffer.byteLength(json, 'utf8'), path: file };
  } catch (error) {
    try { if (fs.existsSync(temp)) fs.unlinkSync(temp); } catch (_) { /* best effort */ }
    console.error('Save failed:', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('load-game', () => {
  const { file, backup } = savePaths();

  const read = (target) => {
    if (!fs.existsSync(target)) return null;
    return JSON.parse(fs.readFileSync(target, 'utf8'));
  };

  try {
    const data = read(file);
    if (data) return { ok: true, data, source: 'primary' };
  } catch (error) {
    console.error('Primary save unreadable:', error);
    // Keep the damaged file instead of letting the next write overwrite it.
    try {
      fs.renameSync(file, file.replace(/\.json$/, `.corrupt-${Date.now()}.json`));
    } catch (_) { /* best effort */ }

    try {
      const data = read(backup);
      if (data) {
        return {
          ok: true,
          data,
          source: 'backup',
          warning: 'Your save file was damaged; the previous backup was loaded instead.'
        };
      }
    } catch (backupError) {
      console.error('Backup save unreadable:', backupError);
      return { ok: false, error: 'save and backup are both unreadable' };
    }
    return { ok: false, error: 'save file is unreadable' };
  }

  return { ok: true, data: null, source: 'none' };
});

ipcMain.on('new-game-cancelled', () => {
  // User cancelled - do nothing
  console.log('New game cancelled by user');
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: deny window creation and block navigation away from the bundled app.
// The 'new-window' event this previously used was removed in Electron 22, so the old
// guard was dead code. The preload stays attached across navigation, so a renderer
// steered to a remote origin would hand that origin the electronAPI surface.
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));

  const blockRemote = (navEvent, navigationUrl) => {
    let protocol;
    try {
      protocol = new URL(navigationUrl).protocol;
    } catch {
      navEvent.preventDefault();
      return;
    }
    if (protocol !== 'file:') {
      console.warn(`Blocked navigation to ${navigationUrl}`);
      navEvent.preventDefault();
    }
  };

  contents.on('will-navigate', blockRemote);
  contents.on('will-redirect', blockRemote);
  contents.on('will-attach-webview', (attachEvent) => attachEvent.preventDefault());
});