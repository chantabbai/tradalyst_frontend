"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  const themes = [
    { name: 'light', icon: Sun },
    { name: 'dark', icon: Moon },
    { name: 'system', icon: Monitor }
  ]

  return (
    <div className="flex items-center gap-1 p-1">
      {themes.map(({ name, icon: Icon }) => (
        <motion.button
          key={name}
          onClick={() => setTheme(name)}
          className={cn(
            "p-2 rounded-md transition-colors",
            theme === name 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon className="h-4 w-4" />
        </motion.button>
      ))}
    </div>
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}