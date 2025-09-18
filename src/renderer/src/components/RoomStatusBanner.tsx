import React from 'react'
import { IoWarning, IoTime, IoExtensionPuzzle } from 'react-icons/io5'

interface RoomStatusBannerProps {
  expirationStatus: 'active' | 'expired' | 'expiring_soon'
  expirationDate?: string
  isAdmin: boolean
  onExtendExpiration: (hours: number) => Promise<boolean>
  roomName?: string
}

const RoomStatusBanner: React.FC<RoomStatusBannerProps> = ({
  expirationStatus,
  expirationDate,
  isAdmin,
  onExtendExpiration,
  roomName
}) => {
  const handleExtend = async (hours: number): Promise<void> => {
    const success = await onExtendExpiration(hours)
    if (success) {
      // Show success message or handle UI update
      console.log(`Room extended by ${hours} hours`)
    }
  }

  const formatExpirationTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.ceil(diffMs / (1000 * 60))

    if (diffHours > 1) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
    } else {
      return 'expired'
    }
  }

  if (expirationStatus === 'active') {
    return null // Don't show banner for active rooms
  }

  return (
    <div
      className={`w-full p-4 border-l-4 ${
        expirationStatus === 'expired'
          ? 'bg-red-50 border-red-400'
          : 'bg-yellow-50 border-yellow-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`flex-shrink-0 ${
              expirationStatus === 'expired' ? 'text-red-400' : 'text-yellow-400'
            }`}
          >
            {expirationStatus === 'expired' ? (
              <IoWarning className="h-5 w-5" />
            ) : (
              <IoTime className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3
              className={`text-sm font-medium ${
                expirationStatus === 'expired' ? 'text-red-800' : 'text-yellow-800'
              }`}
            >
              {expirationStatus === 'expired' ? 'Room Expired' : 'Room Expiring Soon'}
            </h3>
            <div
              className={`mt-1 text-sm ${
                expirationStatus === 'expired' ? 'text-red-700' : 'text-yellow-700'
              }`}
            >
              {roomName && <span className="font-medium">{roomName}</span>}
              {expirationDate && (
                <span>
                  {roomName && ' - '}
                  {expirationStatus === 'expired'
                    ? 'Session has ended'
                    : `Expires in ${formatExpirationTime(expirationDate)}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdmin && expirationStatus !== 'expired' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleExtend(1)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <IoExtensionPuzzle className="h-3 w-3 mr-1" />
              +1 Hour
            </button>
            <button
              onClick={() => handleExtend(2)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <IoExtensionPuzzle className="h-3 w-3 mr-1" />
              +2 Hours
            </button>
          </div>
        )}
      </div>

      {expirationStatus === 'expired' && (
        <div className="mt-3 text-sm text-red-700">
          <p>
            This room session has ended. Please check in with MESA to extend or create a new
            session.
          </p>
        </div>
      )}
    </div>
  )
}

export default RoomStatusBanner
