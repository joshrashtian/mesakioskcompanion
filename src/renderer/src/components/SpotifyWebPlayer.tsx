import { useEffect, useState } from 'react'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume: number
      }) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (...args: any[]) => void) => void
  removeListener: (event: string, callback?: (...args: any[]) => void) => void
  connect: () => Promise<boolean>
  disconnect: () => void
  getCurrentState: () => Promise<SpotifyPlayerState | null>
  setName: (name: string) => Promise<void>
  getVolume: () => Promise<number>
  setVolume: (volume: number) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  togglePlay: () => Promise<void>
  seek: (position: number) => Promise<void>
  previousTrack: () => Promise<void>
  nextTrack: () => Promise<void>
}

interface SpotifyPlayerState {
  context: {
    uri: string
    metadata: any
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: {
      id: string
      uri: string
      name: string
      album: {
        uri: string
        name: string
        images: Array<{ url: string }>
      }
      artists: Array<{ uri: string; name: string }>
      duration_ms: number
    }
    previous_tracks: any[]
    next_tracks: any[]
  }
}

interface SpotifyWebPlayerProps {
  onPlayerReady?: (deviceId: string) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  onPlayerStateChange?: (state: SpotifyPlayerState | null) => void
}

const SpotifyWebPlayer: React.FC<SpotifyWebPlayerProps> = ({
  onPlayerReady,
  onPlayerStateChange
}) => {
  const [player, setPlayer] = useState<SpotifyPlayer | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (player) return // Prevent multiple initializations

    const initializePlayer = (): void => {
      console.log('Initializing Spotify Web Player...')
      if (!window.Spotify) {
        console.error('Spotify Web Playback SDK not loaded, retrying...')
        setTimeout(initializePlayer, 1000) // Retry in 1 second
        return
      }
      console.log('Spotify SDK loaded, creating player...')

      const spotifyPlayer = new window.Spotify.Player({
        name: 'Mesa Kiosk Player',
        getOAuthToken: async (cb) => {
          console.log('Getting OAuth token for player...')
          const token = await window.api.spotify.getToken()
          if (token) {
            console.log('Token retrieved for player')
            cb(token)
          } else {
            console.error('No token available for player')
          }
        },
        volume: 0.5
      })

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('❌ Spotify Player Initialization Error:', message)
      })

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('❌ Spotify Authentication Error:', message)
        console.error(
          'This usually means you need Spotify Premium or the streaming scope is missing'
        )
      })

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('❌ Spotify Account Error:', message)
        console.error('This usually means you need a Spotify Premium account')
      })

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('❌ Spotify Playback Error:', message)
      })

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', (state: SpotifyPlayerState | null) => {
        console.log('Player state changed:', state)
        if (onPlayerStateChange) {
          onPlayerStateChange(state)
        }
      })

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('🎵 Mesa Kiosk Player is READY! Device ID:', device_id)
        setDeviceId(device_id)
        setIsReady(true)
        if (onPlayerReady) {
          onPlayerReady(device_id)
        }
      })

      // Not Ready
      spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id)
        setIsReady(false)
      })

      // Connect to the player!
      spotifyPlayer.connect().then((success: boolean) => {
        if (success) {
          console.log('Successfully connected to Spotify!')
        }
      })

      setPlayer(spotifyPlayer)
    }

    // Wait for Spotify Web Playback SDK to load
    if (window.Spotify) {
      initializePlayer()
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer
    }

    return () => {
      if (player) {
        console.log('Disconnecting Spotify player...')
        player.disconnect() // eslint-disable-line @typescript-eslint/no-non-null-assertion
      }
    }
  }, [player])

  return null
}

export default SpotifyWebPlayer
