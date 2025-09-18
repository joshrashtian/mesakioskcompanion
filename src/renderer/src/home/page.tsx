import { useRoomContext, useRoomAuth, useRoomExpiration } from '@renderer/hooks/useRoomContext'
import React from 'react'
import { VscPlug } from 'react-icons/vsc'
import { Link } from 'react-router-dom'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'
import RoomPasswordPrompt from '../components/RoomPasswordPrompt'
import RoomStatusBanner from '../components/RoomStatusBanner'

const HomePage = (): React.JSX.Element => {
  const { data } = useRoomContext()
  const { isAuthenticated, requiresPassword, authenticate } = useRoomAuth()
  const { expirationStatus, expirationDate, isAdmin, extendExpiration } = useRoomExpiration()

  // Show password prompt if room requires password and user is not authenticated
  if (requiresPassword && !isAuthenticated) {
    return (
      <RoomPasswordPrompt
        onAuthenticate={authenticate}
        error={data.error}
        roomName={data.room?.name}
      />
    )
  }

  return (
    <div className="bg-gradient-to-tr flex gap-3 flex-col items-center justify-center p-4 from-zinc-100 to-slate-300 min-h-screen w-full">
      {/* Room Status Banner */}
      <div className="w-full max-w-6xl">
        <RoomStatusBanner
          expirationStatus={expirationStatus}
          expirationDate={expirationDate}
          isAdmin={isAdmin}
          onExtendExpiration={extendExpiration}
          roomName={data.room?.name}
        />
      </div>

      <h1 className="text-7xl font-sans mb-10 font-black drop-shadow-lg text-red-500">
        MESA Kiosk
      </h1>

      <section className="grid grid-cols-3 gap-4 w-full max-w-6xl">
        <div className="col-span-2 bg-white shadow-md text-black rounded-lg h-32 p-4">
          <h2 className="text-2xl font-bold">Welcome to Mesa Kiosk</h2>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-semibold">{data.room?.name || 'Loading room...'}</p>
            {data.room?.location && (
              <p className="text-sm text-gray-600">📍 {data.room.location}</p>
            )}
            {data.room?.creator && (
              <p className="text-sm text-gray-500">Created by: {data.room.creator}</p>
            )}
            <div className="flex items-center space-x-4 mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  expirationStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : expirationStatus === 'expiring_soon'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {expirationStatus === 'active'
                  ? '✅ Active'
                  : expirationStatus === 'expiring_soon'
                    ? '⏰ Expiring Soon'
                    : '❌ Expired'}
              </span>
              {requiresPassword && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔒 Password Protected
                </span>
              )}
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👑 Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          to="/camera"
          className="col-span-1 bg-white hover:bg-zinc-100 transition-all duration-300 shadow-md text-black rounded-lg h-32 p-4"
        >
          <VscPlug className="text-4xl" />
          <h2 className="text-2xl font-bold text-black">HDMI</h2>
        </Link>
        <Link
          to="/spotify"
          className="col-span-1 bg-white hover:bg-zinc-100 transition-all duration-300 shadow-md text-green-600 flex flex-col justify-end items-start gap-2 rounded-lg h-32 p-4"
        >
          <SpotifyIcon width={42} height={42} fill="currentColor" />
          <h2 className="text-2xl font-bold">Spotify</h2>
        </Link>
      </section>
    </div>
  )
}

export default HomePage
