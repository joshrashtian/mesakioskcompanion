import { useState } from 'react'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'
import RoomContextProvider from './contexts/RoomContentContext'
import RoomSelection from './components/RoomSelection'

const AppWrapper = (): React.JSX.Element => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(() => {
    // Check if a room was previously selected
    return localStorage.getItem('selectedRoomId')
  })

  const handleRoomSelect = (roomId: string): void => {
    setSelectedRoomId(roomId)
  }

  // Show room selection if no room is selected
  if (!selectedRoomId) {
    return <RoomSelection onRoomSelect={handleRoomSelect} />
  }

  // Show main app with selected room
  return (
    <RoomContextProvider roomId={selectedRoomId}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RoomContextProvider>
  )
}

export default AppWrapper
