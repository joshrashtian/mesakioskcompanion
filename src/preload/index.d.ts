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
    }
  }
}
