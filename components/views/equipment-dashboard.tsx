"use client"

import { useAppStore } from "@/lib/store"
import { sites, equipmentKPIs, dashboardCards, plantDocuments, getEquipmentDashboardThumbnail } from "@/lib/data"
import {
  Maximize2,
  Minimize2,
  GripVertical,
  Trash2,
  Plus,
  ExternalLink,
  Search,
  Bookmark,
} from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { ModuleLibrary, SPM_WIDGET_DRAG_TYPE, type LibraryModule } from "@/components/module-library"
import { Equipment3DViewer } from "@/components/equipment-3d"
import { cn } from "@/lib/utils"
import { useState, useCallback, useRef, type DragEvent } from "react"
import { Responsive as ResponsiveGridLayout, Layout, LayoutItem } from "react-grid-layout/legacy"

// CSS for react-grid-layout (must be imported here for Next.js)
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

// Recharts imports
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar, LineChart, Line, ComposedChart, Legend, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell
} from "recharts"
// FEATURE 6A — KPI Pill AI Badge Wrappers
// FEATURE 6B — Chart Anomaly Markers
import { AIKPIBadgeWrapper, AILineChartMarkers, AIBarChartThreshold } from "@/components/ai/feature6-ai-insight-overlay"

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & DEFAULT LAYOUTS
   ═══════════════════════════════════════════════════════════════════════════ */
type WidgetData = {
  id: string;
  viewType: string;
  title?: string;
}

type GridWidget = WidgetData & { layout: LayoutItem }

/** Maps widget library entries to dashboard view types and default grid size (cols × rows). */
const LIBRARY_MODULE_SPECS: Record<string, { viewType: string; w: number; h: number }> = {
  "column-chart": { viewType: "demo-bar", w: 4, h: 4 },
  "data-grid": { viewType: "data-grid", w: 6, h: 5 },
  "line-chart": { viewType: "mon-sensor-1", w: 4, h: 4 },
  "pie-chart": { viewType: "demo-pie", w: 4, h: 4 },
  "status-board": { viewType: "crack-flaws", w: 4, h: 4 },
  "summary-chart": { viewType: "demo-summary", w: 12, h: 3 },
  "tree-map": { viewType: "bulge-scatter", w: 6, h: 4 },
}

const RGL_DROP_PLACEHOLDER_ID = "__spm-dropping__"

// Generate a default grid layout for a tab's widgets
// Col layout: 12 columns. Each unit = 80px rowHeight
function buildDefaultGrid(widgets: WidgetData[]): GridWidget[] {
  const result: GridWidget[] = []
  let colCursor = 0
  let rowCursor = 0

  for (const w of widgets) {
    let cols = 4    // default chart width
    let rows = 4    // default chart height

    if (w.viewType.startsWith("kpi-")) {
      cols = 3
      rows = 2
    } else if (w.viewType === "equipment-3d") {
      cols = 6
      rows = 5
    } else if (w.viewType === "demo-summary" || w.viewType === "proc-stream") {
      cols = 12
      rows = 3
    } else if (w.viewType === "crack-flaws" || w.viewType === "fatigue-rem") {
      cols = 6
      rows = 3
    }

    // Wrap if it overflows the 12-col grid
    if (colCursor + cols > 12) {
      colCursor = 0
      rowCursor += rows // approximate — overflow will be handled by rgl
    }

    result.push({
      ...w,
      layout: { i: w.id, x: colCursor, y: rowCursor, w: cols, h: rows, minW: 2, minH: 2 } satisfies LayoutItem
    })

    colCursor += cols
    if (colCursor >= 12) {
      colCursor = 0
      rowCursor += rows
    }
  }
  return result
}

const DEFAULT_WIDGET_SETS: Record<string, WidgetData[]> = {
  "Demo Engineer Team's Dashboard": [
    { id: 'w-demo-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-demo-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-demo-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-demo-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-demo-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-demo-1', viewType: "demo-pie", title: "Process Distribution" },
    { id: 'w-demo-2', viewType: "demo-bar", title: "Performance Bar" },
    { id: 'w-demo-3', viewType: "demo-summary", title: "Summary KPIs" },
  ],
  "Monitoring": [
    { id: 'w-mon-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-mon-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-mon-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-mon-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-mon-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-mon-1', viewType: "mon-sensor-1", title: "Sensor Channel 1" },
    { id: 'w-mon-2', viewType: "mon-sensor-2", title: "Sensor Channel 2" },
    { id: 'w-mon-3', viewType: "mon-temp", title: "Temperature" },
  ],
  "Process": [
    { id: 'w-pro-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-pro-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-pro-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-pro-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-pro-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-pro-1', viewType: "proc-composed", title: "Process Overview" },
    { id: 'w-pro-2', viewType: "proc-stream", title: "Process Stream" },
  ],
  "Fatigue": [
    { id: 'w-fat-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-fat-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-fat-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-fat-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-fat-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-fat-1', viewType: "fatigue-trend", title: "Fatigue Trend" },
    { id: 'w-fat-2', viewType: "fatigue-cycle", title: "Cycle Count" },
    { id: 'w-fat-3', viewType: "fatigue-rem", title: "Remaining Life" },
  ],
  "Bulging": [
    { id: 'w-bul-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-bul-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-bul-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-bul-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-bul-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-bul-1', viewType: "bulge-bar", title: "Bulge Profile" },
    { id: 'w-bul-2', viewType: "bulge-scatter", title: "Thickness Map" },
  ],
  "Cracking": [
    { id: 'w-cra-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-cra-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-cra-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-cra-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-cra-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-cra-1', viewType: "crack-line", title: "Crack Growth" },
    { id: 'w-cra-2', viewType: "crack-flaws", title: "Flaw Regions" },
  ],
  "Overview": [
    { id: 'w-hcu-over-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-hcu-over-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-hcu-over-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-hcu-over-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-hcu-over-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-hcu-1', viewType: "demo-summary", title: "Summary" },
    { id: 'w-hcu-2', viewType: "demo-pie", title: "Distribution" },
    { id: 'w-hcu-3', viewType: "proc-stream", title: "Process Stream" },
  ],
  "Reactor Health": [
    { id: 'w-hcu-rea-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-hcu-rea-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-hcu-rea-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-hcu-rea-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-hcu-rea-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-hcu-4', viewType: "mon-temp", title: "Temperature" },
    { id: 'w-hcu-5', viewType: "crack-flaws", title: "Flaw Regions" },
  ],
  "Process Control": [
    { id: 'w-hcu-proc-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-hcu-proc-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-hcu-proc-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-hcu-proc-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-hcu-proc-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-hcu-6', viewType: "proc-composed", title: "Process Control" },
    { id: 'w-hcu-7', viewType: "bulge-scatter", title: "Thickness Map" },
  ],
  "Maintenance": [
    { id: 'w-hcu-main-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-hcu-main-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-hcu-main-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-hcu-main-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-hcu-main-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-hcu-8', viewType: "fatigue-rem", title: "Remaining Life" },
    { id: 'w-hcu-9', viewType: "fatigue-cycle", title: "Cycle Count" },
  ],
  "Pump Performance": [
    { id: 'w-pump-kpi-1', viewType: 'kpi-dmg', title: "Damage KPI" },
    { id: 'w-pump-kpi-2', viewType: 'kpi-relife', title: "Re-Life KPI" },
    { id: 'w-pump-kpi-3', viewType: 'kpi-date', title: "Install Date" },
    { id: 'w-pump-kpi-4', viewType: 'kpi-id', title: "Equipment ID" },
    { id: 'w-pump-3d-1', viewType: 'equipment-3d', title: "3D Viewer" },
    { id: 'w-pump-1', viewType: "demo-bar", title: "Performance" },
    { id: 'w-pump-2', viewType: "mon-sensor-1", title: "Vibration" },
    { id: 'w-pump-3', viewType: "demo-summary", title: "Summary" },
  ],
}

// Pre-build default grid layouts from widget sets
const DEFAULT_GRIDS: Record<string, GridWidget[]> = Object.fromEntries(
  Object.entries(DEFAULT_WIDGET_SETS).map(([tab, widgets]) => [tab, buildDefaultGrid(widgets)])
)

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */
export function EquipmentDashboard() {
  const {
    currentPath,
    setCurrentPath,
    viewMode,
    setViewMode,
    setWhatIfModalOpen,
    dashboardExpanded,
    setDashboardExpanded,
    toggleFavouriteDashboard,
    favouriteDashboardIds,
    addRecentDashboard,
  } = useAppStore()

  // Grid widget + layout state
  const [grids, setGrids] = useState<Record<string, GridWidget[]>>(DEFAULT_GRIDS)
  // Container width for RGL (measured via ResizeObserver or default)
  const [gridWidth, setGridWidth] = useState(900)
  /** Active library module during HTML5 drag (for drop preview size). */
  const dragModuleRef = useRef<LibraryModule | null>(null)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width
      if (width) setGridWidth(width)
    })
    observer.observe(node)
    // Initial measurement
    setGridWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  const site = sites.find((s) => s.id === currentPath.site)
  const plant = site?.plants.find((p) => p.id === currentPath.plant)
  const equipment = plant?.equipment.find((e) => e.id === currentPath.equipment)

  if (!site || !plant || !equipment) return null

  const tabThumbnailSrc = getEquipmentDashboardThumbnail(equipment.id)
  const activeTab = currentPath.tab || "Demo Engineer Team's Dashboard"
  const isEditMode = viewMode === "edit" || viewMode === "modules"

  // Find the dashboardCard that matches the current equipment + tab
  const activeCard = dashboardCards.find(
    (c) => c.equipId === equipment.id && c.tag === activeTab
  )
  const isBookmarked = activeCard ? favouriteDashboardIds.includes(activeCard.id) : false

  const handleTabChange = (tab: string) => {
    setCurrentPath({ ...currentPath, tab })
    // Track recent dashboards when user switches tab
    const card = dashboardCards.find((c) => c.equipId === equipment.id && c.tag === tab)
    if (card) addRecentDashboard(card.id)
  }

  // Current tab's grid widgets
  const currentGrid: GridWidget[] = grids[activeTab] || buildDefaultGrid(DEFAULT_WIDGET_SETS[activeTab] || [])

  // Layout objects only (for ReactGridLayout)
  const currentLayouts: Layout = currentGrid.map((gw) => gw.layout)

  const handleLayoutChange = (newLayout: Layout) => {
    setGrids((prev) => {
      const tabGrid = prev[activeTab] ? [...prev[activeTab]] : []
      const updated = tabGrid.map((gw) => {
        const found = newLayout.find((l) => l.i === gw.id)
        return found ? { ...gw, layout: found } : gw
      })
      return { ...prev, [activeTab]: updated }
    })
  }

  const removeWidget = (widgetId: string) => {
    setGrids((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter((gw) => gw.id !== widgetId),
    }))
  }

  const addWidgetFromLibrary = useCallback(
    (module: LibraryModule) => {
      const spec = LIBRARY_MODULE_SPECS[module.id] ?? { viewType: "generic", w: 4, h: 4 }
      const id = `w-new-${Date.now()}`
      const newWidget: GridWidget = {
        id,
        viewType: spec.viewType,
        title: module.name,
        layout: {
          i: id,
          x: 0,
          y: Infinity,
          w: spec.w,
          h: spec.h,
          minW: 2,
          minH: 2,
        },
      }
      setGrids((prev) => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), newWidget],
      }))
    },
    [activeTab]
  )

  const handleDropDragOver = useCallback((_e: DragEvent) => {
    const id = dragModuleRef.current?.id
    if (!id) return false
    const spec = LIBRARY_MODULE_SPECS[id]
    if (!spec) return { w: 4, h: 4 }
    return { w: spec.w, h: spec.h }
  }, [])

  const handleDropFromOutside = useCallback(
    (_layout: Layout, item: LayoutItem | undefined, e: Event) => {
      if (!item) return
      const de = e as unknown as DragEvent
      let module: LibraryModule | null = null
      try {
        const raw = de.dataTransfer?.getData(SPM_WIDGET_DRAG_TYPE)
        if (raw) module = JSON.parse(raw) as LibraryModule
      } catch {
        module = null
      }
      if (!module?.id && dragModuleRef.current) module = dragModuleRef.current
      dragModuleRef.current = null
      if (!module?.id) return

      const spec = LIBRARY_MODULE_SPECS[module.id] ?? { viewType: "generic", w: 4, h: 4 }
      const id = `w-new-${Date.now()}`
      const newLayoutItem: LayoutItem = {
        i: id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: 2,
        minH: 2,
      }
      setGrids((prev) => ({
        ...prev,
        [activeTab]: [
          ...(prev[activeTab] || []),
          {
            id,
            viewType: spec.viewType,
            title: module.name,
            layout: newLayoutItem,
          },
        ],
      }))
    },
    [activeTab]
  )

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto flex flex-col relative">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            {equipment.name} — {activeTab}
          </span>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                id="bookmark-dashboard-btn"
                onClick={() => activeCard && toggleFavouriteDashboard(activeCard.id)}
                disabled={!activeCard}
                title={isBookmarked ? "Remove from favourites" : "Add to favourites"}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isBookmarked
                    ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                    : "hover:bg-secondary text-muted-foreground"
                )}
                aria-label={isBookmarked ? "Remove from favourites" : "Favourite this dashboard"}
              >
                <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-amber-500")} />
              </button>
            )}
            {isEditMode ? (
              <button
                onClick={() => setViewMode("view")}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
              >
                Exit Editing
              </button>
            ) : (
              <button
                onClick={() => setViewMode("edit")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Edit Dashboard
              </button>
            )}
            <button
              onClick={() => setDashboardExpanded(!dashboardExpanded)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              aria-label={dashboardExpanded ? "Collapse dashboard" : "Expand dashboard"}
            >
              {dashboardExpanded
                ? <Minimize2 className="w-4 h-4 text-muted-foreground" />
                : <Maximize2 className="w-4 h-4 text-muted-foreground" />
              }
            </button>
          </div>
        </div>

        {/* Main Dashboard Grid Card */}
        <div className={cn(
          "bg-card rounded-xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col",
          dashboardExpanded ? "mb-0" : "mb-6"
        )}>
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" ref={containerRef}>
            {isEditMode && (
              <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-muted-foreground bg-primary/5 border-b border-border">
                <GripVertical className="w-3 h-3" />
                <span>Drag widgets to reposition — drag corners to resize</span>
              </div>
            )}
            <div className="p-2">
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: currentLayouts, md: currentLayouts, sm: currentLayouts }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={80}
                width={Math.max(gridWidth - 16, 200)}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                isDroppable={isEditMode}
                droppingItem={{
                  i: RGL_DROP_PLACEHOLDER_ID,
                  x: 0,
                  y: 0,
                  w: 4,
                  h: 4,
                  minW: 2,
                  minH: 2,
                }}
                draggableHandle=".widget-drag-handle"
                onLayoutChange={handleLayoutChange}
                onDrop={handleDropFromOutside}
                onDropDragOver={handleDropDragOver}
                compactType="vertical"
                margin={[10, 10]}
                containerPadding={[4, 4]}
              >
                {currentGrid.map(gw => (
                  <div key={gw.id} className={cn(
                    "bg-secondary/30 rounded-xl border border-border/60 flex flex-col overflow-hidden transition-shadow",
                    isEditMode && "border-border shadow-md ring-1 ring-primary/10 hover:ring-primary/30"
                  )}>
                    {/* Widget header bar */}
                    <div className={cn(
                      "flex items-center justify-between px-3 py-1.5 flex-shrink-0 bg-background/50 border-b border-border/40",
                      !isEditMode && "py-1"
                    )}>
                      {/* Drag handle + title */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isEditMode && (
                          <div className="widget-drag-handle cursor-grab active:cursor-grabbing flex-shrink-0">
                            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                          {gw.title || "Widget"}
                        </span>
                      </div>
                      {/* Remove button shown in edit mode */}
                      {isEditMode && (
                        <button
                          onClick={() => removeWidget(gw.id)}
                          className="flex-shrink-0 p-0.5 rounded hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                          title="Remove widget"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {/* Widget content */}
                    <div className="flex-1 min-h-0 p-2 overflow-hidden">
                      <WidgetViewResolver viewType={gw.viewType} equipmentId={equipment.id} />
                    </div>
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          </div>
        </div>

        {/* Regular bottom tab strip — hidden when expanded */}
        {!dashboardExpanded && (
          <div className="flex gap-3 overflow-x-auto pb-2 overflow-y-hidden">
            {dashboardCards.filter(c => c.equipId === equipment.id).map((card, idx) => (
              <button
                key={card.id}
                onClick={() => handleTabChange(card.tag)}
                className={cn(
                  "text-left transition-all rounded-xl border-2 border-transparent flex-shrink-0",
                  activeTab === card.tag && "border-primary shadow-md"
                )}
              >
                <DashboardCard card={card} cardIndex={idx} thumbnailSrc={tabThumbnailSrc} />
              </button>
            ))}
            <button className="flex-shrink-0 w-16 h-[min(100%,130px)] my-auto border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Slide-up expanded panel */}
        {dashboardExpanded && (
          <div className="absolute left-6 right-6 bottom-0 translate-y-[calc(100%-12px)] hover:translate-y-0 transition-transform duration-300 z-50 bg-background border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-xl px-6 py-4 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 h-4 cursor-pointer flex items-center justify-center">
              <div className="w-16 h-1.5 rounded-full bg-border/80" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {equipment.tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      activeTab === tab
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setDashboardExpanded(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground text-xs"
              >
                Collapse ↓
              </button>
            </div>

            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {dashboardCards.filter(c => c.equipId === equipment.id).map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => handleTabChange(card.tag)}
                  className={cn(
                    "text-left transition-all rounded-xl border-2 border-transparent flex-shrink-0",
                    activeTab === card.tag && "border-primary shadow-md"
                  )}
                >
                  <DashboardCard card={card} cardIndex={idx} thumbnailSrc={tabThumbnailSrc} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel Slot - Shared between Library and Info */}
      {!dashboardExpanded && (
        <div className="w-72 flex-shrink-0 bg-card border-l border-border flex flex-col overflow-hidden">
          {isEditMode ? (
            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
              <ModuleLibrary
                onAddModule={addWidgetFromLibrary}
                onWidgetDragStart={(m) => {
                  dragModuleRef.current = m
                }}
                onWidgetDragEnd={() => {
                  dragModuleRef.current = null
                }}
              />
            </div>
          ) : (
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="font-semibold text-foreground mb-4">Equipment Information</h3>
              <div className="space-y-2 mb-4">
                 <div className="h-3 bg-muted rounded w-3/4" />
                 <div className="h-3 bg-muted rounded w-1/2" />
                 <div className="h-3 bg-muted rounded w-5/6" />
                 <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <hr className="border-border my-4" />
              
              <div className="space-y-3 mb-6">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mr-1" />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded" />
                      <div className="h-3 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Equipment Document</h4>
                <button className="p-1.5 hover:bg-secondary rounded transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                {plantDocuments.map((doc, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm text-foreground transition-colors group"
                  >
                    <span className="truncate group-hover:text-primary transition-colors">{doc.name}</span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>

              <div className="mt-8 pb-12"> {/* Added padding to avoid AI Spark overlap */}
                <h4 className="font-medium text-foreground mb-3">What-If Scenarios</h4>
                <button
                   onClick={() => setWhatIfModalOpen(true)}
                   className="w-full py-4 px-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                >
                  Run What-If Scenarios
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function KPIPill({ label, value }: { label?: string; value: string }) {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full">
      {label && <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>}
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCKUP DASHBOARD VIEWS - Dynamic Resolver
   ═══════════════════════════════════════════════════════════════════════════ */

const mockLineData = [
  { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 }, { name: 'May', value: 600 }, { name: 'Jun', value: 700 },
]

const mockProcessData = [
  { time: '08:00', pressure: 120, throughput: 800 }, { time: '10:00', pressure: 130, throughput: 850 },
  { time: '12:00', pressure: 150, throughput: 900 }, { time: '14:00', pressure: 125, throughput: 870 },
  { time: '16:00', pressure: 140, throughput: 920 }, { time: '18:00', pressure: 110, throughput: 810 },
]

const mockScatterData = [
  { x: 10, y: 30, z: 200 }, { x: 20, y: 50, z: 260 }, { x: 30, y: 40, z: 400 },
  { x: 40, y: 60, z: 280 }, { x: 50, y: 30, z: 500 }, { x: 60, y: 80, z: 200 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const pieData = [
  { name: 'Process A', value: 400 },
  { name: 'Process B', value: 300 },
  { name: 'Process C', value: 300 },
  { name: 'Process D', value: 200 },
];

function WidgetViewResolver({ viewType, equipmentId }: { viewType: string, equipmentId?: string }) {
  switch (viewType) {
    case "kpi-dmg":
      return (
        <AIKPIBadgeWrapper kpiKey="dmg">
          <KPIPill label="DMG" value={equipmentKPIs.dmg} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-relife":
      return (
        <AIKPIBadgeWrapper kpiKey="reLife">
          <KPIPill label="Re-Life" value={equipmentKPIs.reLife} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-date":
      return (
        <AIKPIBadgeWrapper kpiKey="date">
          <KPIPill value={equipmentKPIs.date} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-id":
      return (
        <AIKPIBadgeWrapper kpiKey="id">
          <KPIPill label="ID" value={equipmentKPIs.id} />
        </AIKPIBadgeWrapper>
      );
    case "equipment-3d":
      return <Equipment3DViewer equipmentId={equipmentId} />;
    case "demo-pie":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "data-grid":
      return (
        <div className="h-full overflow-auto text-[11px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-1.5 font-medium">Tag</th>
                <th className="text-right p-1.5 font-medium">Value</th>
                <th className="text-right p-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tag: "T_in", value: "385 °C", status: "OK" },
                { tag: "P_shell", value: "2.1 bar", status: "OK" },
                { tag: "ΔP", value: "0.4 bar", status: "Warn" },
                { tag: "Flow", value: "120 t/h", status: "OK" },
              ].map((row) => (
                <tr key={row.tag} className="border-b border-border/60">
                  <td className="p-1.5 font-mono text-foreground">{row.tag}</td>
                  <td className="p-1.5 text-right tabular-nums">{row.value}</td>
                  <td className="p-1.5 text-right">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        row.status === "OK" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800"
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "demo-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "demo-summary":
      return (
        <div className="flex gap-4 items-center justify-around h-full">
          {[
            { label: 'OEE', val: '86%' },
            { label: 'Uptime', val: '99.9%' },
            { label: 'Quality', val: '98.5%' }
          ].map(k => (
            <div key={k.label} className="text-center">
              <div className="text-sm text-muted-foreground">{k.label}</div>
              <div className="text-3xl font-bold text-foreground">{k.val}</div>
            </div>
          ))}
        </div>
      );
    case "mon-sensor-1":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-sensor-2":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-temp":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Area type="monotone" dataKey="pressure" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-composed":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-stream":
      return (
        <div className="flex gap-4 overflow-x-auto h-full items-center">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[150px] p-4 bg-background rounded-lg border border-border shrink-0">
              <div className="text-xs text-muted-foreground mb-1">Process Point {i}</div>
              <div className="text-xl font-bold">{(45.5 + (i * 7.2) % 30).toFixed(1)}</div>
            </div>
          ))}
        </div>
      );
    case "fatigue-trend":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
          <AILineChartMarkers height={100} />
        </>
      );
    case "fatigue-cycle":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockLineData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <AIBarChartThreshold />
        </>
      );
    case "fatigue-rem":
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-4xl font-black text-rose-500 mb-2">12,405</div>
          <div className="text-sm text-muted-foreground w-3/4 text-center">Cycles remaining until critical threshold reached</div>
        </div>
      );
    case "bulge-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockScatterData} layout="vertical" margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
            <XAxis type="number" fontSize={11} />
            <YAxis dataKey="x" type="category" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="y" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "bulge-scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" dataKey="x" name="stature" fontSize={11} />
            <YAxis type="number" dataKey="y" name="weight" fontSize={11} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Scatter name="Thickness" data={mockScatterData} fill="#ef4444" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "crack-line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="stepAfter" dataKey="pressure" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "crack-flaws":
      return (
        <div className="grid grid-cols-2 gap-2 h-full items-center p-1">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center">
              <span className="text-xl mb-1">🔍</span>
              <span className="text-xs font-medium">Flaw {n}</span>
              <span className="text-xs text-rose-500">{(Math.random() * 5).toFixed(2)} mm</span>
            </div>
          ))}
        </div>
      );
    case "generic":
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full opacity-50">
          <span className="text-3xl mb-2">📊</span>
          <span className="text-sm text-muted-foreground">New Widget</span>
        </div>
      );
  }
}
