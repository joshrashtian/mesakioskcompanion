import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'

interface SpotifyUser {
  id: string
  display_name: string
  images: Array<{ url: string }>
}

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
}

interface PlaybackState {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
}

const FloatingSpotifyPlayer: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is already authenticated on component mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (token) {
        setIsAuthenticated(true)
        await fetchUserProfile(token)
        await fetchCurrentPlayback(token)
      }
    } catch (error: unknown) {
      console.log('No valid token found', error)
    }
  }

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const authResult = await window.api.spotify.authenticate()
      if (authResult.success) {
        setIsAuthenticated(true)
        await fetchUserProfile(authResult.token!)
        await fetchCurrentPlayback(authResult.token!)
      }
    } catch (error: unknown) {
      console.error('Spotify authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    await window.api.spotify.logout()
    setIsAuthenticated(false)
    setUser(null)
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setIsExpanded(false)
  }

  const fetchUserProfile = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error: unknown) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const fetchCurrentPlayback = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok && response.status !== 204) {
        const playbackData: PlaybackState = await response.json()
        setCurrentTrack(playbackData.item)
        setIsPlaying(playbackData.is_playing)
        setProgress(playbackData.progress_ms)
      }
    } catch (error: unknown) {
      console.error('Failed to fetch current playback:', error)
    }
  }

  const togglePlayback = async (): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      const endpoint = isPlaying ? 'pause' : 'play'
      const response = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        setIsPlaying(!isPlaying)
      }
    } catch (error: unknown) {
      console.error('Failed to toggle playback:', error)
    }
  }

  const skipTrack = async (direction: 'next' | 'previous'): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      const response = await fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (response.ok) {
        // Refresh current track after skip
        setTimeout(() => fetchCurrentPlayback(token), 500)
      }
    } catch (error: unknown) {
      console.error(`Failed to skip ${direction}:`, error)
    }
  }

  // Refresh playback state every 10 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      const token = await window.api.spotify.getToken()
      if (token) {
        await fetchCurrentPlayback(token)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Always show the player when visible is true - users need to see it to authenticate
  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
      >
        <SpotifyIcon width={24} height={24} fill="white" />
      </button>
    )
  }

  // Collapsed view (mini player)
  const CollapsedPlayer = (): React.JSX.Element => (
    <motion.div
      className="flex items-center gap-2 bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg cursor-pointer hover:bg-black/95 transition-colors"
      onClick={() => setIsExpanded(true)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {currentTrack?.album.images[0]?.url ? (
        <img
          src={currentTrack.album.images[0].url}
          alt={currentTrack.album.name}
          className="w-8 h-8 rounded"
        />
      ) : (
        <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
          <SpotifyIcon width={16} height={16} fill="white" />
        </div>
      )}

      <div className="flex-1 min-w-0 max-w-48">
        {currentTrack ? (
          <>
            <p className="text-xs font-medium truncate">{currentTrack.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {currentTrack.artists.map((artist) => artist.name).join(', ')}
            </p>
          </>
        ) : (
          <p className="text-xs">Spotify</p>
        )}
      </div>

      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          togglePlayback()
        }}
        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
      >
        {isPlaying ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </motion.div>
  )

  // Expanded view (full controls)
  const ExpandedPlayer = (): React.JSX.Element => (
    <motion.div
      className="bg-black/95 backdrop-blur-sm text-white p-4 rounded-lg shadow-2xl border border-gray-700"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SpotifyIcon width={16} height={16} fill="#1DB954" />
          <span className="text-sm font-medium">Spotify</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-4">
          <SpotifyIcon width={32} height={32} fill="#1DB954" className="mx-auto mb-2" />
          <p className="text-sm text-gray-400 mb-3">Connect to Spotify</p>
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            {isLoading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      ) : currentTrack ? (
        <>
          {/* Track Info */}
          <div className="flex items-center gap-3 mb-3">
            {currentTrack.album.images[0]?.url && (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className="w-12 h-12 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{currentTrack.name}</h3>
              <p className="text-xs text-gray-400 truncate">
                {currentTrack.artists.map((artist) => artist.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1 mb-3">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${(progress / currentTrack.duration_ms) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => skipTrack('previous')}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlayback}
              className="bg-white text-black rounded-full w-8 h-8 flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => skipTrack('next')}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>

          {/* User info and logout */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center gap-2">
              {user?.images?.[0]?.url ? (
                <img
                  src={user.images[0].url}
                  alt={user.display_name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <div className="w-5 h-5 bg-gray-600 rounded-full" />
              )}
              <span className="text-xs text-gray-400">{user?.display_name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <SpotifyIcon width={32} height={32} fill="#1DB954" className="mx-auto mb-2 opacity-50" />
          <p className="text-xs text-gray-400">No track playing</p>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence mode="wait">
        {isExpanded ? <ExpandedPlayer key="expanded" /> : <CollapsedPlayer key="collapsed" />}
      </AnimatePresence>
    </div>
  )
}

export default FloatingSpotifyPlayer
