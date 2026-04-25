"use client"

import { useAppStore, type WhatIfRunSession } from "@/lib/store"
import {
  sites,
  dashboardCards,
  plantDocuments,
  getEquipmentDashboardThumbnail,
  whatIfScenarios,
} from "@/lib/data"
import {
  Maximize2,
  Minimize2,
  GripVertical,
  Trash2,
  Plus,
  ExternalLink,
  Search,
  Bookmark,
  FileText,
  Share2,
} from "lucide-react"
import { DashboardCard } from "@/components/dashboard-card"
import { ModuleLibrary, SPM_WIDGET_DRAG_TYPE, type LibraryModule } from "@/components/module-library"
import { cn } from "@/lib/utils"
import {
  buildDefaultGrid,
  DEFAULT_GRIDS,
  DEFAULT_WIDGET_SETS,
  RGL_DROP_PLACEHOLDER_ID,
  SPM_WIDGET_LIBRARY_SPECS,
  type GridWidget,
} from "@/components/views/equipment-dashboard/layouts"
import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type DragEvent,
} from "react"
import { Responsive as ResponsiveGridLayout, Layout, LayoutItem } from "react-grid-layout/legacy"

// CSS for react-grid-layout (must be imported here for Next.js)
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

import { WidgetErrorBoundary, WidgetViewResolver } from "@/components/views/equipment-dashboard/widget-view-resolver"

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES & DEFAULT LAYOUTS
   ═══════════════════════════════════════════════════════════════════════════ */

type DashboardCardData = {
  id: string
  tag: string
  equipId: string
  equipment: string
  metrics: { value1: string; value2: string }
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB STRIP
   Defined at module level so React sees a stable component type across
   re-renders. Defining it inside the render function causes React to unmount
   and remount it on every render, swallowing click events.
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardTabsStrip({
  cards,
  activeTab,
  thumbnailSrc,
  isEditMode,
  canDelete,
  onTabChange,
  onDeleteDashboard,
  onOpenCreate,
  expanded,
}: {
  cards: DashboardCardData[]
  activeTab: string
  thumbnailSrc: string | undefined
  isEditMode: boolean
  canDelete: boolean
  onTabChange: (tag: string) => void
  onDeleteDashboard: (tag: string) => void
  onOpenCreate: () => void
  expanded: boolean
}) {
  return (
    <div className={expanded ? "flex gap-3 overflow-x-auto pb-2" : "flex gap-3 overflow-x-auto pb-2 overflow-y-visible pt-2"}>
      {cards.map((card, idx) => (
        <div key={card.id} className="relative flex-shrink-0">
          <button
            onClick={() => onTabChange(card.tag)}
            className={cn(
              "text-left transition-all rounded-xl border-2 border-transparent",
              activeTab === card.tag && "border-primary shadow-md"
            )}
          >
            <DashboardCard card={card} cardIndex={idx} thumbnailSrc={thumbnailSrc} showEquipmentName={false} />
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={() => onDeleteDashboard(card.tag)}
              disabled={!canDelete}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold shadow hover:bg-rose-600 disabled:opacity-40"
              title="Delete dashboard"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={onOpenCreate}
        className="flex-shrink-0 w-16 h-[min(100%,130px)] my-auto border-2 border-dashed border-border rounded-xl flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-6 h-6 text-muted-foreground" />
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */
export function EquipmentDashboard() {
  const {
    currentPath,
    setCurrentPath,
    viewMode,
    setViewMode,
    dashboardExpanded,
    setDashboardExpanded,
    toggleFavoriteDashboard,
    favoriteDashboardIds,
    addRecentDashboard,
    setCurrentView,
    setWhatIfSelectedScenarioId,
    setWhatIfInitialTab,
    whatIfRunSessions,
    addDocument,
    whatIfDashboardAutoSelectRunId,
    setWhatIfDashboardAutoSelectRunId,
  } = useAppStore()

  // Grid widget + layout state
  const [grids, setGrids] = useState<Record<string, GridWidget[]>>(DEFAULT_GRIDS)
  const [savedGrids, setSavedGrids] = useState<Record<string, GridWidget[]>>(DEFAULT_GRIDS)
  const [gridDraftDirty, setGridDraftDirty] = useState(false)
  const [customDashboardCards, setCustomDashboardCards] = useState<Record<string, typeof dashboardCards>>({})
  const [deletedBaseTagsByEquip, setDeletedBaseTagsByEquip] = useState<Record<string, string[]>>({})
  const [createDashOpen, setCreateDashOpen] = useState(false)
  const [newDashName, setNewDashName] = useState("")
  const [createMode, setCreateMode] = useState<"existing" | "blank">("existing")
  const [templateTag, setTemplateTag] = useState("")
  const [visualReportGenerated, setVisualReportGenerated] = useState(false)
  const [shareNowOpen, setShareNowOpen] = useState(false)
  const [shareRecipient, setShareRecipient] = useState("")
  const [createDashError, setCreateDashError] = useState("")
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
  const deletedBaseTags = deletedBaseTagsByEquip[equipment.id] || []
  const baseCardsForEquip = dashboardCards.filter((c) => c.equipId === equipment.id && !deletedBaseTags.includes(c.tag))
  const customCardsForEquip = customDashboardCards[equipment.id] || []
  const equipmentDashboardCards = [...baseCardsForEquip, ...customCardsForEquip]
  const resolvedDefaultTab = equipmentDashboardCards[0]?.tag ?? equipment.tabs[0] ?? "Overview"
  const activeTab = equipmentDashboardCards.some((c) => c.tag === currentPath.tab)
    ? (currentPath.tab as string)
    : resolvedDefaultTab
  const isEditMode = viewMode === "edit" || viewMode === "modules"

  // Find the dashboardCard that matches the current equipment + tab
  const activeCard = equipmentDashboardCards.find(
    (c) => c.equipId === equipment.id && c.tag === activeTab
  )
  const isBookmarked = activeCard ? favoriteDashboardIds.includes(activeCard.id) : false

  const handleTabChange = useCallback((tab: string) => {
    setCurrentPath({ ...currentPath, tab })
    const card = equipmentDashboardCards.find((c) => c.equipId === equipment.id && c.tag === tab)
    if (card) addRecentDashboard(card.id)
  }, [currentPath, equipmentDashboardCards, equipment.id, setCurrentPath, addRecentDashboard])

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
    setGridDraftDirty(true)
  }

  const removeWidget = (widgetId: string) => {
    setGrids((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] || []).filter((gw) => gw.id !== widgetId),
    }))
    setGridDraftDirty(true)
  }

  const addWidgetFromLibrary = useCallback(
    (module: LibraryModule) => {
      const spec = SPM_WIDGET_LIBRARY_SPECS[module.id] ?? { viewType: "generic", w: 4, h: 4 }
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
      setGridDraftDirty(true)
    },
    [activeTab]
  )

  const handleDropDragOver = useCallback((_e: DragEvent) => {
    const id = dragModuleRef.current?.id
    if (!id) return false
    const spec = SPM_WIDGET_LIBRARY_SPECS[id]
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

      const spec = SPM_WIDGET_LIBRARY_SPECS[module.id] ?? { viewType: "generic", w: 4, h: 4 }
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
      setGridDraftDirty(true)
    },
    [activeTab]
  )

  const equipmentRuns = whatIfRunSessions
    .filter((s) => s.equipmentId === equipment.id && s.status === "success")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  const scenarioForEquipment = whatIfScenarios.find((s) => s.equipmentId === equipment.id)

  const [viewedDataIds, setViewedDataIds] = useState<string[]>(["live"])

  useEffect(() => {
    setViewedDataIds(["live"])
  }, [equipment.id])

  useEffect(() => {
    if (!whatIfDashboardAutoSelectRunId) return
    const session = whatIfRunSessions.find((s) => s.id === whatIfDashboardAutoSelectRunId)
    if (session?.equipmentId !== equipment.id) return
    setViewedDataIds([whatIfDashboardAutoSelectRunId])
    setWhatIfDashboardAutoSelectRunId(null)
  }, [
    equipment.id,
    whatIfDashboardAutoSelectRunId,
    whatIfRunSessions,
    setWhatIfDashboardAutoSelectRunId,
  ])

  useEffect(() => {
    const availableIds = ["live", ...equipmentRuns.map((run) => run.id)]
    setViewedDataIds((prev) => {
      return prev.filter((id) => availableIds.includes(id))
    })
  }, [equipmentRuns])

  const duplicateGridForNewTab = (fromTag: string, toTag: string) => {
    const source = grids[fromTag] || buildDefaultGrid(DEFAULT_WIDGET_SETS[fromTag] || [])
    const stamp = Date.now()
    const cloned = source.map((gw, idx) => {
      const id = `w-${toTag.replace(/\s+/g, "-").toLowerCase()}-${stamp}-${idx}`
      return { ...gw, id, layout: { ...gw.layout, i: id } }
    })
    setGrids((prev) => ({ ...prev, [toTag]: cloned }))
    setSavedGrids((prev) => ({ ...prev, [toTag]: cloned }))
  }

  const createDashboard = () => {
    const trimmed = newDashName.trim()
    if (!trimmed) return
    if (equipmentDashboardCards.some((c) => c.tag.toLowerCase() === trimmed.toLowerCase())) {
      setCreateDashError("A dashboard with this name already exists for this equipment.")
      return
    }
    setCreateDashError("")

    const newCard = {
      id: `dash-${equipment.id}-${Date.now()}`,
      equipment: equipment.name,
      equipId: equipment.id,
      tag: trimmed,
      metrics: { value1: "90%", value2: "0.001%" },
    }

    setCustomDashboardCards((prev) => ({
      ...prev,
      [equipment.id]: [...(prev[equipment.id] || []), newCard],
    }))

    if (createMode === "existing") {
      const sourceTag = templateTag || resolvedDefaultTab
      duplicateGridForNewTab(sourceTag, trimmed)
    } else {
      setGrids((prev) => ({ ...prev, [trimmed]: [] }))
      setSavedGrids((prev) => ({ ...prev, [trimmed]: [] }))
      setViewMode("edit")
    }

    setCurrentPath({ ...currentPath, tab: trimmed })
    addRecentDashboard(newCard.id)
    // Reset and close modal
    setCreateDashOpen(false)
    setNewDashName("")
    setCreateMode("existing")
    setCreateDashError("")
  }

  const generateViewedDataReport = () => {
    const selectedLabels = viewedDataIds.map((id) =>
      id === "live" ? "Live Data" : equipmentRuns.find((r) => r.id === id)?.runName ?? id
    )
    const doc = {
      id: `vis-report-${equipment.id}-${Date.now()}`,
      name: `[What-If Visual Report] ${equipment.name} — ${activeTab}.pdf`,
      fileType: "pdf" as const,
      category: "Uploaded" as const,
      siteId: site.id,
      plantId: plant.id,
      equipmentId: equipment.id,
      size: `${(0.9 + Math.random() * 1.5).toFixed(1)} MB`,
      date: new Date().toISOString().split("T")[0],
    }
    addDocument(doc)
    setVisualReportGenerated(true)
    return selectedLabels
  }

  const deleteDashboard = (tag: string) => {
    if (equipmentDashboardCards.length <= 1) return
    const isBase = baseCardsForEquip.some((c) => c.tag === tag)
    if (isBase) {
      setDeletedBaseTagsByEquip((prev) => ({
        ...prev,
        [equipment.id]: [...(prev[equipment.id] || []), tag],
      }))
    } else {
      setCustomDashboardCards((prev) => ({
        ...prev,
        [equipment.id]: (prev[equipment.id] || []).filter((c) => c.tag !== tag),
      }))
    }
    setGrids((prev) => {
      const next = { ...prev }
      delete next[tag]
      return next
    })
    setSavedGrids((prev) => {
      const next = { ...prev }
      delete next[tag]
      return next
    })
    if (activeTab === tag) {
      const remaining = equipmentDashboardCards.filter((c) => c.tag !== tag)
      const fallback = remaining[0]?.tag
      if (fallback) setCurrentPath({ ...currentPath, tab: fallback })
    }
  }

  // Stable modal open/close callbacks — reset all modal state on open/close
  const openCreateModal = useCallback(() => {
    setNewDashName("")
    setCreateMode("existing")
    setCreateDashError("")
    setTemplateTag(resolvedDefaultTab)
    setCreateDashOpen(true)
  }, [resolvedDefaultTab])

  const closeCreateModal = useCallback(() => {
    setCreateDashOpen(false)
    setNewDashName("")
    setCreateMode("existing")
    setCreateDashError("")
  }, [])

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden relative">
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
                onClick={() => activeCard && toggleFavoriteDashboard(activeCard.id)}
                disabled={!activeCard}
                title={isBookmarked ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isBookmarked
                    ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                    : "hover:bg-secondary text-muted-foreground"
                )}
                aria-label={isBookmarked ? "Remove from favorites" : "Favorite this dashboard"}
              >
                <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-amber-500")} />
              </button>
            )}
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setGrids(savedGrids)
                    setGridDraftDirty(false)
                    setViewMode("view")
                  }}
                  className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
                >
                  Discard & Exit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedGrids(grids)
                    setGridDraftDirty(false)
                    setViewMode("view")
                  }}
                  disabled={!gridDraftDirty}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Save Dashboard
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setGrids(savedGrids)
                  setGridDraftDirty(false)
                  setViewMode("edit")
                }}
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
                      <WidgetErrorBoundary>
                        <WidgetViewResolver
                          viewType={gw.viewType}
                          equipmentId={equipment.id}
                          viewedDataIds={viewedDataIds}
                          scenarioRuns={equipmentRuns}
                        />
                      </WidgetErrorBoundary>
                    </div>
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          </div>
        </div>

        {/* Regular bottom tab strip — hidden when expanded */}
        {!dashboardExpanded && (
          <DashboardTabsStrip
            cards={equipmentDashboardCards}
            activeTab={activeTab}
            thumbnailSrc={tabThumbnailSrc}
            isEditMode={isEditMode}
            canDelete={equipmentDashboardCards.length > 1}
            onTabChange={handleTabChange}
            onDeleteDashboard={deleteDashboard}
            onOpenCreate={openCreateModal}
            expanded={false}
          />
        )}

        {/* Slide-up expanded panel */}
        {dashboardExpanded && (
          <div className="absolute left-6 right-6 bottom-0 translate-y-[calc(100%-12px)] hover:translate-y-0 transition-transform duration-300 z-50 bg-background border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.1)] rounded-t-xl px-6 py-4 flex flex-col">
            <div className="absolute -top-3 left-0 right-0 h-4 cursor-pointer flex items-center justify-center">
              <div className="w-16 h-1.5 rounded-full bg-border/80" />
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-foreground">{equipment.name} dashboards</div>
              <button
                onClick={() => setDashboardExpanded(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground text-xs"
              >
                Collapse ↓
              </button>
            </div>

            <DashboardTabsStrip
              cards={equipmentDashboardCards}
              activeTab={activeTab}
              thumbnailSrc={tabThumbnailSrc}
              isEditMode={isEditMode}
              canDelete={equipmentDashboardCards.length > 1}
              onTabChange={handleTabChange}
              onDeleteDashboard={deleteDashboard}
              onOpenCreate={openCreateModal}
              expanded
            />
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

              <div className="mt-8 pb-12 space-y-5">
                {scenarioForEquipment && (
                  <>
                    <h4 className="font-medium text-foreground">What-If Scenarios</h4>
                    <button
                      onClick={() => {
                        setWhatIfSelectedScenarioId(scenarioForEquipment.id)
                        setWhatIfInitialTab("run")
                        setCurrentView("whatIfTool")
                        setViewMode("view")
                      }}
                      className="w-full py-3.5 px-4 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.1)] active:scale-[0.98]"
                    >
                      Run What-If Scenarios
                    </button>
                  </>
                )}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">Viewed Data</h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!scenarioForEquipment) return
                          setWhatIfSelectedScenarioId(scenarioForEquipment.id)
                          setWhatIfInitialTab("history")
                          setCurrentView("whatIfTool")
                          setViewMode("view")
                        }}
                        className="px-2 py-1 rounded-md text-xs text-primary hover:underline"
                      >
                        View Run history
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          generateViewedDataReport()
                        }}
                        className="px-2 py-1 rounded-md border border-border text-xs text-foreground hover:bg-secondary flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Generate Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          generateViewedDataReport()
                          setShareNowOpen(true)
                        }}
                        className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs hover:bg-primary/90 flex items-center gap-1"
                      >
                        <Share2 className="w-3.5 h-8.5" />

                      </button>
                    </div>
                  </div>
                  {visualReportGenerated && (
                    <p className="text-[11px] text-emerald-600 mb-2">Visual report saved to Documents.</p>
                  )}
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-primary"
                      checked={viewedDataIds.includes("live")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setViewedDataIds((prev) => (prev.includes("live") ? prev : ["live", ...prev]))
                          return
                        }
                        setViewedDataIds((prev) => {
                          if (prev.length <= 1) return prev
                          return prev.filter((id) => id !== "live")
                        })
                      }}
                    />
                    <span className="min-w-0">
                      <div className="text-xs font-medium text-foreground">Live Data</div>
                      <div className="text-[10px] text-muted-foreground">Current equipment scenario data</div>
                    </span>
                  </label>
                  {equipmentRuns.length > 0 && (
                    <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                      {equipmentRuns.map((run) => (
                        <li key={run.id}>
                          <label className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border cursor-pointer hover:bg-secondary">
                            <input
                              type="checkbox"
                              className="mt-0.5 accent-primary"
                              checked={viewedDataIds.includes(run.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setViewedDataIds((prev) => (prev.includes(run.id) ? prev : [...prev, run.id]))
                                  return
                                }
                                setViewedDataIds((prev) => {
                                  if (prev.length <= 1) return prev
                                  return prev.filter((id) => id !== run.id)
                                })
                              }}
                            />
                            <span className="min-w-0">
                              <div className="text-xs font-medium text-foreground line-clamp-2">{run.runName}</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(run.startedAt).toLocaleDateString()} · {run.duration || "—"} · {run.user}
                              </div>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {shareNowOpen && (
        <div className="absolute inset-0 z-[140] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5">
            <h4 className="font-semibold text-foreground mb-1">Share Report Now</h4>
            <p className="text-xs text-muted-foreground mb-3">
              The generated visual report is saved in Documents and can be shared immediately.
            </p>
            <input
              value={shareRecipient}
              onChange={(e) => setShareRecipient(e.target.value)}
              placeholder="Recipient email or user"
              className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShareNowOpen(false)}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareNowOpen(false)
                  setShareRecipient("")
                }}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}

      {createDashOpen && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">Create Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new dashboard for {equipment.name}.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Dashboard name</label>
                <input
                  value={newDashName}
                  onChange={(e) => { setNewDashName(e.target.value); setCreateDashError("") }}
                  placeholder="e.g. Reliability Comparison"
                  className={cn(
                    "w-full h-10 px-3 bg-secondary border rounded-lg text-sm",
                    createDashError ? "border-rose-400 focus:outline-rose-400" : "border-border"
                  )}
                />
                {createDashError && (
                  <p className="mt-1.5 text-xs text-rose-500">{createDashError}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Creation mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateMode("existing")}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm text-left",
                      createMode === "existing" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"
                    )}
                  >
                    From Existing Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("blank")}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm text-left",
                      createMode === "blank" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-secondary"
                    )}
                  >
                    New Blank Dashboard
                  </button>
                </div>
              </div>
              {createMode === "existing" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Template dashboard</label>
                  <select
                    value={templateTag}
                    onChange={(e) => setTemplateTag(e.target.value)}
                    className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm"
                  >
                    {equipmentDashboardCards.map((card) => (
                      <option key={card.id} value={card.tag}>
                        {card.tag}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeCreateModal}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createDashboard}
                disabled={!newDashName.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                Create Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

