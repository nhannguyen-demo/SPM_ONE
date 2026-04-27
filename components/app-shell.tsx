"use client"

import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
import type { ReactNode } from "react"

/**
 * Shared chrome (sidebar + header) for App Router pages outside the legacy
 * single-page shell at `/`. Used by `/workspace/*` and `/comms/*`.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 min-w-0 flex overflow-hidden">{children}</main>
      </div>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
