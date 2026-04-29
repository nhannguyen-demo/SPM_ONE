"use client"

import { useCallback, useMemo, useState } from "react"
import { Responsive as ResponsiveGridLayout, type LayoutItem } from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useAppStore, type WhatIfRunSession } from "@/lib/store"
import { getEquipmentTypeKey } from "@/lib/data"
import {
  WidgetErrorBoundary,
} from "@/components/dashboard/widget-view-resolver"
import { DashboardWidgetBody } from "@/components/dashboard/dashboard-widget-body"
import { DEFAULT_GRIDS } from "@/components/dashboard/layouts"
import { cn } from "@/lib/utils"
import type { WorkspaceDashboard } from "@/lib/workspace/types"

const ROW_HEIGHT = 70
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 12, sm: 12, xs: 6, xxs: 4 }

/**
 * Read-only renderer for a Workspace dashboard's widget grid. Used by:
 * - Full-Screen Dashboard Viewer (`/dashboards/[id]/full`)
 * - Workspace `DashboardPopup`
 * - Equipment Home Page dashboard popup (with `viewedDataIds` + scoped `scenarioRuns`)
 *
 * Reuses `DashboardWidgetBody` / `CokerTemplateView` so catalog tiles match the editor.
 */
export function ResponsiveDashboardGrid({
  dashboard,
  viewedDataIds,
  scenarioRuns: scenarioRunsProp,
  useEmptyFallback = true,
  emptyStateMessage,
}: {
  dashboard: WorkspaceDashboard
  /** When set, forwarded to legacy widgets for What-If overlay (Equipment Home popup). */
  viewedDataIds?: string[]
  /**
   * When set, used for WIS run lookup in legacy widgets. When omitted, all store runs
   * are passed (Workspace / full-screen).
   */
  scenarioRuns?: WhatIfRunSession[]
  /**
   * When true (default) and `dashboard.widgets` is empty, show seed demo layout.
   * Set false for Equipment Home so a truly empty published dashboard shows the empty state.
   */
  useEmptyFallback?: boolean
  /** Override copy for the empty state (no widgets, or empty with useEmptyFallback false). */
  emptyStateMessage?: string
}) {
  const whatIfRunSessions = useAppStore((s) => s.whatIfRunSessions)
  const scenarioRuns = scenarioRunsProp ?? whatIfRunSessions
  const coker = getEquipmentTypeKey(dashboard.equipmentId) === "coker"
  const widgets = useMemo(() => {
    if (dashboard.widgets.length > 0) return dashboard.widgets
    if (useEmptyFallback === false) return []
    const fallback = DEFAULT_GRIDS["Demo Engineer Team's Dashboard"] ?? []
    return fallback
  }, [dashboard.widgets, useEmptyFallback])

  const [width, setWidth] = useState(1200)
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setWidth(w)
    })
    observer.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  if (widgets.length === 0) {
    return (
      <div className="h-full min-h-[12rem] flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
        {emptyStateMessage ?? "This dashboard is empty. Open the editor to add widgets."}
      </div>
    )
  }

  const layouts = {
    lg: widgets.map((w) => ({ ...w.layout, i: w.id, static: true })) as LayoutItem[],
  }

  return (
    <div className={cn("p-3", coker && "coker-bg")} ref={containerRef}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={Math.max(width - 24, 200)}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        isDraggable={false}
        isResizable={false}
        useCSSTransforms
        compactType="vertical"
      >
        {widgets.map((w) => (
          <div
            key={w.id}
            className={cn(
              "rounded-xl border shadow-sm overflow-hidden",
              coker && w.templateKey
                ? "bg-[hsl(var(--coker-card))] border-[hsl(var(--coker-border))] coker-theme"
                : "bg-card border-border"
            )}
          >
            <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              {w.title || "Widget"}
            </div>
            <div className="h-[calc(100%-30px)] p-2 min-h-0">
              <WidgetErrorBoundary>
                <DashboardWidgetBody
                  widget={w}
                  equipmentId={dashboard.equipmentId}
                  scenarioRuns={scenarioRuns}
                  viewedDataIds={viewedDataIds}
                  context={dashboard.dashboardContext ?? undefined}
                />
              </WidgetErrorBoundary>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}
