import React, { useState, useEffect } from 'react'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'

interface SpotifyPlayerProps {
  className?: string
}

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

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ className = '' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
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

  // Refresh playback state every 5 seconds when playing
  useEffect(() => {
    if (!isAuthenticated || !isPlaying) return

    const interval = setInterval(async () => {
      const token = await window.api.spotify.getToken()
      if (token) {
        await fetchCurrentPlayback(token)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAuthenticated, isPlaying])

  if (!isAuthenticated) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 bg-black text-white rounded-lg ${className}`}
      >
        <SpotifyIcon width={64} height={64} fill="#1DB954" className="mb-4" />
        <h2 className="text-2xl font-bold mb-4">Connect to Spotify</h2>
        <p className="text-gray-400 mb-6 text-center">
          Connect your Spotify account to control playback and see what&apos;s playing
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-6 py-3 rounded-full font-semibold transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <SpotifyIcon width={20} height={20} fill="white" />
              Connect Spotify
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-black text-white p-6 rounded-lg ${className}`}>
      {/* User Profile */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {user?.images?.[0]?.url ? (
            <img
              src={user.images[0].url}
              alt={user.display_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <SpotifyIcon width={20} height={20} fill="#1DB954" />
            </div>
          )}
          <div>
            <p className="font-semibold">{user?.display_name}</p>
            <p className="text-sm text-gray-400">Spotify Connected</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Current Track */}
      {currentTrack ? (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {currentTrack.album.images[0]?.url && (
              <img
                src={currentTrack.album.images[0].url}
                alt={currentTrack.album.name}
                className="w-16 h-16 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{currentTrack.name}</h3>
              <p className="text-gray-400 truncate">
                {currentTrack.artists.map((artist) => artist.name).join(', ')}
              </p>
              <p className="text-sm text-gray-500 truncate">{currentTrack.album.name}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-1 mb-4">
            <div
              className="bg-green-500 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${(progress / currentTrack.duration_ms) * 100}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => skipTrack('previous')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlayback}
              className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => skipTrack('next')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <SpotifyIcon width={48} height={48} fill="#1DB954" className="mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">No track currently playing</p>
          <p className="text-sm text-gray-500">
            Start playing music in Spotify to see controls here
          </p>
        </div>
      )}
    </div>
  )
}

export default SpotifyPlayer
