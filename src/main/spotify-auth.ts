import { shell } from 'electron'
import { createServer, Server } from 'http'
import { URL } from 'url'

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
}

class SpotifyAuth {
  private clientId: string
  private clientSecret: string
  private redirectUri: string
  private scopes: string[] = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'user-read-private',
    'user-read-recently-played',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative',
    'streaming'
  ]

  private tokens: SpotifyTokens | null = null
  private server: Server | null = null

  constructor() {
    // Load credentials from environment variables
    this.clientId = process.env.SPOTIFY_CLIENT_ID || ''
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || ''
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000/callback'

    if (!this.clientId || !this.clientSecret) {
      console.error(
        'Spotify credentials not found in environment variables. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.'
      )
    }
  }

  async authenticate(): Promise<{ success: boolean; token?: string }> {
    return new Promise((resolve, reject) => {
      // Create authorization URL
      const authUrl = this.buildAuthUrl()

      // Start local server to handle callback
      this.startCallbackServer((code, error) => {
        if (error) {
          reject(new Error(error))
          return
        }

        if (code) {
          // Exchange authorization code for tokens
          this.exchangeCodeForTokens(code)
            .then((tokens) => {
              this.tokens = tokens
              resolve({ success: true, token: tokens.access_token })
            })
            .catch((err) => reject(err))
        }
      })

      // Open authorization URL in user's default browser
      shell.openExternal(authUrl)
    })
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      show_dialog: 'true'
    })

    const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`
    console.log('Generated auth URL:', authUrl)
    console.log('Redirect URI being sent:', this.redirectUri)
    return authUrl
  }

  private startCallbackServer(callback: (code?: string, error?: string) => void): void {
    this.server = createServer((req, res) => {
      const url = new URL(req.url!, `http://127.0.0.1:3000`)

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e22134;">Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `)
          callback(undefined, error)
        } else if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #1db954;">Successfully Connected to Spotify!</h1>
                <p>You can now close this window and return to the app.</p>
                <script>
                  setTimeout(() => window.close(), 3000);
                </script>
              </body>
            </html>
          `)
          callback(code)
        }

        // Close server after handling callback
        setTimeout(() => {
          this.server?.close()
          this.server = null
        }, 1000)
      }
    })

    this.server.listen(3000, '127.0.0.1', () => {
      console.log('OAuth HTTP callback server listening on 127.0.0.1:3000')
    })

    this.server.on('error', (err: { code: string }) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          'Port 3000 is already in use. Please close other applications using this port.'
        )
        callback(undefined, 'Port 3000 is already in use')
      } else {
        console.error('Server error:', err)
        callback(undefined, 'Failed to start callback server')
      }
    })
  }

  private async exchangeCodeForTokens(code: string): Promise<SpotifyTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000
    }
  }

  async refreshTokens(): Promise<string | null> {
    if (!this.tokens?.refresh_token) {
      return null
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.tokens.refresh_token
        })
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      this.tokens = {
        ...this.tokens,
        access_token: data.access_token,
        expires_in: data.expires_in,
        expires_at: Date.now() + data.expires_in * 1000
      }

      return this.tokens.access_token
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  async getValidToken(): Promise<string | null> {
    if (!this.tokens) {
      return null
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() >= this.tokens.expires_at - 300000) {
      console.log('Token expired, refreshing...')
      return await this.refreshTokens()
    }

    return this.tokens.access_token
  }

  logout(): void {
    this.tokens = null
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }

  isAuthenticated(): boolean {
    return this.tokens !== null
  }
}

export default SpotifyAuth
