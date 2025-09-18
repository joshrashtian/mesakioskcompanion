import Versions from './components/Versions'
import CameraView from './components/CameraView'
import TabManager from './components/TabManager'
import SpotifyPage from './components/SpotifyPage'
import FloatingSpotifyPlayer from './components/FloatingSpotifyPlayer'
import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './home/page'
import { IoDesktop, IoGlobe, IoHome, IoSettings } from 'react-icons/io5'
import SpotifyIcon from '@renderer/assets/SVGs/SpotifyIcon'
import Magnetic from './components/Magnetic'
//import electronLogo from './assets/electron.svg'
//    import { useRoomContext } from './hooks/useRoomContext'

function App(): React.JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  //const { data } = useRoomContext()

  return (
    <>
      <div className="flex h-screen w-screen">
        <aside className="h-full w-[77px] pt-12 bg-zinc-900/90 border-r border-zinc-800 p-4 flex flex-col items-center gap-4">
          <Magnetic>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `w-14 h-14 rounded-xl flex    items-center justify-center text-3xl transition-colors duration-300 ${
                  isActive
                    ? ' bg-gradient-to-br from-orange-600 to-red-400 text-white shadow-lg'
                    : 'bg-white/10 text-orange-400 hover:bg-white/20 hover:text-orange-300'
                }`
              }
              aria-label="Home"
            >
              <IoHome />
            </NavLink>
          </Magnetic>
          <Magnetic>
            <NavLink
              to="/camera"
              className={({ isActive }) =>
                `w-14 h-14 rounded-xl flex    items-center justify-center text-3xl transition-colors duration-300 ${
                  isActive
                    ? ' bg-gradient-to-br from-orange-600 to-red-400 text-white shadow-lg'
                    : 'bg-white/10 text-orange-400 hover:bg-white/20 hover:text-orange-300'
                }`
              }
              aria-label="Home"
            >
              <IoDesktop />
            </NavLink>
          </Magnetic>
          <Magnetic>
            <NavLink
              to="/mesaconnect"
              className={({ isActive }) =>
                `w-14 h-14 rounded-xl flex    items-center justify-center text-3xl transition-colors duration-300 ${
                  isActive
                    ? ' bg-gradient-to-br from-orange-600 to-red-400 text-white shadow-lg'
                    : 'bg-white/10 text-orange-400 hover:bg-white/20 hover:text-orange-300'
                }`
              }
              aria-label="MesaConnect"
            >
              <IoGlobe />
            </NavLink>
          </Magnetic>
          <Magnetic>
            <NavLink
              to="/spotify"
              className={({ isActive }) =>
                `w-14 h-14 rounded-xl flex    items-center justify-center text-3xl transition-colors duration-300 ${
                  isActive
                    ? ' bg-gradient-to-br from-green-600 to-green-400 text-white shadow-lg'
                    : 'bg-white/10 text-green-400 hover:bg-white/20 hover:text-green-300'
                }`
              }
              aria-label="Spotify"
            >
              <SpotifyIcon width={28} height={28} fill="currentColor" />
            </NavLink>
          </Magnetic>
          <Magnetic>
            <NavLink
              to="/versions"
              className={({ isActive }) =>
                `w-14 h-14 rounded-xl flex    items-center justify-center text-3xl transition-colors duration-300 ${
                  isActive
                    ? ' bg-gradient-to-br from-orange-600 to-red-400 text-white shadow-lg'
                    : 'bg-white/10 text-orange-400 hover:bg-white/20 hover:text-orange-300'
                }`
              }
              aria-label="Settings"
            >
              <IoSettings />
            </NavLink>
          </Magnetic>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/versions" element={<Versions />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/mesaconnect" element={<TabManager />} />
            <Route path="/spotify" element={<SpotifyPage />} />
          </Routes>
        </main>
      </div>

      {/* Floating Spotify Player - overlays everything */}
      <FloatingSpotifyPlayer />
    </>
  )
}

export default App
