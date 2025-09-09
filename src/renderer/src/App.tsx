import Versions from './components/Versions'
import CameraView from './components/CameraView'
import MesaConnectView from './components/MesaConnectView'
import { Routes, Route, NavLink } from 'react-router-dom'
import HomePage from './home/page'
import { IoCamera, IoDesktop, IoHome, IoSettings } from 'react-icons/io5'
import Magnetic from './components/Magnetic'
//import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  //const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

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
              <IoCamera />
            </NavLink>
          </Magnetic>
          <NavLink
            to="/versions"
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors duration-300 ${
                isActive
                  ? 'bg-orange-600 text-white shadow'
                  : 'text-orange-300 hover:bg-white/10 hover:text-orange-200'
              }`
            }
          >
            <IoSettings />
          </NavLink>
        </aside>
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/versions" element={<Versions />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/mesaconnect" element={<MesaConnectView />} />
          </Routes>
        </main>
      </div>
    </>
  )
}

export default App
