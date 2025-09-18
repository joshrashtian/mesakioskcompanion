import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'
import SpotifyWebPlayer from './SpotifyWebPlayer'

interface SpotifyUser {
  id: string
  display_name: string
  images: Array<{ url: string }>
  followers: { total: number }
}

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string; id: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
  duration_ms: number
  preview_url?: string
  uri: string
}

interface SpotifyPlaylist {
  id: string
  name: string
  description: string
  images: Array<{ url: string }>
  tracks: { total: number }
  owner: { display_name: string }
}

interface SpotifyAlbum {
  id: string
  name: string
  artists: Array<{ name: string }>
  images: Array<{ url: string }>
  release_date: string
  total_tracks: number
}

interface PlaybackState {
  is_playing: boolean
  progress_ms: number
  item: SpotifyTrack | null
  device: {
    id: string
    name: string
    type: string
    volume_percent: number
  } | null
}

const SpotifyPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [recentTracks, setRecentTracks] = useState<SpotifyTrack[]>([])
  const [topTracks, setTopTracks] = useState<SpotifyTrack[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{
    tracks: SpotifyTrack[]
    albums: SpotifyAlbum[]
    playlists: SpotifyPlaylist[]
  }>({ tracks: [], albums: [], playlists: [] })
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library'>('home')
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [devices, setDevices] = useState<any[]>([]) // eslint-disable-line @typescript-eslint/no-explicit-any
  const [activeDevice, setActiveDevice] = useState<string | null>(null)
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const [webPlayerDeviceId, setWebPlayerDeviceId] = useState<string | null>(null)

  // Check authentication status
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Refresh current playback every 5 seconds
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      const token = await window.api.spotify.getToken()
      if (token) {
        await fetchCurrentPlayback(token)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (token) {
        setIsAuthenticated(true)
        await Promise.all([
          fetchUserProfile(token),
          fetchCurrentPlayback(token),
          fetchUserPlaylists(token),
          fetchRecentlyPlayed(token),
          fetchTopTracks(token),
          fetchAvailableDevices(token)
        ])
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const authResult = await window.api.spotify.authenticate()
      if (authResult.success) {
        setIsAuthenticated(true)
        await checkAuthStatus()
      }
    } catch (error) {
      console.error('Authentication failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserProfile = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
  }

  const fetchCurrentPlayback = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok && response.status !== 204) {
        const playbackData: PlaybackState = await response.json()
        setCurrentTrack(playbackData.item)
        setIsPlaying(playbackData.is_playing)
        setProgress(playbackData.progress_ms)
        if (playbackData.device) {
          setVolume(playbackData.device.volume_percent)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current playback:', error)
    }
  }

  const fetchUserPlaylists = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error)
    }
  }

  const fetchRecentlyPlayed = async (token: string): Promise<void> => {
    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=10',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setRecentTracks(data.items.map((item: any) => item.track)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    } catch (error) {
      console.error('Failed to fetch recently played:', error)
    }
  }

  const fetchTopTracks = async (token: string): Promise<void> => {
    try {
      const response = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      if (response.ok) {
        const data = await response.json()
        setTopTracks(data.items)
      }
    } catch (error) {
      console.error('Failed to fetch top tracks:', error)
    }
  }

  const fetchAvailableDevices = async (token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices)

        // Set active device if one is found
        const active = data.devices.find((device: any) => device.is_active) // eslint-disable-line @typescript-eslint/no-explicit-any
        if (active) {
          setActiveDevice(active.id)
        } else if (data.devices.length > 0) {
          // If no active device, show device selector
          setShowDeviceSelector(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error)
    }
  }

  const searchSpotify = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults({ tracks: [], albums: [], playlists: [] })
      return
    }

    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,album,playlist&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setSearchResults({
          tracks: data.tracks?.items || [],
          albums: data.albums?.items || [],
          playlists: data.playlists?.items || []
        })
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const fetchPlaylistTracks = async (playlistId: string): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setPlaylistTracks(data.items.map((item: any) => item.track).filter((track: any) => track)) // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    } catch (error) {
      console.error('Failed to fetch playlist tracks:', error)
    }
  }

  const playTrack = async (uri: string): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      // Prefer web player device if available
      const targetDevice = webPlayerDeviceId || activeDevice

      if (!targetDevice) {
        // If no web player and no other devices, show device selector
        if (devices.length === 0 && !webPlayerDeviceId) {
          alert('Loading web player... Please wait a moment and try again.')
          return
        }
        setShowDeviceSelector(true)
        return
      }

      const response = await fetch('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [uri],
          device_id: targetDevice
        })
      })

      if (!response.ok) {
        if (response.status === 404) {
          alert(
            'No active Spotify device found. Please start playing music on Spotify first, then try again.'
          )
          // Refresh devices
          await fetchAvailableDevices(token)
        } else {
          console.error('Playback failed:', response.status, response.statusText)
        }
      }
    } catch (error) {
      console.error('Failed to play track:', error)
    }
  }

  const selectDevice = async (deviceId: string): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      // Transfer playback to selected device
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false
        })
      })

      setActiveDevice(deviceId)
      setShowDeviceSelector(false)
    } catch (error) {
      console.error('Failed to select device:', error)
    }
  }

  const togglePlayback = async (): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      const endpoint = isPlaying ? 'pause' : 'play'
      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('Failed to toggle playback:', error)
    }
  }

  const skipTrack = async (direction: 'next' | 'previous'): Promise<void> => {
    try {
      const token = await window.api.spotify.getToken()
      if (!token) return

      await fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      console.error(`Failed to skip ${direction}:`, error)
    }
  }

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const TrackItem: React.FC<{ track: SpotifyTrack; showAlbum?: boolean }> = ({
    track,
    showAlbum = true
  }) => (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer group"
      onClick={() => playTrack(track.uri)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {track.album.images[0] && (
        <img src={track.album.images[0].url} alt={track.album.name} className="w-12 h-12 rounded" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{track.name}</p>
        <p className="text-sm text-gray-400 truncate">
          {track.artists.map((artist) => artist.name).join(', ')}
          {showAlbum && ` • ${track.album.name}`}
        </p>
      </div>
      <span className="text-sm text-gray-400">{formatDuration(track.duration_ms)}</span>
      <button className="opacity-0 group-hover:opacity-100 text-green-500 hover:text-green-400 transition-opacity">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </motion.div>
  )

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
        <SpotifyIcon width={80} height={80} fill="#1DB954" className="mb-6" />
        <h1 className="text-4xl font-bold mb-4">Connect to Spotify</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          Connect your Spotify account to browse your music, playlists, and control playback
        </p>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-colors flex items-center gap-3"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <SpotifyIcon width={24} height={24} fill="white" />
              Connect to Spotify
            </>
          )}
        </button>
      </div>
    )
  }

  const handleWebPlayerReady = async (deviceId: string): Promise<void> => {
    console.log('Web player ready with device ID:', deviceId)
    setWebPlayerDeviceId(deviceId)

    // Automatically transfer playback to web player
    try {
      const token = await window.api.spotify.getToken()
      if (token) {
        await transferPlaybackToDevice(deviceId, token)
      }
    } catch (error) {
      console.error('Failed to transfer playback to web player:', error)
    }
  }

  const transferPlaybackToDevice = async (deviceId: string, token: string): Promise<void> => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: true // Continue playing on new device
        })
      })

      if (response.ok) {
        setActiveDevice(deviceId)
        console.log('Successfully transferred playback to web player')
      } else {
        console.error('Failed to transfer playback:', response.status)
      }
    } catch (error) {
      console.error('Error transferring playback:', error)
    }
  }

  const handlePlayerStateChange = (state: {
    track_window: { current_track: SpotifyTrack }
    paused: boolean
    position: number
  }): void => {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    if (state) {
      setCurrentTrack(state.track_window.current_track)
      setIsPlaying(!state.paused)
      setProgress(state.position)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Spotify Web Player - Hidden but manages audio playback */}
      {isAuthenticated && (
        <SpotifyWebPlayer
          onPlayerReady={handleWebPlayerReady}
          onPlayerStateChange={handlePlayerStateChange}
        />
      )}
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <SpotifyIcon width={32} height={32} fill="#1DB954" />
          <h1 className="text-2xl font-bold">Spotify</h1>
        </div>

        {/* Navigation */}
        <nav className="flex gap-1">
          {[
            { id: 'home', label: 'Home', icon: '🏠' },
            { id: 'search', label: 'Search', icon: '🔍' },
            { id: 'library', label: 'Library', icon: '📚' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>

        {/* Controls and User Profile */}
        <div className="flex items-center gap-4">
          {/* Transfer to Web Player Button */}
          {webPlayerDeviceId && activeDevice !== webPlayerDeviceId && (
            <button
              onClick={async () => {
                const token = await window.api.spotify.getToken()
                if (token) {
                  await transferPlaybackToDevice(webPlayerDeviceId, token)
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 5-5v10zm2-5l5-5v10l-5-5z" />
              </svg>
              Play Here
            </button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3">
            {user?.images?.[0] && (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="font-medium">{user?.display_name}</span>
            <button
              onClick={async () => {
                await window.api.spotify.logout()
                window.location.reload()
              }}
              className="text-sm text-gray-400 hover:text-white ml-2"
            >
              Reconnect
            </button>
          </div>
        </div>
      </header>

      {/* Device Selector Modal */}
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Select a Device</h3>
            <p className="text-gray-400 mb-4">Choose where to play music:</p>
            <div className="space-y-2">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => selectDevice(device.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-400">{device.type}</p>
                  </div>
                  {device.is_active && <span className="text-green-500 text-sm">Active</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDeviceSelector(false)}
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Recently Played */}
                {recentTracks.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
                    <div className="space-y-2">
                      {recentTracks.slice(0, 5).map((track, index: number) => (
                        <TrackItem key={`recent-${track.id}-${index}`} track={track} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Top Tracks */}
                {topTracks.length > 0 && (
                  <section>
                    <h2 className="text-2xl font-bold mb-4">Your Top Tracks</h2>
                    <div className="space-y-2">
                      {topTracks.slice(0, 5).map((track, index: number) => (
                        <TrackItem key={`top-${track.id}-${index}`} track={track} />
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for songs, artists, albums..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setSearchQuery(e.target.value)
                      searchSpotify(e.target.value)
                    }}
                    className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg pl-12 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                {/* Search Results */}
                {searchResults.tracks.length > 0 && (
                  <section>
                    <h3 className="text-xl font-bold mb-4">Tracks</h3>
                    <div className="space-y-2">
                      {searchResults.tracks.map((track: SpotifyTrack) => (
                        <TrackItem key={track.id} track={track} />
                      ))}
                    </div>
                  </section>
                )}
              </motion.div>
            )}

            {activeTab === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {selectedPlaylist ? (
                  /* Playlist Detail View */
                  <div>
                    <button
                      onClick={() => {
                        setSelectedPlaylist(null)
                        setPlaylistTracks([])
                      }}
                      className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Back to Library
                    </button>

                    <div className="flex items-start gap-6 mb-8">
                      {selectedPlaylist.images[0] && (
                        <img
                          src={selectedPlaylist.images[0].url}
                          alt={selectedPlaylist.name}
                          className="w-48 h-48 rounded-lg shadow-2xl"
                        />
                      )}
                      <div>
                        <h1 className="text-4xl font-bold mb-2">{selectedPlaylist.name}</h1>
                        <p className="text-gray-400 mb-4">{selectedPlaylist.description}</p>
                        <p className="text-sm text-gray-500">
                          By {selectedPlaylist.owner.display_name} • {selectedPlaylist.tracks.total}{' '}
                          songs
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {playlistTracks.map((track, index: number) => (
                        <div key={track.id} className="flex items-center gap-4">
                          <span className="text-gray-400 w-6 text-center">{index + 1}</span>
                          <TrackItem track={track} showAlbum={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Playlists Grid */
                  <div>
                    <h2 className="text-2xl font-bold mb-6">Your Playlists</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {playlists.map((playlist) => (
                        <motion.div
                          key={playlist.id}
                          className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedPlaylist(playlist)
                            fetchPlaylistTracks(playlist.id)
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {playlist.images[0] ? (
                            <img
                              src={playlist.images[0].url}
                              alt={playlist.name}
                              className="w-full aspect-square rounded-lg mb-4"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-gray-600 rounded-lg mb-4 flex items-center justify-center">
                              <svg
                                className="w-12 h-12 text-gray-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                              </svg>
                            </div>
                          )}
                          <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">
                            {playlist.tracks.total} songs
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Now Playing Bar */}
      {currentTrack && (
        <div className="bg-gray-900 border-t border-gray-800 p-4">
          <div className="flex items-center justify-between">
            {/* Track Info */}
            <div className="flex items-center gap-4 flex-1">
              {currentTrack.album.images[0] && (
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  className="w-14 h-14 rounded"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{currentTrack.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {currentTrack.artists.map((artist) => artist.name).join(', ')}
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-4">
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
                className="bg-white text-black rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
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

            {/* Progress Bar */}
            <div className="flex-1 mx-6">
              <div className="w-full bg-gray-700 rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-1000"
                  style={{ width: `${(progress / currentTrack.duration_ms) * 100}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            <div className="text-sm text-gray-400 min-w-0">
              {formatDuration(progress)} / {formatDuration(currentTrack.duration_ms)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpotifyPage
