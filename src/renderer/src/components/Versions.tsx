import { useState } from 'react'
import { useRoomContext } from '@renderer/hooks/useRoomContext'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)
  const { data } = useRoomContext()

  const handleChangeRoom = (): void => {
    // Clear the selected room and reload the app to show room selection
    localStorage.removeItem('selectedRoomId')
    window.location.reload()
  }

  return (
    <div className="p-8 bg-gradient-to-tr from-zinc-100 to-slate-300 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-red-500 mb-8">Settings</h1>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Current Room</h2>
          <div className="space-y-2">
            <p className="text-lg font-semibold">{data.room?.name || 'Loading...'}</p>
            {data.room?.location && <p className="text-gray-600">📍 {data.room.location}</p>}
            <button
              onClick={handleChangeRoom}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors mt-4"
            >
              Change Room
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">System Information</h2>
          <ul className="space-y-2">
            <li className="text-gray-700">Electron v{versions.electron}</li>
            <li className="text-gray-700">Chromium v{versions.chrome}</li>
            <li className="text-gray-700">Node v{versions.node}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Versions
