"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Lock,
  Eye,
  Globe2,
  Loader2,
  Check,
  Pencil,
} from "lucide-react"
import { toast } from "sonner"
import {
  Responsive as ResponsiveGridLayout,
  type LayoutItem,
} from "react-grid-layout/legacy"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ModuleLibrary, SPM_WIDGET_DRAG_TYPE, type LibraryModule } from "@/components/module-library"
import {
  CatalogModuleLibrary,
  type AnyDragPayload,
  type CatalogDragPayload,
} from "@/components/catalog-module-library"
import {
  RGL_DROP_PLACEHOLDER_ID,
  SPM_WIDGET_LIBRARY_SPECS,
  type GridWidget,
} from "@/components/dashboard/layouts"
import { WidgetErrorBoundary } from "@/components/dashboard/widget-view-resolver"
import { DashboardWidgetBody } from "@/components/dashboard/dashboard-widget-body"
import { WidgetConfigPopup, type WidgetCreationResult } from "@/components/dashboard/widget-config-popup"
import { DashboardContextBar } from "@/components/workspace/dashboard-context-bar"
import { LEGACY_COKER_VIEW } from "@/lib/equipment-packs"
import type { DashboardContextState } from "@/lib/workspace/types"
import {
  useWorkspaceStore,
  selectMyPermissionOn,
} from "@/lib/workspace/store"
import { permissionAtLeast } from "@/lib/workspace/types"
import { findOrgUserById } from "@/lib/workspace/identity"
import { useDashboardEditLock } from "@/lib/workspace/use-edit-lock"
import { useAppStore } from "@/lib/store"
import { sites, getEquipmentTypeKey } from "@/lib/data"

const ROW_HEIGHT = 70
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 12, sm: 12, xs: 6, xxs: 4 }

function equipmentName(equipmentId: string): string {
  for (const s of sites)
    for (const p of s.units)
      for (const e of p.equipment) if (e.id === equipmentId) return e.name
  return "Unknown"
}

export function DashboardEditor({ dashboardId }: { dashboardId: string }) {
  const router = useRouter()
  const dashboard = useWorkspaceStore((s) =>
    s.dashboards.find((d) => d.id === dashboardId) ?? null
  )
  const myPermission = useWorkspaceStore((s) => selectMyPermissionOn(s, dashboardId))
  const saveDashboardWidgets = useWorkspaceStore((s) => s.saveDashboardWidgets)
  const renameDashboard = useWorkspaceStore((s) => s.renameDashboard)
  const publishDashboard = useWorkspaceStore((s) => s.publishDashboard)
  const unpublishDashboard = useWorkspaceStore((s) => s.unpublishDashboard)
  const saveDashboardContext = useWorkspaceStore((s) => s.saveDashboardContext)
  const whatIfRunSessions = useAppStore((s) => s.whatIfRunSessions)

  const equipmentType = dashboard?.equipmentId
    ? getEquipmentTypeKey(dashboard.equipmentId)
    : "other"

  const lock = useDashboardEditLock(dashboard ? dashboard.id : null)
  const lockNotifiedRef = useRef(false)

  const [widgets, setWidgets] = useState<GridWidget[]>([])
  const [titleEditing, setTitleEditing] = useState(false)
  const [pendingTitle, setPendingTitle] = useState("")
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [draggingFromLibrary, setDraggingFromLibrary] = useState(false)
  const placeholderInsertedRef = useRef(false)
  const dragModuleRef = useRef<LibraryModule | AnyDragPayload | null>(null)
  // Pending parameter drag — waits for popup to confirm before adding widget
  const [pendingParamId, setPendingParamId] = useState<string | null>(null)
  const pendingDropPositionRef = useRef<{ x: number; y: number } | null>(null)
  const [ctx, setCtx] = useState<DashboardContextState>({
    cycleId: "2751",
    durationKey: "7d",
    latestUpdateLabel: "18/04/2026",
  })
  const [gridWidth, setGridWidth] = useState(1200)
  const gridContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setGridWidth(w)
    })
    observer.observe(node)
    setGridWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!dashboard) return
    setWidgets(dashboard.widgets)
    setPendingTitle(dashboard.name)
    setCtx((prev) => ({ ...prev, ...dashboard.dashboardContext }))
    setDirty(false)
  }, [dashboard?.id])

  useEffect(() => {
    if (lock.status === "denied" && !lockNotifiedRef.current) {
      lockNotifiedRef.current = true
      const holder = findOrgUserById(lock.holderUserId)
      toast.error("This dashboard is being edited at the moment", {
        description: holder
          ? `${holder.name} has the editor open in another tab.`
          : "Another tab has the editor open.",
        duration: 8_000,
      })
    }
  }, [lock.status, lock.holderUserId])

  const canEdit = permissionAtLeast(myPermission, "edit")

  /* ── Save ─────────────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!dashboard) return
    setSaving(true)
    try {
      const pending: Promise<void>[] = [
        saveDashboardWidgets(dashboard.id, widgets),
        saveDashboardContext(dashboard.id, ctx),
      ]
      if (pendingTitle.trim() && pendingTitle.trim() !== dashboard.name) {
        pending.push(renameDashboard(dashboard.id, pendingTitle.trim()))
      }
      await Promise.all(pending)
      setSavedAt(Date.now())
      setDirty(false)
      toast.success("Dashboard saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }, [dashboard, widgets, pendingTitle, saveDashboardWidgets, saveDashboardContext, renameDashboard, ctx])

  // Warn on tab close while dirty.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  /* ── Dashboard context change ─────────────────────────────────────────── */
  const onCtxChange = useCallback((v: DashboardContextState) => {
    setCtx(v)
    setDirty(true)
  }, [])

  /* ── Layout change ────────────────────────────────────────────────────── */
  const onLayoutChange = (layout: readonly LayoutItem[]) => {
    setWidgets((prev) => {
      let changed = false
      const next = prev.map((w) => {
        const l = layout.find((x) => x.i === w.id)
        if (!l) return w
        if (
          l.x !== w.layout.x ||
          l.y !== w.layout.y ||
          l.w !== w.layout.w ||
          l.h !== w.layout.h
        ) {
          changed = true
          return { ...w, layout: { ...w.layout, x: l.x, y: l.y, w: l.w, h: l.h } }
        }
        return w
      })
      // CRITICAL: return the same reference when nothing changed — React bails out
      // and does not re-render, breaking the potential react-grid-layout ↔ state loop.
      if (!changed) return prev
      setDirty(true)
      return next
    })
  }

  /* ── Widget creation from popup result ────────────────────────────────── */
  const addWidgetFromPopup = useCallback(
    (result: WidgetCreationResult, position?: { x: number; y: number }) => {
      const id = `w-${Date.now().toString(36)}`
      const { w, h, minW, minH } = result.layout
      const pos = position ?? { x: 0, y: nextRowY(widgets) }
      const newWidget: GridWidget = {
        id,
        viewType: LEGACY_COKER_VIEW,
        parameterId: result.parameterId,
        visualTypeId: result.visualTypeId,
        config: result.config,
        title: result.title,
        layout: { i: id, x: pos.x, y: pos.y, w: Math.min(w, 12), h, minW, minH },
      }
      setWidgets((p) => [...p, newWidget])
      setDirty(true)
    },
    [widgets]
  )

  /* ── Drag-drop from library (RGL legacy onDrop: layout, item, drag Event as 3rd arg) ─ */
  const onDropFromLibrary = (
    _layout: readonly LayoutItem[],
    item: LayoutItem | undefined,
    e: Event
  ) => {
    if (!item) return
    const de = e as DragEvent
    let rawPayload: LibraryModule | AnyDragPayload | null = null
    try {
      const raw = de.dataTransfer?.getData(SPM_WIDGET_DRAG_TYPE)
      if (raw) rawPayload = JSON.parse(raw) as LibraryModule | AnyDragPayload
    } catch {
      rawPayload = null
    }
    if (!rawPayload?.id && dragModuleRef.current) rawPayload = dragModuleRef.current
    dragModuleRef.current = null
    if (!rawPayload?.id) return

    // Parameter drag → open creation popup
    if ("mode" in rawPayload && rawPayload.mode === "parameter") {
      pendingDropPositionRef.current = { x: item.x, y: item.y }
      setPendingParamId(rawPayload.parameterId)
      return
    }

    // Reference widget → place directly
    if ("mode" in rawPayload && rawPayload.mode === "reference") {
      const r = rawPayload as import("@/components/catalog-module-library").ReferenceDragPayload
      const id = `w-${Date.now().toString(36)}`
      const newWidget: GridWidget = {
        id,
        viewType: LEGACY_COKER_VIEW,
        referenceWidgetId: r.referenceWidgetId,
        title: r.name,
        layout: {
          i: id,
          x: item.x,
          y: item.y,
          w: Math.min(r.defaultW, 12),
          h: r.defaultH,
          minW: r.minW,
          minH: r.minH,
        },
      }
      setWidgets((p) => [...p, newWidget])
      setDirty(true)
      return
    }

    // Legacy catalog drag
    if ("mode" in rawPayload && rawPayload.mode === "catalog") {
      const c = rawPayload as CatalogDragPayload
      const id = `w-${Date.now().toString(36)}`
      const newWidget: GridWidget = {
        id,
        viewType: LEGACY_COKER_VIEW,
        templateKey: c.templateKey,
        packVersion: c.packVersion,
        options: {},
        title: c.name,
        layout: {
          i: id,
          x: item.x,
          y: item.y,
          w: Math.min(c.defaultW, 12),
          h: c.defaultH,
          minW: c.minW,
          minH: c.minH,
        },
      }
      setWidgets((p) => [...p, newWidget])
      setDirty(true)
      return
    }

    const module = rawPayload as LibraryModule
    const spec = SPM_WIDGET_LIBRARY_SPECS[module.id]
    if (!spec) return
    const id = `w-${Date.now().toString(36)}`
    const newWidget: GridWidget = {
      id,
      viewType: spec.viewType,
      title: module.name?.trim() ? module.name : humanize(module.id),
      layout: {
        i: id,
        x: item.x,
        y: item.y,
        w: spec.w,
        h: spec.h,
        minW: 2,
        minH: 2,
      },
    }
    setWidgets((p) => [...p, newWidget])
    setDirty(true)
  }

  const onDragStartFromLibrary = (mod: LibraryModule | AnyDragPayload) => {
    dragModuleRef.current = mod
    setDraggingFromLibrary(true)
  }
  const onDragEndFromLibrary = () => {
    setDraggingFromLibrary(false)
    placeholderInsertedRef.current = false
    dragModuleRef.current = null
  }

  const removeWidget = (id: string) => {
    setWidgets((p) => p.filter((w) => w.id !== id))
    setDirty(true)
  }

  const appendLegacy = useCallback((module: LibraryModule) => {
    const spec = SPM_WIDGET_LIBRARY_SPECS[module.id]
    if (!spec) return
    setWidgets((prev) => {
      const y = nextRowY(prev)
      const id = `w-${Date.now().toString(36)}`
      const newWidget: GridWidget = {
        id,
        viewType: spec.viewType,
        title: module.name?.trim() ? module.name : humanize(module.id),
        layout: { i: id, x: 0, y, w: spec.w, h: spec.h, minW: 2, minH: 2 },
      }
      return [...prev, newWidget]
    })
    setDirty(true)
  }, [])

  const appendCatalog = useCallback((c: AnyDragPayload) => {
    if (c.mode === "parameter") {
      // Add to bottom of grid and open popup
      setPendingParamId(c.parameterId)
      pendingDropPositionRef.current = null
      return
    }
    if (c.mode === "reference") {
      const r = c as import("@/components/catalog-module-library").ReferenceDragPayload
      setWidgets((prev) => {
        const y = nextRowY(prev)
        const id = `w-${Date.now().toString(36)}`
        const w: GridWidget = {
          id,
          viewType: LEGACY_COKER_VIEW,
          referenceWidgetId: r.referenceWidgetId,
          title: r.name,
          layout: { i: id, x: 0, y, w: Math.min(r.defaultW, 12), h: r.defaultH, minW: r.minW, minH: r.minH },
        }
        return [...prev, w]
      })
      setDirty(true)
      return
    }
    const legacy = c as CatalogDragPayload
    setWidgets((prev) => {
      const y = nextRowY(prev)
      const id = `w-${Date.now().toString(36)}`
      const w: GridWidget = {
        id,
        viewType: LEGACY_COKER_VIEW,
        templateKey: legacy.templateKey,
        packVersion: legacy.packVersion,
        options: {},
        title: legacy.name,
        layout: {
          i: id,
          x: 0,
          y,
          w: Math.min(legacy.defaultW, 12),
          h: legacy.defaultH,
          minW: legacy.minW,
          minH: legacy.minH,
        },
      }
      return [...prev, w]
    })
    setDirty(true)
  }, [])

  const layouts = useMemo(
    () => ({ lg: widgets.map((w) => ({ ...w.layout, i: w.id })) as LayoutItem[] }),
    [widgets]
  )

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (!dashboard) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Dashboard not found.
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold">Edit access required</h2>
          <p className="text-sm text-muted-foreground">
            You have{" "}
            <strong>{myPermission ?? "no"}</strong> access on this dashboard.
            The owner ({findOrgUserById(dashboard.ownerUserId)?.name ?? "owner"}) controls
            edit permissions.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={() => router.push(`/dashboard?d=${dashboard.id}`)}>
              View only
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (lock.status === "denied") {
    const holder = findOrgUserById(lock.holderUserId)
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold">This dashboard is being edited at the moment</h2>
          <p className="text-sm text-muted-foreground">
            {holder
              ? `${holder.name} has the editor open in another tab.`
              : "Another tab has the editor open."}{" "}
            Only one editor can be active at a time.
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button onClick={() => router.push(`/dashboard?d=${dashboard.id}`)}>
              <Eye className="w-4 h-4 mr-1.5" /> Open read-only
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Widget creation popup (parameter-driven) */}
      {pendingParamId && (
        <WidgetConfigPopup
          parameterId={pendingParamId}
          open={!!pendingParamId}
          onClose={() => {
            setPendingParamId(null)
            pendingDropPositionRef.current = null
          }}
          onConfirm={(result) => {
            addWidgetFromPopup(result, pendingDropPositionRef.current ?? undefined)
            setPendingParamId(null)
            pendingDropPositionRef.current = null
          }}
        />
      )}
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground truncate">
            {equipmentName(dashboard.equipmentId)} ·{" "}
            {dashboard.lifecycleStatus === "published" ? "Published" : "Draft"}
            {lock.status === "probing" && (
              <>
                {" "}
                · <Loader2 className="inline w-3 h-3 animate-spin" /> Acquiring lock…
              </>
            )}
            {lock.status === "acquired" && (
              <>
                {" "}
                · <Check className="inline w-3 h-3 text-emerald-500" /> Editor lock held
              </>
            )}
          </div>
          {titleEditing ? (
            <input
              autoFocus
              value={pendingTitle}
              onChange={(e) => {
                setPendingTitle(e.target.value)
                setDirty(true)
              }}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur()
                if (e.key === "Escape") {
                  setPendingTitle(dashboard.name)
                  setTitleEditing(false)
                }
              }}
              className="text-lg font-bold bg-background border border-primary rounded px-2 py-0.5 outline-none w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setTitleEditing(true)}
              className="text-lg font-bold text-foreground truncate flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              {pendingTitle}
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {savedAt && !dirty && (
            <span className="text-xs text-muted-foreground">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          )}
          {dashboard.lifecycleStatus === "created" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void (async () => {
                  try {
                    await publishDashboard(dashboard.id)
                    toast.success("Dashboard published to Asset Module")
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Publish failed")
                  }
                })()
              }}
              className="gap-1"
            >
              <Globe2 className="w-4 h-4" /> Publish
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void (async () => {
                  try {
                    await unpublishDashboard(dashboard.id)
                    toast.success("Dashboard unpublished")
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Unpublish failed")
                  }
                })()
              }}
              className="gap-1"
            >
              <Globe2 className="w-4 h-4" /> Unpublish
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="gap-1"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {equipmentType === "coker" && (
        <DashboardContextBar
          value={ctx}
          onChange={onCtxChange}
        />
      )}

      <div className="flex-1 min-h-0 flex">
        <aside className="w-64 flex-shrink-0 border-r border-border bg-card/30">
          {equipmentType === "coker" && dashboard ? (
            <CatalogModuleLibrary
              equipmentId={dashboard.equipmentId}
              onWidgetDragStart={onDragStartFromLibrary}
              onWidgetDragEnd={onDragEndFromLibrary}
              onAddModule={appendCatalog}
            />
          ) : (
            <ModuleLibrary
              onWidgetDragStart={onDragStartFromLibrary}
              onWidgetDragEnd={onDragEndFromLibrary}
              onAddModule={appendLegacy}
            />
          )}
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0 overflow-auto bg-muted/20 relative">
          {widgets.length === 0 && !draggingFromLibrary && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm pointer-events-none z-10">
              <Plus className="w-8 h-8 mb-2 opacity-50" />
              Drag widgets from the left panel to start building.
            </div>
          )}
          <div className="p-4" ref={gridContainerRef}>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={BREAKPOINTS}
              cols={COLS}
              rowHeight={ROW_HEIGHT}
              width={Math.max(gridWidth - 32, 200)}
              margin={[12, 12]}
              containerPadding={[0, 0]}
              isDraggable
              isResizable
              isDroppable
              droppingItem={
                draggingFromLibrary
                  ? (() => {
                      const d = dragModuleRef.current
                      if (d && "mode" in d && (d.mode === "catalog" || d.mode === "parameter" || d.mode === "reference"))
                        return {
                          i: RGL_DROP_PLACEHOLDER_ID,
                          w: d.defaultW,
                          h: d.defaultH,
                          x: 0,
                          y: 0,
                        } as unknown as LayoutItem
                      return {
                        i: RGL_DROP_PLACEHOLDER_ID,
                        w: 4,
                        h: 4,
                        x: 0,
                        y: 0,
                      } as unknown as LayoutItem
                    })()
                  : undefined
              }
              onLayoutChange={onLayoutChange as unknown as Parameters<typeof ResponsiveGridLayout>[0]["onLayoutChange"]}
              onDrop={onDropFromLibrary}
              compactType="vertical"
            >
              {widgets.map((w) => (
                <div
                  key={w.id}
                  className={cn(
                    "group rounded-xl border shadow-sm overflow-hidden",
                    equipmentType === "coker" && (w.templateKey || w.parameterId || w.referenceWidgetId)
                      ? "bg-[hsl(var(--coker-card))] border-[hsl(var(--coker-border))] coker-theme"
                      : "bg-card border-border"
                  )}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border flex items-center justify-between">
                    <span className="truncate">{w.title ?? "Widget"}</span>
                    <button
                      type="button"
                      onClick={() => removeWidget(w.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      aria-label="Remove widget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-[calc(100%-30px)] p-2">
                    <WidgetErrorBoundary>
                      <DashboardWidgetBody
                        widget={w}
                        equipmentId={dashboard.equipmentId}
                        scenarioRuns={whatIfRunSessions}
                        context={ctx}
                      />
                    </WidgetErrorBoundary>
                  </div>
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        </div>
      </div>
    </div>
  )
}

function nextRowY(ws: GridWidget[]): number {
  let y = 0
  for (const w of ws) y = Math.max(y, w.layout.y + w.layout.h)
  return y
}

function humanize(moduleId: string): string {
  return moduleId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
