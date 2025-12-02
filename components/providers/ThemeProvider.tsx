'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  customTheme: string
  setCustomTheme: (theme: string) => void
  themes: Record<string, any>
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  customTheme: 'default',
  setCustomTheme: () => null,
  themes: {},
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'cirkel-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage?.getItem(storageKey) as Theme) || defaultTheme
  )
  const [customTheme, setCustomTheme] = useState<string>(
    () => localStorage?.getItem('cirkel-custom-theme') || 'default'
  )

  const themes = {
    default: {
      primary: 'hsl(221.2 83.2% 53.3%)',
      secondary: 'hsl(210 40% 96%)',
      accent: 'hsl(210 40% 96%)',
    },
    ocean: {
      primary: 'hsl(199 89% 48%)',
      secondary: 'hsl(197 37% 96%)',
      accent: 'hsl(197 37% 96%)',
    },
    forest: {
      primary: 'hsl(142 76% 36%)',
      secondary: 'hsl(138 76% 97%)',
      accent: 'hsl(138 76% 97%)',
    },
    sunset: {
      primary: 'hsl(24 95% 53%)',
      secondary: 'hsl(24 95% 97%)',
      accent: 'hsl(24 95% 97%)',
    },
    purple: {
      primary: 'hsl(262 83% 58%)',
      secondary: 'hsl(262 83% 97%)',
      accent: 'hsl(262 83% 97%)',
    },
    rose: {
      primary: 'hsl(330 81% 60%)',
      secondary: 'hsl(330 81% 97%)',
      accent: 'hsl(330 81% 97%)',
    },
  }

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, enableSystem])

  useEffect(() => {
    const root = window.document.documentElement
    const selectedTheme = themes[customTheme as keyof typeof themes]

    if (selectedTheme) {
      Object.entries(selectedTheme).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
      })
    }

    localStorage?.setItem('cirkel-custom-theme', customTheme)
  }, [customTheme, themes])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage?.setItem(storageKey, theme)
      setTheme(theme)
    },
    customTheme,
    setCustomTheme,
    themes,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}