import { createContext, useContext, useState } from 'react'
import { useColorScheme } from 'react-native'
import { darkColors, lightColors } from '../constants/themes'

const ThemeContext = createContext({ colors: darkColors, scheme: 'dark', toggleTheme: () => {} })

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme() ?? 'dark'
  const [override, setOverride] = useState(null) // null = follow system

  const scheme = override ?? systemScheme
  const colors = scheme === 'light' ? lightColors : darkColors

  const toggleTheme = () => setOverride(s => (s ?? systemScheme) === 'dark' ? 'light' : 'dark')
  const setScheme = (s) => setOverride(s === 'system' ? null : s)

  return (
    <ThemeContext.Provider value={{ colors, scheme, toggleTheme, setScheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
