import { useContext } from 'react'
import { RoomContext, type RoomContextType } from '../contexts/RoomContentContext'

export const useRoomContext = (): RoomContextType => {
  const context = useContext(RoomContext)

  if (!context) {
    throw new Error('useRoomContext must be used within a RoomContextProvider')
  }

  return context
}

// Convenience hooks for specific functionality
export const useRoomAuth = (): {
  isAuthenticated: boolean
  requiresPassword: boolean
  authenticate: (password: string) => Promise<boolean>
} => {
  const { data, authenticateRoom } = useRoomContext()
  return {
    isAuthenticated: data.isAuthenticated,
    requiresPassword: data.requiresPassword,
    authenticate: authenticateRoom
  }
}

export const useRoomExpiration = (): {
  expirationStatus: 'active' | 'expired' | 'expiring_soon'
  expirationDate?: string
  isAdmin: boolean
  extendExpiration: (hours: number) => Promise<boolean>
} => {
  const { data, extendRoomExpiration } = useRoomContext()
  return {
    expirationStatus: data.expirationStatus,
    expirationDate: data.room?.expiration_date,
    isAdmin: data.isAdmin,
    extendExpiration: extendRoomExpiration
  }
}
