import { app, shell, BrowserWindow, ipcMain, screen, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import * as dotenv from 'dotenv'
import icon from '../../resources/icon.png?asset'
import SpotifyAuth from './spotify-auth'

// Load environment variables from .env file
dotenv.config()

let mainWindow: BrowserWindow | null = null
let spotifyAuth: SpotifyAuth | null = null

// Configure auto-updater
if (!is.dev) {
  autoUpdater.checkForUpdatesAndNotify()
}

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info)
  // Notify renderer process
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info)
  }
})

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info)
})

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err)
})

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = 'Download speed: ' + progressObj.bytesPerSecond
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
  log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
  console.log(log_message)
  // Notify renderer process
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj)
  }
})

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info)
  // Notify renderer process
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info)
  }
})

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
      webviewTag: true,
      plugins: true,
      experimentalFeatures: true,
      webSecurity: false,
      contextIsolation: false,
      nodeIntegration: true
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

// Enable Widevine DRM support for protected content (like Spotify)
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,WidevineEncryptedMedia')
app.commandLine.appendSwitch('ignore-certificate-errors')
app.commandLine.appendSwitch('disable-web-security')
app.commandLine.appendSwitch('enable-widevine-cdm')
app.commandLine.appendSwitch('widevine-cdm-path', app.getPath('userData'))
app.commandLine.appendSwitch('widevine-cdm-version', '4.10.2710.0')

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

  // Initialize Spotify Auth
  spotifyAuth = new SpotifyAuth()

  // Spotify Authentication Handlers
  ipcMain.handle('spotify-authenticate', async () => {
    try {
      if (!spotifyAuth) {
        throw new Error('Spotify auth not initialized')
      }
      return await spotifyAuth.authenticate()
    } catch (error: unknown) {
      console.error('Spotify authentication error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('spotify-get-token', async () => {
    try {
      if (!spotifyAuth) {
        return null
      }
      return await spotifyAuth.getValidToken()
    } catch (error: unknown) {
      console.error('Error getting Spotify token:', error)
      return null
    }
  })

  ipcMain.handle('spotify-logout', () => {
    if (spotifyAuth) {
      spotifyAuth.logout()
    }
    return true
  })

  ipcMain.handle('spotify-is-authenticated', () => {
    return spotifyAuth?.isAuthenticated() || false
  })

  // Auto-updater IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    if (is.dev) {
      return { message: 'Updates not available in development mode' }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      return result
    } catch (error) {
      console.error('Error checking for updates:', error)
      return { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('install-update', () => {
    if (is.dev) {
      return { message: 'Updates not available in development mode' }
    }
    autoUpdater.quitAndInstall()
    return { message: 'Installing update...' }
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Allow camera/mic for mesaconnect and our own renderer origins, plus protected media for Spotify
  const ses = session.defaultSession
  ses.setPermissionRequestHandler((_webContents, permission, callback, details) => {
    const requestingUrl = new URL(details.requestingUrl)
    const isMesaConnect = requestingUrl.hostname.endsWith('mesaconnect.io')
    const isSpotify = requestingUrl.hostname.includes('spotify.com')
    const isFile = requestingUrl.protocol === 'file:'
    let isDevRenderer = false
    const devUrl = process.env['ELECTRON_RENDERER_URL']
    if (devUrl) {
      try {
        const devHost = new URL(devUrl).host
        isDevRenderer = requestingUrl.host === devHost
      } catch {
        isDevRenderer = false
      }
    }

    if (permission === 'media') {
      if (isMesaConnect || isFile || isDevRenderer) {
        callback(true)
        return
      }
    }

    // Allow protected media content for Spotify and our own app
    if (permission === 'mediaKeySystem') {
      if (isSpotify || isMesaConnect || isFile || isDevRenderer) {
        callback(true)
        return
      }
    }

    // Allow all permissions for our own renderer (including DRM)
    if (isFile || isDevRenderer) {
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
