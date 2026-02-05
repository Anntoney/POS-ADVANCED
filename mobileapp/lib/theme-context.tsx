import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Theme = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: Theme
  actualTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  colors: typeof lightColors
}

const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#666666',
  primary: '#007AFF',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF5252',
  border: '#dddddd',
  inputBackground: '#f5f5f5',
  shadow: '#000000',
}

const darkColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#aaaaaa',
  primary: '#0A84FF',
  success: '#32D74B',
  warning: '#FF9F0A',
  error: '#FF453A',
  border: '#333333',
  inputBackground: '#2c2c2c',
  shadow: '#000000',
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme()
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme')
      if (savedTheme) {
        setThemeState(savedTheme as Theme)
      }
    } catch (error) {
      console.error('Failed to load theme:', error)
    }
  }

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme)
      setThemeState(newTheme)
    } catch (error) {
      console.error('Failed to save theme:', error)
    }
  }

  const actualTheme = theme === 'system' ? (systemTheme || 'light') : theme
  const colors = actualTheme === 'dark' ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
