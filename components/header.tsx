"use client"

import { Bell, Settings } from "lucide-react"
// FEATURE 2 — AI-Powered Search Bar Autocomplete
import { AISearchAutocomplete } from "@/components/ai/feature2-search-autocomplete"

export function Header() {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search Bar — FEATURE 2: wrapped with AI autocomplete */}
      <div className="flex-1 max-w-xl">
        <AISearchAutocomplete />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>
        <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}
