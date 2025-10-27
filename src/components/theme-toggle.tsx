// src/components/theme-toggle.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme")
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <Button
      variant="soft"
      size="sm"
      aria-label="Toggle theme"
      onClick={toggle}
      title={dark ? "Switch to light" : "Switch to dark"}
    >
      {dark ? "🌙" : "☀️"}
    </Button>
  )
}
