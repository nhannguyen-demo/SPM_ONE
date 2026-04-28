"use client"

import { useParams } from "next/navigation"
import { useCallback, useState } from "react"
import { Eye } from "lucide-react"
import { sites } from "@/lib/data"
import { useAppStore } from "@/lib/store"
import {
  buildDefaultGrid,
  DEFAULT_WIDGET_SETS,
  type GridWidget,
} from "@/components/views/equipment-dashboard/layouts"
import {
  WidgetErrorBoundary,
  WidgetViewResolver,
} from "@/components/views/equipment-dashboard/widget-view-resolver"
import { Responsive as ResponsiveGridLayout, type Layout } from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { useRegisterViewerTab } from "@/lib/workspace/use-viewer-tabs"
import { getCurrentUserId } from "@/lib/workspace/identity"

/**
 * Full-screen viewer for *legacy* Equipment-Home dashboards (cardTag-based).
 *
 * URL: /equipment-dashboard/[equipmentId]/[tag]/full
 *
 * Registers cross-tab presence under the synthetic dashboardId
 * `equipment-${equipmentId}-${tag}` so the Equipment Home Page can show an
 * "open elsewhere" indicator on its dashboard cards (per the resolved open
 * question).
 */
export default function LegacyFullScreenDashboardPage() {
  const params = useParams<{ equipmentId: string; tag: string }>()
  const equipmentId = decodeURIComponent((params?.equipmentId as string) ?? "")
  const tag = decodeURIComponent((params?.tag as string) ?? "")

  const [gridWidth, setGridWidth] = useState(1200)
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setGridWidth(w)
    })
    observer.observe(node)
    setGridWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const equipment = sites
    .flatMap((s) => s.units.flatMap((p) => p.equipment.map((e) => ({ e, p, s }))))
    .find(({ e }) => e.id === equipmentId)

  const presenceKey = `equipment-${equipmentId}-${tag}`
  useRegisterViewerTab(presenceKey, getCurrentUserId())

  const whatIfRunSessions = useAppStore((s) => s.whatIfRunSessions)
  const equipmentRuns = whatIfRunSessions
    .filter((s) => s.equipmentId === equipmentId && s.status === "success")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  const widgetSet = DEFAULT_WIDGET_SETS[tag] ?? []
  const grid: GridWidget[] = buildDefaultGrid(widgetSet)
  const layouts: Layout = grid.map((gw) => gw.layout)

  if (!equipment) {
    return (
      <div className="h-screen flex items-center justify-center text-muted-foreground p-8 text-center">
        Equipment not found.
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">
            {equipment.s.name} › {equipment.p.name} › {equipment.e.name}
          </div>
          <h1 className="text-sm font-bold text-foreground truncate flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-primary" />
            {tag}
          </h1>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-auto bg-muted/20" ref={containerRef}>
        {grid.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            No widgets configured for this dashboard.
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layouts, md: layouts, sm: layouts }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={88}
            width={Math.max(gridWidth - 24, 200)}
            isDraggable={false}
            isResizable={false}
            compactType="vertical"
            margin={[10, 10]}
            containerPadding={[10, 10]}
          >
            {grid.map((gw) => (
              <div
                key={gw.id}
                className="bg-card rounded-xl border border-border/60 flex flex-col overflow-hidden shadow-sm"
              >
                <div className="flex items-center px-3 py-1.5 flex-shrink-0 bg-background/50 border-b border-border/40">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    {gw.title || "Widget"}
                  </span>
                </div>
                <div className="flex-1 min-h-0 p-2 overflow-hidden">
                  <WidgetErrorBoundary>
                    <WidgetViewResolver
                      viewType={gw.viewType}
                      equipmentId={equipmentId}
                      viewedDataIds={["live"]}
                      scenarioRuns={equipmentRuns}
                    />
                  </WidgetErrorBoundary>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>
    </div>
  )
}
