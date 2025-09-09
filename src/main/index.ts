import { app, shell, BrowserWindow, ipcMain, screen, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    titleBarStyle: 'hiddenInset',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // List all displays and relevant metadata
  ipcMain.handle('get-displays', () => {
    const displays = screen.getAllDisplays()
    return displays.map((d) => ({
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      rotation: d.rotation,
      internal: d.internal
    }))
  })

  // Move window to target display and enter fullscreen there
  ipcMain.handle('move-to-display-fullscreen', (_event, displayId: number) => {
    if (!mainWindow) return false
    const target = screen.getAllDisplays().find((d) => Number(d.id) === Number(displayId))
    if (!target) return false

    // Ensure we are not in fullscreen before moving bounds
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false)
    }

    // Move and resize to the display bounds, then fullscreen
    mainWindow.setBounds(target.bounds)
    // A small delay can help the OS apply the bounds before fullscreen
    setTimeout(() => {
      if (!mainWindow) return
      mainWindow.setFullScreen(true)
    }, 50)

    return true
  })

  // Exit fullscreen (stays on current display)
  ipcMain.handle('exit-fullscreen', () => {
    if (!mainWindow) return false
    if (mainWindow.isFullScreen()) {
      mainWindow.setFullScreen(false)
    }
    return true
  })

  // Open external URLs on behalf of renderer/webview
  ipcMain.handle('open-external', (_event, url: string) => {
    shell.openExternal(url)
    return true
  })

  // Allow camera/mic for mesaconnect only
  const ses = session.defaultSession
  ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const requestingUrl = new URL(details.requestingUrl)
    const isMesaConnect = requestingUrl.hostname.endsWith('mesaconnect.io')
    if (isMesaConnect && permission === 'media') {
      callback(true)
      return
    }
    callback(false)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
