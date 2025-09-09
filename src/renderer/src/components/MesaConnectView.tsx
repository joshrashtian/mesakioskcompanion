import { useEffect, useRef, useState } from 'react'

type DisplayInfo = {
  id: number
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
  rotation: number
  internal: boolean
}

export default function MesaConnectView(): React.JSX.Element {
  const webviewRef = useRef<import('electron').WebviewTag | null>(null)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [url, setUrl] = useState('https://mesaconnect.io')
  useEffect(() => {
    window.api
      .getDisplays()
      .then((d) => setDisplays(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const handleNewWindow = (e: { url?: string }): void => {
      if (!e?.url) return
      window.electron.ipcRenderer.invoke('open-external', e.url)
    }
    const handleWillNavigate = (e: { url?: string; preventDefault?: () => void }): void => {
      const url: string | undefined = e?.url
      if (!url) return
      const u = new URL(url)
      if (!u.hostname.endsWith('mesaconnect.io')) {
        e.preventDefault?.()
        window.electron.ipcRenderer.invoke('open-external', url)
      }
    }

    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('new-window', handleNewWindow)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('will-navigate', handleWillNavigate)
    return () => {
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('new-window', handleNewWindow)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('will-navigate', handleWillNavigate)
    }
  }, [])

  return (
    <div className="h-full w-full flex flex-col">
      <div className="p-4 lg:top-12 lg:left-24 lg:right-24 z-10 bg-zinc-400/70 rounded-3xl px-24 flex items-center gap-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="text"
          className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700"
        />

        <div className="flex-1" />

        <label className="text-sm text-zinc-300">Screen</label>
        <select
          className="bg-zinc-900 text-zinc-100 rounded px-2 py-1 border border-zinc-700"
          onChange={async (e) => {
            const id = Number(e.target.value)
            if (!Number.isNaN(id)) await window.api.moveToDisplayAndFullscreen(id)
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Choose…
          </option>
          {displays.map((d) => (
            <option key={d.id} value={d.id}>
              {d.internal ? 'Built-in' : 'External'} — {d.bounds.width}×{d.bounds.height} @{' '}
              {d.scaleFactor}x
            </option>
          ))}
        </select>

        <button
          className="ml-2 px-3 py-1 rounded bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700"
          onClick={() => window.api.exitFullscreen()}
        >
          Exit Fullscreen
        </button>
      </div>

      <div className="flex-1 bg-black">
        <webview
          // @ts-ignore: webview has its own element type
          ref={webviewRef}
          src="https://mesaconnect.io"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  )
}
