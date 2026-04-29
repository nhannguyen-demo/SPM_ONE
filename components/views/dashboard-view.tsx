"use client"

import { useAppStore } from "@/lib/store"
import { LayoutDashboard, ArrowLeft, Construction } from "lucide-react"

export function WorkspaceView() {
  const { setCurrentView, currentPath } = useAppStore()

  const hasEquipmentContext = Boolean(currentPath.equipment)

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard className="w-8 h-8 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            The dashboard editing workspace is under construction. Full drag-and-drop
            dashboard authoring, version history, and collaborative editing will be
            available here soon.
          </p>
        </div>

        {/* Under construction badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium">
          <Construction className="w-4 h-4" />
          Coming Soon
        </div>

        {/* Back button */}
        {hasEquipmentContext && (
          <button
            onClick={() => setCurrentView("equipment-home")}
            className="flex items-center gap-2 mx-auto text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Equipment Home
          </button>
        )}
      </div>
    </div>
  )
}
