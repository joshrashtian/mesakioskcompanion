import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from './useTheme'
import {
  IoArrowBack,
  IoArrowForward,
  IoArrowUp,
  IoGlobe,
  IoLogoGoogle,
  IoLogoGithub,
  IoLogoYoutube,
  IoLogoTwitter,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoDocument,
  IoLogoDiscord,
  IoMusicalNote
} from 'react-icons/io5'
import { VscRefresh } from 'react-icons/vsc'
import { AnimatePresence, motion } from 'framer-motion'

// Lightweight icon mapping - store icon info instead of JSX elements
const WEBSITE_ICONS: Record<string, { icon: string; color: string }> = {
  'mesaconnect.io': { icon: 'globe', color: 'text-orange-500' },
  'google.com': { icon: 'google', color: 'text-blue-500' },
  'github.com': { icon: 'github', color: 'text-gray-500' },
  'youtube.com': { icon: 'youtube', color: 'text-red-500' },
  'twitter.com': { icon: 'twitter', color: 'text-blue-500' },
  'spotify.com': { icon: 'spotify', color: 'text-green-500' },
  'open.spotify.com': { icon: 'spotify', color: 'text-green-500' },
  'discord.com': { icon: 'discord', color: 'text-blue-500' },
  'x.com': { icon: 'twitter', color: 'text-blue-500' },
  'facebook.com': { icon: 'facebook', color: 'text-blue-500' },
  'instagram.com': { icon: 'instagram', color: 'text-pink-500' },
  'linkedin.com': { icon: 'linkedin', color: 'text-blue-500' },
  'docs.google.com': { icon: 'document', color: 'text-gray-500' },
  'drive.google.com': { icon: 'document', color: 'text-gray-500' },
  'notion.so': { icon: 'document', color: 'text-gray-500' }
}

// Cache for parsed URLs to avoid repeated URL parsing
const urlCache = new Map<string, string>()

// Render icon based on type
const renderIcon = (iconType: string, color: string): React.JSX.Element => {
  const className = `text-xl ${color}`

  switch (iconType) {
    case 'globe':
      return <IoGlobe className={className} />
    case 'google':
      return <IoLogoGoogle className={className} />
    case 'github':
      return <IoLogoGithub className={className} />
    case 'youtube':
      return <IoLogoYoutube className={className} />
    case 'twitter':
      return <IoLogoTwitter className={className} />
    case 'spotify':
      return <IoMusicalNote className={className} />
    case 'discord':
      return <IoLogoDiscord className={className} />
    case 'facebook':
      return <IoLogoFacebook className={className} />
    case 'instagram':
      return <IoLogoInstagram className={className} />
    case 'linkedin':
      return <IoLogoLinkedin className={className} />
    case 'document':
      return <IoDocument className={className} />
    default:
      return <IoGlobe className="text-xl" />
  }
}

// Function to get website icon based on URL
const getWebsiteIcon = (url: string): React.JSX.Element => {
  // Check cache first
  if (urlCache.has(url)) {
    const cachedIconType = urlCache.get(url)!
    const iconInfo = Object.values(WEBSITE_ICONS).find((info) => info.icon === cachedIconType)
    if (iconInfo) {
      return renderIcon(iconInfo.icon, iconInfo.color)
    }
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase()

    // Check for exact matches first (O(1) lookup)
    if (WEBSITE_ICONS[hostname]) {
      const iconInfo = WEBSITE_ICONS[hostname]
      urlCache.set(url, iconInfo.icon) // Cache the result
      return renderIcon(iconInfo.icon, iconInfo.color)
    }

    // Check for partial matches only if necessary (limit iterations)
    const domains = Object.keys(WEBSITE_ICONS)
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i]
      if (hostname.includes(domain)) {
        const iconInfo = WEBSITE_ICONS[domain]
        urlCache.set(url, iconInfo.icon) // Cache the result
        return renderIcon(iconInfo.icon, iconInfo.color)
      }
    }

    // Cache the default result too
    urlCache.set(url, 'globe')
    return <IoGlobe className="text-xl" />
  } catch {
    // Cache error result
    urlCache.set(url, 'globe')
    return <IoGlobe className="text-xl" />
  }
}

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

      try {
        const u = new URL(url)

        // List of domains that should stay in the webview
        const allowedDomains = [
          'mesaconnect.io',
          'google.com',
          'youtube.com',
          'github.com',
          'stackoverflow.com',
          'reddit.com',
          'discord.com',
          'twitter.com',
          'x.com',
          'facebook.com',
          'instagram.com',
          'linkedin.com',
          'spotify.com',
          'notion.so'
        ]

        // Check if the hostname is in our allowed list
        const isAllowed = allowedDomains.some(
          (domain) => u.hostname === domain || u.hostname.endsWith('.' + domain)
        )

        if (!isAllowed) {
          e.preventDefault?.()
          window.electron.ipcRenderer.invoke('open-external', url)
        }
      } catch (error) {
        console.log('Error parsing URL in handleWillNavigate:', error)
        // If URL parsing fails, allow it to proceed in webview
      }
    }

    const refreshTitle = (): void => {
      try {
        setTitle(wv.getTitle())
      } catch {
        // ignore
      }
    }

    const refreshUrl = (): void => {
      try {
        const currentUrl = wv.getURL()
        console.log('Current webview URL:', currentUrl) // Debug log
        if (currentUrl && currentUrl.startsWith('http')) {
          setUrl(currentUrl)
        }
      } catch (error) {
        console.log('Error getting URL:', error) // Debug log
      }
    }

    const handlePageTitleUpdated = (e: { title?: string }): void => {
      if (e?.title) setTitle(e.title)
      else refreshTitle()
      refreshUrl() // Also refresh URL when title updates
    }

    const handleDidNavigate = (e?: { url?: string }): void => {
      console.log('Navigation event:', e?.url) // Debug log
      refreshTitle()
      refreshUrl()
    }

    const handleDidStartLoading = (): void => {
      refreshUrl()
    }

    const handleDidStopLoading = (): void => {
      refreshTitle()
      refreshUrl()
    }

    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('new-window', handleNewWindow)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('will-navigate', handleWillNavigate)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('page-title-updated', handlePageTitleUpdated)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-finish-load', handleDidNavigate)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-navigate', handleDidNavigate)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-navigate-in-page', handleDidNavigate)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-start-loading', handleDidStartLoading)
    // @ts-ignore: Electron webview events are not in React's type defs
    wv.addEventListener('did-stop-loading', handleDidStopLoading)

    return () => {
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('new-window', handleNewWindow)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('will-navigate', handleWillNavigate)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('page-title-updated', handlePageTitleUpdated)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-finish-load', handleDidNavigate)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-navigate', handleDidNavigate)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-navigate-in-page', handleDidNavigate)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-start-loading', handleDidStartLoading)
      // @ts-ignore: Electron webview events are not in React's type defs
      wv.removeEventListener('did-stop-loading', handleDidStopLoading)
    }
  }, [])

  const handleBack = (): void => {
    webviewRef.current?.goBack()
    // Manually refresh URL after a short delay
    setTimeout(() => {
      if (webviewRef.current) {
        try {
          const currentUrl = webviewRef.current.getURL()
          if (currentUrl && currentUrl.startsWith('http')) {
            setUrl(currentUrl)
          }
        } catch (error) {
          console.log('Error getting URL after back:', error)
        }
      }
    }, 100)
  }

  const handleForward = (): void => {
    webviewRef.current?.goForward()
    // Manually refresh URL after a short delay
    setTimeout(() => {
      if (webviewRef.current) {
        try {
          const currentUrl = webviewRef.current.getURL()
          if (currentUrl && currentUrl.startsWith('http')) {
            setUrl(currentUrl)
          }
        } catch (error) {
          console.log('Error getting URL after forward:', error)
        }
      }
    }, 100)
  }

  const handleReload = (): void => {
    setLoading(true)
    webviewRef.current?.reload()
    setTimeout(() => {
      setLoading(false)
      // Also refresh URL after reload
      if (webviewRef.current) {
        try {
          const currentUrl = webviewRef.current.getURL()
          if (currentUrl && currentUrl.startsWith('http')) {
            setUrl(currentUrl)
          }
        } catch (error) {
          console.log('Error getting URL after reload:', error)
        }
      }
    }, 1000)
  }
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
      <div className={`p-4 flex flex-col gap-3 ${theme.page?.webview?.background}`}>
        <div className={`flex flex-row items-center gap-2 ${theme.page?.webview?.tabBackground}`}>
          {getWebsiteIcon(url)}
          <p className="no-drag truncate flex-1">{title}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="bg-gray-500 text-zinc-100 hover:bg-gray-600 px-3 py-3 w-fit rounded-2xl border border-zinc-700 no-drag"
            title="Go Back"
          >
            <IoArrowBack className="text-xl" />
          </button>
          <button
            onClick={handleForward}
            className="bg-gray-500 text-zinc-100 hover:bg-gray-600 px-3 py-3 w-fit rounded-2xl border border-zinc-700 no-drag"
            title="Go Forward"
          >
            <IoArrowForward className="text-xl" />
          </button>
          <button
            onClick={handleReload}
            className="bg-gray-500 text-zinc-100 hover:bg-gray-600 px-3 py-3 w-fit rounded-2xl border border-zinc-700 no-drag"
            title="Reload Page"
          >
            <VscRefresh className="text-xl" />
          </button>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="text"
            className={theme.page?.webview?.searchBar}
            onKeyDown={(e) => e.key === 'Enter' && handleGo()}
          />

          <button
            onClick={handleGo}
            className="bg-blue-500 text-zinc-100 hover:bg-blue-600 px-3 py-3 w-fit rounded-2xl border border-zinc-700 no-drag"
            title="Navigate to URL"
          >
            <AnimatePresence>
              {loading ? (
                <motion.div
                  initial={{ rotate: 0, opacity: 0 }}
                  animate={{ rotate: 360, opacity: 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <VscRefresh className="text-xl" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                >
                  <IoArrowUp className="text-xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
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
