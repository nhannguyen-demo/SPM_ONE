"use client"

import type { ActiveModule } from "@/lib/store"
import type { ReactNode } from "react"
import { BarChart3, Building2, Home, LayoutDashboard, MessageSquare, Settings } from "lucide-react"

export const MODULES: {
  key: ActiveModule
  icon: ReactNode
  label: string
}[] = [
  { key: "home", icon: <Home className="w-5 h-5" />, label: "Home" },
  { key: "assets", icon: <Building2 className="w-5 h-5" />, label: "Assets" },
  { key: "workspace", icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard" },
  { key: "insights", icon: <BarChart3 className="w-5 h-5" />, label: "Tools" },
  { key: "comms", icon: <MessageSquare className="w-5 h-5" />, label: "Comms" },
  { key: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
]

export const NAV_SEARCH_PLACEHOLDERS: Record<ActiveModule, string> = {
  home: "Search home…",
  assets: "Search assets…",
  workspace: "Search dashboards…",
  insights: "Search tools…",
  comms: "Search messages…",
  settings: "Search settings…",
}

export function navMatches(label: string, q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return label.toLowerCase().includes(s)
}
