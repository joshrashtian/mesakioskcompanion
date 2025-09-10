import React from 'react'
import { Theme, themes } from '../themes'

export type ThemeProviderProps = {
  children: React.ReactNode
}

const ThemeContext = React.createContext<Theme | undefined>(undefined)
const ThemeProvider = ({ children }: ThemeProviderProps): React.JSX.Element => {
  return <ThemeContext.Provider value={themes[0]}>{children}</ThemeContext.Provider>
}

export { ThemeProvider, ThemeContext }
export default ThemeProvider
