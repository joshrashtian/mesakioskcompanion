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
  exitFullscreen: (): Promise<boolean> => ipcRenderer.invoke('exit-fullscreen')
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
