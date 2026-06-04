"use client"

import { AIHealthSummaryCard } from "@/components/ai/feature3-health-summary"
import { plantDocuments } from "@/lib/data"
import { cn } from "@/lib/utils"
import { ChevronLeft, ExternalLink, PanelLeftClose, Search } from "lucide-react"

export interface UnitContextPanelProps {
  isOpen: boolean
  onToggle: () => void
  unitName: string
  className?: string
}

const collapseButtonClass = cn(
  "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
  "text-muted-foreground hover:text-foreground hover:bg-secondary",
  "transition-colors duration-150"
)

export function UnitContextPanel({
  isOpen,
  onToggle,
  unitName,
  className,
}: UnitContextPanelProps) {
  if (!isOpen) {
    return (
      <div
        className={cn(
          "w-8 flex-shrink-0 bg-card border-l border-border flex flex-col items-center pt-3",
          "transition-all duration-300 ease-in-out",
          className
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open unit context panel"
          className={collapseButtonClass}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-72 flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-border flex-shrink-0 min-h-[52px]">
        <span className="font-semibold text-sm text-foreground truncate pr-2">
          {unitName}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Close unit context panel"
          className={collapseButtonClass}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <AIHealthSummaryCard level="plant" />
        <h3 className="font-semibold text-foreground mb-4">Unit Information</h3>
        <div className="space-y-2 mb-4">
          {[75, 60, 85, 45, 70].map((width, i) => (
            <div key={i} className="h-3 bg-muted rounded" style={{ width: `${width}%` }} />
          ))}
        </div>
        <hr className="border-border my-4" />

        <div className="space-y-2 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
              <div className="flex-1 flex gap-2">
                <div className="h-3 bg-muted rounded flex-1" />
                <div className="h-3 bg-muted rounded flex-1" />
                <div className="h-3 bg-muted rounded flex-1" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-foreground">Unit Documents</h4>
          <button
            type="button"
            className="p-1.5 hover:bg-secondary rounded transition-colors"
            aria-label="Search unit documents"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {plantDocuments.map((doc, i) => (
            <button
              key={i}
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm text-foreground transition-colors"
            >
              <span className="truncate">{doc.name}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
