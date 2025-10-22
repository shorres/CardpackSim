const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

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
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    // icon: path.join(__dirname, 'assets', 'icon.png'), // Uncomment when you have an icon
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the app
  mainWindow.loadFile('index.html');

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

ipcMain.on('new-game-cancelled', () => {
  // User cancelled - do nothing
  console.log('New game cancelled by user');
});

// Simple version checking for update notifications
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get platform information
ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Download update handler
ipcMain.handle('download-update', async (event, downloadUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const fileName = path.basename(downloadUrl);
      const downloadPath = path.join(app.getPath('downloads'), fileName);
      
      console.log(`Downloading update from: ${downloadUrl}`);
      console.log(`Saving to: ${downloadPath}`);
      
      const file = fs.createWriteStream(downloadPath);
      
      https.get(downloadUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 302 || response.statusCode === 301) {
          https.get(response.headers.location, (redirectResponse) => {
            const totalSize = parseInt(redirectResponse.headers['content-length'], 10);
            let downloadedSize = 0;
            
            redirectResponse.pipe(file);
            
            redirectResponse.on('data', (chunk) => {
              downloadedSize += chunk.length;
              if (totalSize > 0) {
                const progress = Math.round((downloadedSize / totalSize) * 100);
                event.sender.send('download-progress', progress);
              }
            });
            
            file.on('finish', () => {
              file.close();
              console.log(`Download completed: ${downloadPath}`);
              
              // Show the downloaded file in explorer
              shell.showItemInFolder(downloadPath);
              
              // Show dialog to user
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Update Downloaded',
                message: 'Update has been downloaded successfully!',
                detail: `The installer has been saved to your Downloads folder.\n\nWould you like to run the installer now? This will close the current application.`,
                buttons: ['Run Installer', 'Later']
              }).then((result) => {
                if (result.response === 0) {
                  // User wants to run installer
                  shell.openPath(downloadPath).then(() => {
                    app.quit();
                  });
                }
              });
              
              resolve(downloadPath);
            });
            
            file.on('error', (err) => {
              fs.unlink(downloadPath, () => {}); // Delete partial file
              console.error('Download error:', err);
              reject(err);
            });
          }).on('error', (err) => {
            console.error('Redirect request error:', err);
            reject(err);
          });
        } else {
          const totalSize = parseInt(response.headers['content-length'], 10);
          let downloadedSize = 0;
          
          response.pipe(file);
          
          response.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (totalSize > 0) {
              const progress = Math.round((downloadedSize / totalSize) * 100);
              event.sender.send('download-progress', progress);
            }
          });
          
          file.on('finish', () => {
            file.close();
            console.log(`Download completed: ${downloadPath}`);
            
            // Show the downloaded file in explorer
            shell.showItemInFolder(downloadPath);
            
            // Show dialog to user
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Update Downloaded',
              message: 'Update has been downloaded successfully!',
              detail: `The installer has been saved to your Downloads folder.\n\nWould you like to run the installer now? This will close the current application.`,
              buttons: ['Run Installer', 'Later']
            }).then((result) => {
              if (result.response === 0) {
                // User wants to run installer
                shell.openPath(downloadPath).then(() => {
                  app.quit();
                });
              }
            });
            
            resolve(downloadPath);
          });
          
          file.on('error', (err) => {
            fs.unlink(downloadPath, () => {}); // Delete partial file
            console.error('Download error:', err);
            reject(err);
          });
        }
      }).on('error', (err) => {
        console.error('Download request error:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Download setup error:', error);
      reject(error);
    }
  });
});

// Install and restart handler
ipcMain.handle('install-and-restart', async (event, downloadPath) => {
  try {
    console.log(`Installing update from: ${downloadPath}`);
    
    // Run the installer
    await shell.openPath(downloadPath);
    
    // Quit the current app
    app.quit();
    
    return true;
  } catch (error) {
    console.error('Installation error:', error);
    throw error;
  }
});

// Restart app handler
ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit();
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

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});