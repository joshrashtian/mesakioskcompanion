import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getDisplays: () => Promise<
        Array<{
          id: number
          bounds: { x: number; y: number; width: number; height: number }
          workArea: { x: number; y: number; width: number; height: number }
          scaleFactor: number
          rotation: number
          internal: boolean
        }>
      >
      moveToDisplayAndFullscreen: (displayId: number) => Promise<boolean>
      exitFullscreen: () => Promise<boolean>
      spotify: {
        authenticate: () => Promise<{ success: boolean; token?: string; error?: string }>
        getToken: () => Promise<string | null>
        logout: () => Promise<boolean>
        isAuthenticated: () => Promise<boolean>
      }
      updater: {
        checkForUpdates: () => Promise<any>
        installUpdate: () => Promise<any>
        getAppVersion: () => Promise<string>
        onUpdateAvailable: (callback: (info: any) => void) => void
        onDownloadProgress: (callback: (progress: any) => void) => void
        onUpdateDownloaded: (callback: (info: any) => void) => void
        removeAllListeners: () => void
      }
    }
  }
}
