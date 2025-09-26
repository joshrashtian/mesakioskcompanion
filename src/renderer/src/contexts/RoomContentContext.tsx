import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback
} from 'react'
import { supabase } from './SupabaseContext'

export type RoomData = {
  name: string
  location: string
  active: boolean
  admin: string[]
  created_at: string
  id: string
  event_connection?: string
  expiration_date?: string
  additional_data?: any
  password?: string
  creator?: string
  study_room?: string
  class_connection?: string
}

export interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  [key: string]: any
}

export interface UserPresence {
  online_at: string
  user_id: string
  user: string
  room_id: string
}

export interface EventData {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  [key: string]: any
}

export interface PomodoroState {
  active: boolean
  time: number
  break: boolean
}

export interface Room {
  messages: Message[]
  users: UserPresence[]
  id: string
  room: RoomData | null
  error: string | null
  isAdmin: boolean
  event?: EventData
  pomodoro: PomodoroState
  isAuthenticated: boolean
  requiresPassword: boolean
  expirationStatus: 'active' | 'expired' | 'expiring_soon'
}

interface RoomContextType {
  data: Room
  setData: Dispatch<SetStateAction<Room>>
  environment: any
  setEnvironment: Dispatch<SetStateAction<any>>
  authenticateRoom: (password: string) => Promise<boolean>
  extendRoomExpiration: (hours: number) => Promise<boolean>
}

const defaultRoomState: Room = {
  users: [],
  id: '',
  messages: [],
  room: null,
  error: null,
  isAdmin: false,
  pomodoro: {
    active: false,
    time: 0,
    break: false
  },
  isAuthenticated: false,
  requiresPassword: false,
  expirationStatus: 'active'
}

const RoomContext = createContext<RoomContextType>({
  data: defaultRoomState,
  setData: () => {},
  environment: null,
  setEnvironment: () => {},
  authenticateRoom: async () => false,
  extendRoomExpiration: async () => false
})

interface RoomContextProviderProps {
  children: React.ReactNode
  roomId: string
}

const RoomContextProvider = ({ children, roomId }: RoomContextProviderProps): React.JSX.Element => {
  const [data, setData] = useState<Room>({
    ...defaultRoomState,
    id: roomId || ''
  })

  const [environment, setEnvironment] = useState<any>(null)

  // Utility function to check expiration status
  const getExpirationStatus = useCallback(
    (expirationDate?: string): 'active' | 'expired' | 'expiring_soon' => {
      if (!expirationDate) return 'active'

      const now = new Date()
      const expiration = new Date(expirationDate)
      const timeDiff = expiration.getTime() - now.getTime()
      const hoursUntilExpiration = timeDiff / (1000 * 60 * 60)

      if (timeDiff < 0) return 'expired'
      if (hoursUntilExpiration <= 2) return 'expiring_soon' // Less than 2 hours
      return 'active'
    },
    []
  )

  // Password authentication function
  const authenticateRoom = useCallback(
    async (password: string): Promise<boolean> => {
      if (!roomId || !data.room?.password) return true // No password required

      try {
        console.log('Authenticating with password:', password, 'Expected:', data.room.password)
        // Simple password check - in production, you'd want to hash this
        const isValid = password === data.room.password

        if (isValid) {
          console.log('Password correct! Setting authenticated to true')
          setData((prev) => ({
            ...prev,
            isAuthenticated: true,
            error: null
          }))
          return true
        } else {
          console.log('Password incorrect')
          setData((prev) => ({
            ...prev,
            error: 'Incorrect password'
          }))
          return false
        }
      } catch (error) {
        console.error('Authentication error:', error)
        setData((prev) => ({
          ...prev,
          error: 'Authentication failed'
        }))
        return false
      }
    },
    [roomId, data.room?.password]
  )

  // Extend room expiration function
  const extendRoomExpiration = useCallback(
    async (hours: number): Promise<boolean> => {
      if (!roomId || !data.isAdmin) return false

      try {
        const newExpirationDate = new Date()
        newExpirationDate.setHours(newExpirationDate.getHours() + hours)

        const { error } = await supabase
          .from('room')
          .update({ expiration_date: newExpirationDate.toISOString() })
          .eq('id', parseInt(roomId))

        if (error) {
          console.error('Error extending room expiration:', error)
          return false
        }

        // Update local state
        setData((prev) => ({
          ...prev,
          room: prev.room
            ? {
                ...prev.room,
                expiration_date: newExpirationDate.toISOString()
              }
            : null,
          expirationStatus: getExpirationStatus(newExpirationDate.toISOString())
        }))

        return true
      } catch (error) {
        console.error('Error extending room expiration:', error)
        return false
      }
    },
    [roomId, data.isAdmin, getExpirationStatus]
  )

  const getData = useCallback(async (): Promise<void> => {
    if (!roomId) return

    console.log('getData called, current auth state:', data.isAuthenticated)

    try {
      const { data: room, error } = await supabase
        .from('room')
        .select('*')
        .eq('id', parseInt(roomId))
        .single()

      if (error) {
        setData((prev) => ({ ...prev, error: error.message }))
        return
      }

      const user = await supabase.auth.getUser()
      const userId = user.data.user?.id
      const isAdmin = userId ? room?.admin?.includes(userId) : false

      const expirationStatus = getExpirationStatus(room?.expiration_date)
      const requiresPassword = Boolean(room?.password)

      // Preserve existing authentication state if user was already authenticated
      // Only reset to false if the room no longer requires a password
      const isAuthenticated = !requiresPassword || data.isAuthenticated

      // Determine error message based on room status
      let errorMessage: string | null = null
      if (expirationStatus === 'expired') {
        errorMessage = 'Room has expired. Please check in with MESA.'
      } else if (expirationStatus === 'expiring_soon') {
        const expiration = new Date(room?.expiration_date || '')
        const hoursLeft = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60))
        errorMessage = `Room expires in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}. Consider extending the session.`
      } else if (requiresPassword && !isAuthenticated) {
        errorMessage = 'This room requires a password to access.'
      }

      setData((prev) => ({
        ...prev,
        room: room as RoomData,
        error: errorMessage,
        isAdmin,
        requiresPassword,
        // Preserve authentication state - only update if not currently authenticated or if password requirement changed
        isAuthenticated: !requiresPassword || prev.isAuthenticated,
        expirationStatus,
        pomodoro: { active: false, time: 0, break: false }
      }))

      if (room?.event_connection) {
        await getEvent(room.event_connection)
      }
    } catch (err) {
      console.error('Error fetching room data:', err)
      setData((prev) => ({
        ...prev,
        error: 'Failed to fetch room data'
      }))
    }
  }, [roomId, data.isAuthenticated, getExpirationStatus])

  // Pomodoro timer effect
  useEffect(() => {
    if (!data.pomodoro.active) return

    const interval = setInterval(() => {
      setData((prev) => {
        if (prev.pomodoro.time <= 0) {
          // Timer finished
          const sound = new Audio('/timerdone.mp3')
          sound.volume = 1
          sound.play().catch(console.error)

          return {
            ...prev,
            pomodoro: {
              active: false,
              break: !prev.pomodoro.break,
              time: !prev.pomodoro.break ? 5 * 60 : 25 * 60 // 5 min break or 25 min work
            }
          }
        }

        // Decrement timer
        return {
          ...prev,
          pomodoro: {
            ...prev.pomodoro,
            time: prev.pomodoro.time - 1
          }
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [data.pomodoro.active])

  const getEvent = async (eventId: string): Promise<void> => {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error) {
        console.error('Error fetching event:', error)
        return
      }

      setData((prev) => ({
        ...prev,
        event: event as EventData
      }))
    } catch (err) {
      console.error('Error fetching event data:', err)
    }
  }

  // Main effect for room setup and real-time subscriptions
  useEffect(() => {
    if (!roomId) return

    getData()
    const channel = supabase.channel(roomId)

    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const currentPresences: UserPresence[] = []

        Object.keys(presenceState).forEach((key) => {
          const presence = presenceState[key]
          if (presence && presence[0]) {
            const presenceData = presence[0] as any
            if (
              presenceData &&
              typeof presenceData === 'object' &&
              presenceData.online_at &&
              presenceData.user_id &&
              presenceData.user &&
              presenceData.room_id
            ) {
              currentPresences.push(presenceData as UserPresence)
            }
          }
        })

        setData((prev) => ({ ...prev, users: currentPresences }))
      })
      .on('broadcast', { event: 'message' }, (payload) => {
        setData((prev) => ({
          ...prev,
          messages: [...prev.messages, payload.payload as Message]
        }))
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room'
        },
        async (payload) => {
          console.log('Room updated:', payload)
          const newRoom = payload.new as RoomData

          setData((prev) => {
            const requiresPassword = Boolean(newRoom.password)
            const expirationStatus = getExpirationStatus(newRoom.expiration_date)

            return {
              ...prev,
              room: newRoom,
              requiresPassword,
              expirationStatus,
              // Preserve authentication state unless password requirement changed
              isAuthenticated: !requiresPassword || prev.isAuthenticated
            }
          })

          if (newRoom.event_connection) {
            await getEvent(newRoom.event_connection)
          } else {
            setData((prev) => ({ ...prev, event: undefined }))
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            const { data: userInfo } = await supabase.auth.getUser()
            const user = userInfo.user

            if (user) {
              await channel.track({
                online_at: new Date().toISOString(),
                user_id: user.id,
                user:
                  user.user_metadata?.real_name ||
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  'Guest',
                room_id: roomId
              })
            }
          } catch (error) {
            console.error('Error tracking user presence:', error)
          }
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, getData, getExpirationStatus])

  return (
    <RoomContext.Provider
      value={{
        data,
        setData,
        environment,
        setEnvironment,
        authenticateRoom,
        extendRoomExpiration
      }}
    >
      {children}
    </RoomContext.Provider>
  )
}

// Export the context for use in the custom hook
export { RoomContext }
export type { RoomContextType }

export default RoomContextProvider
