import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getDisplays: (): Promise<
    Array<{
      id: number
      bounds: { x: number; y: number; width: number; height: number }
      workArea: { x: number; y: number; width: number; height: number }
      scaleFactor: number
      rotation: number
      internal: boolean
    }>
  > => ipcRenderer.invoke('get-displays'),
  moveToDisplayAndFullscreen: (displayId: number): Promise<boolean> =>
    ipcRenderer.invoke('move-to-display-fullscreen', displayId),
  exitFullscreen: (): Promise<boolean> => ipcRenderer.invoke('exit-fullscreen'),

  // Spotify API
  spotify: {
    authenticate: (): Promise<{ success: boolean; token?: string; error?: string }> =>
      ipcRenderer.invoke('spotify-authenticate'),
    getToken: (): Promise<string | null> => ipcRenderer.invoke('spotify-get-token'),
    logout: (): Promise<boolean> => ipcRenderer.invoke('spotify-logout'),
    isAuthenticated: (): Promise<boolean> => ipcRenderer.invoke('spotify-is-authenticated')
  },

  // Auto-updater API
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    onUpdateAvailable: (callback: (info: any) => void) => {
      ipcRenderer.on('update-available', (_, info) => callback(info))
    },
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('download-progress', (_, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: any) => void) => {
      ipcRenderer.on('update-downloaded', (_, info) => callback(info))
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('update-available')
      ipcRenderer.removeAllListeners('download-progress')
      ipcRenderer.removeAllListeners('update-downloaded')
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
