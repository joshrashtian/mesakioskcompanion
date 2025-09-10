import { useContext } from 'react'
import { Theme } from '@renderer/themes'
import { ThemeContext } from './ThemeProvider'

const useTheme = (): Theme => {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('Theme not found')
  return theme
}
export { useTheme }
