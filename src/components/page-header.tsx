// src/components/page-header.tsx
"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/theme-toggle"

const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/life-areas": "Life Areas",
  "/goals": "Goals",
  "/tasks": "Tasks",
  "/reviews": "Reviews",
}

function titleFromPath(path: string) {
  const clean = path.replace(/\/$/, "")
  return labels[clean] || clean.split("/").slice(-1)[0]?.replace(/-/g, " ") || "Intent Living"
}

export default function PageHeader() {
  const pathname = usePathname()
  const title = titleFromPath(pathname || "/")

  return (
    <header className="sticky top-0 z-20 mb-4 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-none">
          <span className="text-gradient">{title}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="gradient" size="sm">New</Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
