import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from './useTheme'
import { IoArrowUp } from 'react-icons/io5'
import { VscRefresh } from 'react-icons/vsc'
import { AnimatePresence, motion } from 'framer-motion'

export default function MesaConnectView(): React.JSX.Element {
  const webviewRef = useRef<import('electron').WebviewTag | null>(null)
  const location = useLocation()
  const theme = useTheme()
  const [url, setUrl] = useState('https://mesaconnect.io')
  const [title, setTitle] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  // Accept initial URL via route state or ?url= query param
  useEffect(() => {
    const state = (location.state as { url?: string } | null) || null
    const queryUrl = new URLSearchParams(location.search).get('url') || undefined
    const incoming = state?.url || queryUrl
    if (incoming) {
      const normalized = incoming.includes('://') ? incoming : `https://${incoming}`
      setUrl(normalized)
      webviewRef.current?.loadURL(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.search])
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

    const refreshTitle = (): void => {
      try {
        setTitle(wv.getTitle())
      } catch {
        // ignore
      }
    }
    const handlePageTitleUpdated = (e: { title?: string }): void => {
      if (e?.title) setTitle(e.title)
      else refreshTitle()
    }

    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('new-window', handleNewWindow)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('will-navigate', handleWillNavigate)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('page-title-updated', handlePageTitleUpdated)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-finish-load', refreshTitle)
    return () => {
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('new-window', handleNewWindow)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('will-navigate', handleWillNavigate)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('page-title-updated', handlePageTitleUpdated)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-finish-load', refreshTitle)
    }
  }, [])

  const handleGo = (): void => {
    let newUrl = url
    if (url.includes('https://')) {
      newUrl = url
    } else {
      newUrl = `https://${url}`
    }
    setUrl(newUrl)
    setLoading(true)
    webviewRef.current?.loadURL(newUrl)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="h-full w-full flex flex-col">
      <div className={`p-4 flex items-center gap-3 ${theme.page?.webview?.tabBackground}`}>
        <div className="w-72">
          <p className="no-drag truncate ">{title}</p>
          <div className="flex items-center gap-3">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="text"
              className="bg-zinc-900 text-zinc-100  px-3 py-3 min-w-[500px] rounded-3xl border border-zinc-700 no-drag"
            />
            <button
              onClick={() => {
                handleGo()
              }}
              className="bg-blue-500 text-zinc-100 hover:bg-blue-600 px-3 py-3 w-fit rounded-3xl border border-zinc-700 no-drag"
            >
              <AnimatePresence>
                {loading ? (
                  <motion.div
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 360, opacity: 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <VscRefresh className=" text-2xl" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                  >
                    <IoArrowUp className="text-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
        <div className="flex-1" />
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
