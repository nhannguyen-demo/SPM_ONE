"use client"

import { useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { Maximize2, Minimize2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { WidgetErrorBoundary } from "@/components/dashboard/widget-view-resolver"
import type { GridWidget } from "@/components/dashboard/layouts"
import type { DashboardTimeContext } from "@/components/dashboard/coker-template-view"
import { DashboardWidgetBody } from "@/components/dashboard/dashboard-widget-body"

// ---------------------------------------------------------------------------
// Trigger button — shown on hover in read-only grid
// ---------------------------------------------------------------------------

export function WidgetFocusTrigger({
  className,
  onClick,
}: {
  className?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title="Expand widget"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        "absolute bottom-2 right-2 z-10",
        "w-6 h-6 rounded flex items-center justify-center",
        "bg-background/80 border border-border shadow-sm",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        "hover:bg-secondary",
        className
      )}
    >
      <Maximize2 className="w-3 h-3 text-muted-foreground" />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Focus overlay — full-viewport lightbox
// ---------------------------------------------------------------------------

export function WidgetFocusOverlay({
  widget,
  equipmentId,
  context,
  onClose,
}: {
  widget: GridWidget
  equipmentId: string
  context?: DashboardTimeContext
  onClose: () => void
}) {
  const isCoker =
    widget.templateKey !== undefined ||
    widget.parameterId !== undefined ||
    widget.referenceWidgetId !== undefined

  // Press Escape to close
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
      role="dialog"
      aria-modal
      aria-label={widget.title ?? "Widget detail"}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          "relative flex flex-col w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden",
          isCoker
            ? "bg-[hsl(var(--coker-card))] border-[hsl(var(--coker-border))] coker-theme"
            : "bg-card border-border"
        )}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Minimize2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold truncate">{widget.title ?? "Widget"}</span>
            {widget.parameterId && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                {widget.parameterId.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded hover:bg-secondary transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          <WidgetErrorBoundary>
            <DashboardWidgetBody
              widget={widget}
              equipmentId={equipmentId}
              context={context}
            />
          </WidgetErrorBoundary>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Hook — manages focus state for a single widget
// ---------------------------------------------------------------------------

export function useWidgetFocus() {
  const [focusedWidget, setFocusedWidget] = useState<GridWidget | null>(null)

  const focus = useCallback((w: GridWidget) => setFocusedWidget(w), [])
  const blur = useCallback(() => setFocusedWidget(null), [])

  return { focusedWidget, focus, blur }
}
