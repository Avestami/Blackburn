'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      // Apply theme class to document element without overwriting existing classes
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      
      // Set CSS custom properties based on theme
      if (theme === 'light') {
        root.style.setProperty('--bg-color', '#ffffff')
        root.style.setProperty('--text-color', '#000000')
        root.style.setProperty('--text-secondary', '#666666')
        root.style.setProperty('--border-color', '#e5e7eb')
        root.style.setProperty('--node-color', '#dc267f') // Red nodes in light mode
        root.style.setProperty('--node-line-color', '#dc267f') // Red lines
        root.style.setProperty('--glow-color', '#dc267f')
        root.style.setProperty('--accent-color', '#dc267f')
        root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.9)')
        root.style.setProperty('--card-border', 'rgba(0, 0, 0, 0.1)')
      } else {
        root.style.setProperty('--bg-color', '#000000')
        root.style.setProperty('--text-color', '#ffffff')
        root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)')
        root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.2)')
        root.style.setProperty('--node-color', '#dc267f') // Red nodes in dark mode
        root.style.setProperty('--node-line-color', '#dc267f') // Red lines
        root.style.setProperty('--glow-color', '#dc267f')
        root.style.setProperty('--accent-color', '#dc267f')
        root.style.setProperty('--card-bg', 'rgba(0, 0, 0, 0.9)')
        root.style.setProperty('--card-border', 'rgba(255, 255, 255, 0.1)')
      }
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}