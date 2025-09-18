import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ThemeProvider } from './components/ThemeProvider'
import RoomContextProvider from './contexts/RoomContentContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RoomContextProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </RoomContextProvider>
    </HashRouter>
  </StrictMode>
)
