/**
 * ============================================================
 * ELECTRON MAIN PROCESS — School Assistant Overlay
 * Creates a transparent, always-on-top, draggable overlay window
 * ============================================================
 */
const { app, BrowserWindow, ipcMain, desktopCapturer, screen, globalShortcut } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;
let overlayWindow;

// ── Create main overlay window ──────────────────────────────
function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 680,
    x: width - 450,
    y: 50,
    frame: false,           // No OS window frame
    transparent: true,      // Transparent background
    alwaysOnTop: true,      // Always above other windows
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  // Load React app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  overlayWindow.loadURL(startUrl);

  // Keep overlay always on top of everything
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true);

  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    app.quit();
  });
}

// ── IPC: Capture Screen Screenshot ─────────────────────────
ipcMain.handle('capture-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 720 }
    });

    if (sources.length > 0) {
      const thumbnail = sources[0].thumbnail;
      const base64 = thumbnail.toDataURL();
      return { success: true, screenshot: base64 };
    }

    return { success: false, error: 'No screen source found' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ── IPC: Window Controls ────────────────────────────────────
ipcMain.on('set-opacity', (event, opacity) => {
  if (overlayWindow) overlayWindow.setOpacity(opacity);
});

ipcMain.on('minimize-window', () => {
  if (overlayWindow) overlayWindow.minimize();
});

ipcMain.on('close-window', () => {
  app.quit();
});

ipcMain.on('resize-window', (event, { width, height }) => {
  if (overlayWindow) overlayWindow.setSize(width, height);
});

// ── App Lifecycle ───────────────────────────────────────────
app.whenReady().then(() => {
  createOverlay();

  // Global shortcut: Ctrl+Shift+S to toggle visibility
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (overlayWindow) {
      if (overlayWindow.isVisible()) {
        overlayWindow.hide();
      } else {
        overlayWindow.show();
      }
    }
  });

  // Global shortcut: Ctrl+Shift+A to trigger AI analysis
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (overlayWindow) {
      overlayWindow.webContents.send('trigger-analyze');
    }
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
