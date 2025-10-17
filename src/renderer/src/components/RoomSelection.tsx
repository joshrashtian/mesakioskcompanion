import React, { useEffect, useState } from 'react'
import { supabase } from '../contexts/SupabaseContext'

import { motion, AnimatePresence } from 'framer-motion'
import { IoLockClosed } from 'react-icons/io5'
import { KioskSession } from '../types'
interface RoomSelectionProps {
  onRoomSelect: (roomId: string) => void
}

const RoomSelection: React.FC<RoomSelectionProps> = ({ onRoomSelect }) => {
  const [rooms, setRooms] = useState<KioskSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const selectSession = async (): Promise<void> => {
      try {
        setLoading(true)
        const { data: kioskSession, error: kioskSessionError } = await supabase
          .from('kiosk_session')
          .select('*')

        if (kioskSessionError) {
          setError(kioskSessionError.message)
          return
        }

        setRooms(kioskSession || [])
      } catch (err) {
        setError('Failed to fetch rooms')
        console.error('Error fetching rooms:', err)
      } finally {
        setLoading(false)
      }
    }

    selectSession()
  }, [])

  const handleRoomSelect = (room: KioskSession): void => {
    // Store the selected room in localStorage for future launches
    localStorage.setItem('selectedSessionId', room.id)
    localStorage.setItem('selectedRoomId', room.room_id)
    onRoomSelect(room.room_id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-zinc-100 to-slate-300 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Rooms...</h2>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-zinc-100 to-slate-300 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md"
        >
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Rooms</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-zinc-100 to-slate-300 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md"
        >
          <div className="text-gray-500 text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Rooms Available</h2>
          <p className="text-gray-600">There are currently no active rooms to join.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-zinc-100 to-slate-300 flex justify-center p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="  w-full max-w-8xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-red-500 mb-2">MESA Kiosk</h1>
          <p className="text-gray-600">Select Your Room</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 h-32  hover:border-red-300 hover:shadow-md  cursor-pointer"
                onClick={() => handleRoomSelect(room)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">{room.room_id}</h3>
                  <p className="text-sm text-gray-600">Session ID: {room.id}</p>
                </div>

                <div className="flex items-center justify-between">
                  {room.password && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <IoLockClosed /> Password Protected
                    </span>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Select Room
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Need help? Contact your MESA administrator.</p>
        </div>
      </motion.div>
    </div>
  )
}

export default RoomSelection
