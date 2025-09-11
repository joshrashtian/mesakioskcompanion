import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  IoClose,
  IoAdd,
  IoGlobe,
  IoLogoGoogle,
  IoLogoGithub,
  IoLogoYoutube,
  IoLogoTwitter,
  IoMusicalNote,
  IoLogoDiscord,
  IoLogoFacebook,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoDocument,
  IoArrowBack,
  IoArrowForward,
  IoArrowUp
} from 'react-icons/io5'
import { VscRefresh } from 'react-icons/vsc'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from './useTheme'

interface Tab {
  id: string
  url: string
  title: string
  isLoading: boolean
  inputUrl: string // URL in the input field (may differ from actual URL)
  webviewRef: React.RefObject<import('electron').WebviewTag | null>
}

interface TabManagerProps {
  initialUrl?: string
}

// Cache for parsed URLs to avoid repeated URL parsing
const urlCache = new Map<string, string>()

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

export default function TabManager({
  initialUrl = 'https://mesaconnect.io'
}: TabManagerProps): React.JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const tabIdCounter = useRef(0)
  const theme = useTheme()

  // Create a new tab
  const createTab = (url: string = 'https://mesaconnect.io'): void => {
    const newTabId = `tab-${++tabIdCounter.current}`
    const newTab: Tab = {
      id: newTabId,
      url,
      title: 'Loading...',
      isLoading: true,
      inputUrl: url,
      webviewRef: React.createRef<import('electron').WebviewTag>()
    }

    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newTabId)
  }

  // Close a tab
  const closeTab = (tabId: string): void => {
    setTabs((prev) => {
      const newTabs = prev.filter((tab) => tab.id !== tabId)

      // If we closed the active tab, switch to another
      if (tabId === activeTabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id)
      }

      // If no tabs left, create a new one
      if (newTabs.length === 0) {
        setTimeout(() => createTab(), 0)
      }

      return newTabs
    })
  }

  // Switch to a tab
  const switchToTab = (tabId: string): void => {
    setActiveTabId(tabId)
  }

  // Update tab title
  const updateTabTitle = useCallback((tabId: string, title: string): void => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, title } : tab)))
  }, [])

  // Update tab URL
  const updateTabUrl = useCallback((tabId: string, url: string): void => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, url, inputUrl: url } : tab)))
  }, [])

  // Update tab input URL (for typing in address bar)
  const updateTabInputUrl = useCallback((tabId: string, inputUrl: string): void => {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, inputUrl } : tab)))
  }, [])

  // Navigation controls for active tab
  const handleBack = (): void => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)
    if (activeTab?.webviewRef.current) {
      activeTab.webviewRef.current.goBack()
    }
  }

  const handleForward = (): void => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)
    if (activeTab?.webviewRef.current) {
      activeTab.webviewRef.current.goForward()
    }
  }

  const handleReload = (): void => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)
    if (activeTab?.webviewRef.current) {
      setTabs((prev) =>
        prev.map((tab) => (tab.id === activeTabId ? { ...tab, isLoading: true } : tab))
      )
      activeTab.webviewRef.current.reload()
      setTimeout(() => {
        setTabs((prev) =>
          prev.map((tab) => (tab.id === activeTabId ? { ...tab, isLoading: false } : tab))
        )
      }, 1000)
    }
  }

  const handleGo = (): void => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId)
    if (activeTab?.webviewRef.current) {
      let newUrl = activeTab.inputUrl
      if (!newUrl.includes('://')) {
        newUrl = `https://${newUrl}`
      }
      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId ? { ...tab, url: newUrl, inputUrl: newUrl, isLoading: true } : tab
        )
      )
      activeTab.webviewRef.current.loadURL(newUrl)
      setTimeout(() => {
        setTabs((prev) =>
          prev.map((tab) => (tab.id === activeTabId ? { ...tab, isLoading: false } : tab))
        )
      }, 1000)
    }
  }

  // Initialize with first tab
  useEffect(() => {
    if (tabs.length === 0) {
      createTab(initialUrl)
    }
  }, [tabs.length, initialUrl])

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  // Setup webview event handlers
  useEffect(() => {
    tabs.forEach((tab) => {
      const webview = tab.webviewRef.current
      if (!webview) return

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
          const title = webview.getTitle()
          if (title && title !== 'Loading...') {
            updateTabTitle(tab.id, title)
          }
        } catch (error) {
          console.log('Error getting webview title:', error)
        }
      }

      const handleTitleUpdate = (e: { title?: string }): void => {
        const title = e?.title || webview.getTitle() || 'Loading...'
        updateTabTitle(tab.id, title)
        // Also update loading state
        setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, isLoading: false } : t)))
      }

      const handleUrlUpdate = (): void => {
        try {
          const currentUrl = webview.getURL()
          if (currentUrl && currentUrl.startsWith('http')) {
            updateTabUrl(tab.id, currentUrl)
          }
        } catch (error) {
          console.log('Error getting webview URL:', error)
        }
      }

      const handleDidStartLoading = (): void => {
        setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, isLoading: true } : t)))
      }

      const handleDidStopLoading = (): void => {
        setTabs((prev) => prev.map((t) => (t.id === tab.id ? { ...t, isLoading: false } : t)))
        refreshTitle()
        handleUrlUpdate()
      }

      const handleDidNavigate = (): void => {
        refreshTitle()
        handleUrlUpdate()
      }

      // @ts-ignore: Electron webview events
      webview.addEventListener('new-window', handleNewWindow)
      // @ts-ignore: Electron webview events
      webview.addEventListener('will-navigate', handleWillNavigate)
      // @ts-ignore: Electron webview events
      webview.addEventListener('page-title-updated', handleTitleUpdate)
      // @ts-ignore: Electron webview events
      webview.addEventListener('did-start-loading', handleDidStartLoading)
      // @ts-ignore: Electron webview events
      webview.addEventListener('did-stop-loading', handleDidStopLoading)
      // @ts-ignore: Electron webview events
      webview.addEventListener('did-finish-load', handleDidNavigate)
      // @ts-ignore: Electron webview events
      webview.addEventListener('did-navigate', handleDidNavigate)
      // @ts-ignore: Electron webview events
      webview.addEventListener('did-navigate-in-page', handleDidNavigate)

      return () => {
        // @ts-ignore: Electron webview events
        webview.removeEventListener('new-window', handleNewWindow)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('will-navigate', handleWillNavigate)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('page-title-updated', handleTitleUpdate)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('did-start-loading', handleDidStartLoading)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('did-stop-loading', handleDidStopLoading)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('did-finish-load', handleDidNavigate)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('did-navigate', handleDidNavigate)
        // @ts-ignore: Electron webview events
        webview.removeEventListener('did-navigate-in-page', handleDidNavigate)
      }
    })
  }, [tabs, updateTabTitle, updateTabUrl, updateTabInputUrl])

  // Fallback: Periodically check for title updates on active tab
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab?.webviewRef.current) {
        try {
          const webview = activeTab.webviewRef.current
          const currentTitle = webview.getTitle()
          const currentUrl = webview.getURL()

          if (currentTitle && currentTitle !== activeTab.title && currentTitle !== 'Loading...') {
            updateTabTitle(activeTab.id, currentTitle)
          }

          if (currentUrl && currentUrl !== activeTab.url && currentUrl.startsWith('http')) {
            updateTabUrl(activeTab.id, currentUrl)
          }
        } catch {
          // Ignore errors
        }
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [activeTab, updateTabTitle, updateTabUrl])

  return (
    <div className="h-full w-full flex flex-col">
      {/* Tab Bar */}
      <div className={`${theme.page?.webview?.tabBarBackground}`}>
        <div className="flex items-center gap-4 flex-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`flex flex-row px-4 w-64 gap-3 py-2 duration-300 cursor-pointer group ${
                tab.id === activeTabId
                  ? theme.page?.webview?.tabActive
                  : theme.page?.webview?.tabBackground
              }`}
              onClick={() => switchToTab(tab.id)}
            >
              {getWebsiteIcon(tab.url)}
              <span className="text-sm text-zinc-200 truncate flex-1">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
                className="text-white hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IoClose className="text-sm" />
              </button>
            </div>
          ))}
        </div>

        {/* New Tab Button */}
        <button
          onClick={() => createTab()}
          className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded"
          title="New Tab"
        >
          <IoAdd className="text-lg" />
        </button>
      </div>
      {/* Navigation Controls */}
      {activeTab && (
        <div className={`p-4 flex flex-col gap-3 ${theme.page?.webview?.background}`}>
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
              value={activeTab.inputUrl}
              onChange={(e) => updateTabInputUrl(activeTab.id, e.target.value)}
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
                {activeTab.isLoading ? (
                  <motion.div
                    initial={{ rotate: 0, opacity: 0 }}
                    animate={{ rotate: 360, opacity: 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <VscRefresh className="text-xl" />
                  </motion.div>
                ) : (
                  <motion.div
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
      )}
      {/* Tab Content */}
      <div className="flex-1 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${tab.id === activeTabId ? 'block' : 'hidden'}`}
          >
            {/* Basic webview - you can expand this with your MesaConnectView features */}
            <webview ref={tab.webviewRef} src={tab.url} style={{ width: '100%', height: '100%' }} />
          </div>
        ))}
      </div>
      {/* Debug info for active tab */}
      {activeTab && (
        <div className="hidden">
          Active tab: {activeTab.title} - {activeTab.url}
        </div>
      )}
    </div>
  )
}
