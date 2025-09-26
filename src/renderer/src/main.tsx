import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import AppWrapper from './AppWrapper'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppWrapper />
    </HashRouter>
  </StrictMode>
)
