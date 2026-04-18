import { createContext, useContext, useState, useEffect } from 'react'
import { Appearance } from 'react-native'
import { getItem, setItem } from '../utils/storage'
import { darkColors, lightColors } from '../constants/themes'

const STORAGE_KEY = 'vouch_appearance'

const ThemeContext = createContext({
  colors: darkColors,
  scheme: 'dark',
  preference: 'dark',
  setPreference: () => {},
  toggleTheme: () => {},
  isDark: true,
})

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('dark') // 'dark' | 'light' | 'system'
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() ?? 'dark')

  useEffect(() => {
    // Force dark mode — clear any stored light preference
    setItem(STORAGE_KEY, 'dark')
  }, [])

  // Listen for OS theme changes — applies when preference === 'system'
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'dark')
    })
    return () => sub.remove()
  }, [])

  const setPreference = async (pref) => {
    setPreferenceState(pref)
    await setItem(STORAGE_KEY, pref)
  }

  const toggleTheme = () => setPreference(preference === 'dark' ? 'light' : 'dark')

  const resolvedScheme = preference === 'system' ? systemScheme : preference
  const isDark = resolvedScheme === 'dark'
  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ colors, scheme: resolvedScheme, preference, setPreference, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
