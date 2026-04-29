"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { useShallow } from "zustand/react/shallow"
import { useDashboardOpenElsewhereCount } from "@/lib/workspace/use-viewer-tabs"
import {
  sites,
  plantDocuments,
  getEquipmentDashboardThumbnail,
  whatIfScenarios,
  dataStatusItems,
  userDocuments,
  type WhatIfScenarioDefinition,
} from "@/lib/data"
import {
  getPublishedDashboardsForEquipment,
  getDashboardById,
  type EquipmentHomeDashCard,
} from "@/lib/workspace-data"
import { ResponsiveDashboardGrid } from "@/components/workspace/read-only-grid"
import { DashboardCard } from "@/components/dashboard-card"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ExternalLink,
  Search,
  Bookmark,
  FileText,
  Share2,
  Database,
  ClipboardList,
  FolderOpen,
  FlaskConical,
  ChevronRight,
  X,
  Star,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Lock,
  Users,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════
   OPEN-ELSEWHERE BADGE — shows on Equipment Home dashboard tabs/cards when
   the same dashboard has at least one full-screen viewer open in another tab.
   Per resolved open question: only rendered on the Equipment Home Page.
   ═══════════════════════════════════════════════════════════════════════════ */
function OpenElsewhereBadge({
  dashboardId,
  variant = "card",
}: {
  dashboardId: string
  variant?: "card" | "popup"
}) {
  const count = useDashboardOpenElsewhereCount(dashboardId)
  if (count <= 0) return null

  if (variant === "popup") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-500/30">
        <Users className="w-3 h-3" />
        Open in {count} other tab{count > 1 ? "s" : ""}
      </span>
    )
  }

  return (
    <span
      className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold shadow-sm"
      title={`Open in ${count} other tab${count > 1 ? "s" : ""}`}
    >
      <Users className="w-2.5 h-2.5" />
      {count}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER — shared across all sections
   ═══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EQUIPMENT INFO SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
function EquipmentInfoSection({
  equipment,
  unit,
  site,
}: {
  equipment: { id: string; name: string; tabs: string[] }
  unit: { id: string; name: string }
  site: { id: string; name: string }
}) {
  return (
    <section>
      <SectionHeader title="Equipment Information" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Metadata card */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
            <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
          </div>
          <hr className="border-border" />
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Site</span>
              <span>{site.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Unit</span>
              <span>{unit.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Equipment</span>
              <span>{equipment.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-foreground">Dashboards</span>
              <span>{equipment.tabs.length}</span>
            </div>
          </div>
        </div>

        {/* Documents card */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Equipment Documents</h3>
            <button className="p-1.5 hover:bg-secondary rounded transition-colors" aria-label="Search documents">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
          <div className="space-y-1.5">
            {plantDocuments.slice(0, 4).map((doc, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs text-foreground transition-colors group"
              >
                <span className="truncate group-hover:text-primary transition-colors">{doc.name}</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD SECTION (Session B — inline)
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardSection({
  equipment,
  onOpenPopup,
}: {
  equipment: { id: string; name: string; tabs: string[] }
  onOpenPopup: (dashboardId: string) => void
}) {
  const {
    recentDashboardIds,
    favoriteDashboardIds,
    toggleFavoriteDashboard,
    addRecentDashboard,
  } = useAppStore()

  const rawDashboards = useWorkspaceStore(useShallow((s) => s.dashboards))
  const equipCards = useMemo(
    () => getPublishedDashboardsForEquipment(equipment.id, rawDashboards),
    [equipment.id, rawDashboards],
  )
  const thumbnailSrc = getEquipmentDashboardThumbnail(equipment.id)

  const recentCards = useMemo(
    () => recentDashboardIds.map((id) => equipCards.find((c) => c.id === id)).filter(Boolean) as EquipmentHomeDashCard[],
    [recentDashboardIds, equipCards],
  )

  const favoriteCards = useMemo(
    () => favoriteDashboardIds.map((id) => equipCards.find((c) => c.id === id)).filter(Boolean) as EquipmentHomeDashCard[],
    [favoriteDashboardIds, equipCards],
  )

  const handleCardClick = (dashboardId: string) => {
    addRecentDashboard(dashboardId)
    onOpenPopup(dashboardId)
  }

  function CardRow({
    cards,
    emptyMessage,
  }: {
    cards: EquipmentHomeDashCard[]
    emptyMessage: string
  }) {
    if (cards.length === 0) {
      return (
        <div className="flex items-center justify-center h-28 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {cards.map((card, idx) => {
          const isFav = favoriteDashboardIds.includes(card.id)
          return (
            <div key={card.id} className="relative flex-shrink-0 group">
              <button
                onClick={() => handleCardClick(card.id)}
                className="text-left rounded-xl border-2 border-transparent hover:border-primary/40 transition-all block"
                aria-label={`Open ${card.tag} dashboard`}
              >
                <DashboardCard
                  card={card}
                  cardIndex={idx}
                  thumbnailSrc={thumbnailSrc}
                  showEquipmentName={false}
                />
              </button>
              <OpenElsewhereBadge
                dashboardId={card.id}
                variant="card"
              />
              {/* Favorite toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFavoriteDashboard(card.id)
                }}
                className={cn(
                  "absolute top-2 right-2 p-1 rounded-full transition-all opacity-0 group-hover:opacity-100",
                  isFav
                    ? "opacity-100 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                    : "bg-black/20 text-white hover:bg-black/40"
                )}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                <Bookmark className={cn("w-3 h-3", isFav && "fill-amber-500")} />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section>
      <SectionHeader
        title="Dashboards"
        subtitle="Click a dashboard to preview it"
      />
      <div className="space-y-5">
        {/* Recent */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</span>
          </div>
          <CardRow
            cards={recentCards}
            emptyMessage="Open a dashboard below to populate recents"
          />
        </div>

        {/* Favorites */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Favorites</span>
          </div>
          <CardRow
            cards={favoriteCards}
            emptyMessage="Bookmark a dashboard to add it here"
          />
        </div>

        {/* All dashboards */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">All</span>
          </div>
          <CardRow
            cards={equipCards}
            emptyMessage="No dashboards created yet"
          />
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DASHBOARD POPUP — read-only widget grid + Viewed Data
   ═══════════════════════════════════════════════════════════════════════════ */
function DashboardPopup({
  dashboardId,
  equipment,
  site,
  unit,
  onClose,
}: {
  dashboardId: string
  equipment: { id: string; name: string; tabs: string[] }
  site: { id: string; name: string }
  unit: { id: string; name: string }
  onClose: () => void
}) {
  const {
    whatIfRunSessions,
    addDocument,
    setWhatIfSelectedScenarioId,
    setWhatIfInitialTab,
    setCurrentView,
    setViewMode,
    whatIfDashboardAutoSelectRunId,
    setWhatIfDashboardAutoSelectRunId,
  } = useAppStore()

  const rawDashboards = useWorkspaceStore(useShallow((s) => s.dashboards))
  const dashboard = useMemo(
    () => getDashboardById(dashboardId, rawDashboards),
    [dashboardId, rawDashboards],
  )
  const dashboardDisplayName = dashboard?.name ?? dashboardId

  const [viewedDataIds, setViewedDataIds] = useState<string[]>(["live"])
  const [visualReportGenerated, setVisualReportGenerated] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareRecipient, setShareRecipient] = useState("")

  const equipmentRuns = whatIfRunSessions
    .filter((s) => s.equipmentId === equipment.id && s.status === "success")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())

  const scenarioForEquipment = whatIfScenarios.find((s) => s.equipmentId === equipment.id)

  // Sync viewedDataIds when equipment changes
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

  const generateReport = () => {
    const doc = {
      id: `vis-report-${equipment.id}-${Date.now()}`,
      name: `[What-If Visual Report] ${equipment.name} — ${dashboardDisplayName}.pdf`,
      fileType: "pdf" as const,
      category: "Uploaded" as const,
      siteId: site.id,
      plantId: unit.id,
      equipmentId: equipment.id,
      size: `${(0.9 + Math.random() * 1.5).toFixed(1)} MB`,
      date: new Date().toISOString().split("T")[0],
    }
    addDocument(doc)
    setVisualReportGenerated(true)
  }

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`${dashboardDisplayName} dashboard preview`}
    >
      <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Popup header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
              {dashboardDisplayName}
            </span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              View only
            </span>
            <OpenElsewhereBadge
              dashboardId={dashboardId}
              variant="popup"
            />
          </div>
          <div className="flex items-center gap-2">
            {visualReportGenerated && (
              <span className="text-xs text-emerald-600">Report saved to Documents</span>
            )}
            <button
              onClick={() => {
                const url = `/dashboards/${encodeURIComponent(dashboardId)}/full`
                window.open(url, "_blank", "noopener,noreferrer")
              }}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors"
              title="Open this dashboard full-screen in a new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in new tab
            </button>
            <button
              onClick={generateReport}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-foreground hover:bg-secondary flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Generate Report
            </button>
            <button
              onClick={() => { generateReport(); setShareOpen(true) }}
              className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs hover:bg-secondary/80 flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Close dashboard preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Widget grid */}
          <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden min-h-0">
            {!dashboard ? (
              <div className="flex flex-col items-center justify-center min-h-[16rem] text-muted-foreground gap-3 p-6">
                <LayoutDashboard className="w-8 h-8 opacity-30" />
                <p className="text-sm">Dashboard not found or no longer available.</p>
              </div>
            ) : (
              <ResponsiveDashboardGrid
                dashboard={dashboard}
                viewedDataIds={viewedDataIds}
                scenarioRuns={equipmentRuns}
                useEmptyFallback={false}
                emptyStateMessage="No widgets configured for this dashboard."
              />
            )}
          </div>

          {/* Viewed Data side panel */}
          <div className="w-64 flex-shrink-0 border-l border-border overflow-y-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Viewed Data</h4>
                {scenarioForEquipment && (
                  <button
                    type="button"
                    onClick={() => {
                      setWhatIfSelectedScenarioId(scenarioForEquipment.id)
                      setWhatIfInitialTab("history")
                      setCurrentView("whatIfTool")
                      setViewMode("view")
                      onClose()
                    }}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Run history
                  </button>
                )}
              </div>

              {/* Live data toggle */}
              <label className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border cursor-pointer mb-1.5">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-primary"
                  checked={viewedDataIds.includes("live")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setViewedDataIds((prev) => prev.includes("live") ? prev : ["live", ...prev])
                    } else {
                      setViewedDataIds((prev) => prev.length <= 1 ? prev : prev.filter((id) => id !== "live"))
                    }
                  }}
                />
                <span className="min-w-0">
                  <div className="text-xs font-medium text-foreground">Live Data</div>
                  <div className="text-[10px] text-muted-foreground">Current equipment data</div>
                </span>
              </label>

              {/* Scenario run checkboxes */}
              {equipmentRuns.length > 0 && (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {equipmentRuns.map((run) => (
                    <li key={run.id}>
                      <label className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border cursor-pointer hover:bg-secondary">
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-primary"
                          checked={viewedDataIds.includes(run.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setViewedDataIds((prev) => prev.includes(run.id) ? prev : [...prev, run.id])
                            } else {
                              setViewedDataIds((prev) => prev.length <= 1 ? prev : prev.filter((id) => id !== run.id))
                            }
                          }}
                        />
                        <span className="min-w-0">
                          <div className="text-xs font-medium text-foreground line-clamp-2">{run.runName}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(run.startedAt).toLocaleDateString()} · {run.user}
                          </div>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {equipmentRuns.length === 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  No What-If runs yet. Run a scenario to overlay results on widgets.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-5 mx-4">
            <h4 className="font-semibold text-foreground mb-1">Share Report</h4>
            <p className="text-xs text-muted-foreground mb-3">
              The generated report is saved in Documents and can be shared immediately.
            </p>
            <input
              value={shareRecipient}
              onChange={(e) => setShareRecipient(e.target.value)}
              placeholder="Recipient email or user"
              className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShareOpen(false)}
                className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShareOpen(false); setShareRecipient("") }}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   TOOLS SECTION
   ═══════════════════════════════════════════════════════════════════════════ */
function ToolsSection({
  equipment,
}: {
  equipment: { id: string; name: string; tabs: string[] }
}) {
  const {
    setCurrentView,
    setViewMode,
    setPreFilterEquipmentId,
    setWhatIfSelectedScenarioId,
    whatIfRunSessions,
  } = useAppStore()

  const dataSyncItem = dataStatusItems.find((i) => i.asset === equipment.name)
  const docCount = userDocuments.filter((d) => d.equipmentId === equipment.id).length
  const scenario = whatIfScenarios.find((s) => s.equipmentId === equipment.id)

  const latestRun = whatIfRunSessions
    .filter((s) => s.equipmentId === equipment.id && s.status === "success")
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]

  const tiles = [
    {
      key: "data-sync",
      icon: <Database className="w-5 h-5" />,
      label: "Data & Sync",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      preview: dataSyncItem ? (
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Loaded</span>
            <span className="font-medium text-foreground">{dataSyncItem.loadStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last sync</span>
            <span className="font-medium text-foreground">{dataSyncItem.lastUpdate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Errors</span>
            <span className={cn("font-medium", dataSyncItem.error.startsWith("0") ? "text-foreground" : "text-amber-600")}>
              {dataSyncItem.error}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No sync data available</p>
      ),
      onClick: () => {
        setPreFilterEquipmentId(equipment.id)
        setCurrentView("data-sync")
        setViewMode("view")
      },
      disabled: false,
    },
    {
      key: "shift-log",
      icon: <ClipboardList className="w-5 h-5" />,
      label: "Shift Log",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      preview: (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>Not yet available</span>
        </div>
      ),
      onClick: undefined,
      disabled: true,
    },
    {
      key: "documents",
      icon: <FolderOpen className="w-5 h-5" />,
      label: "Documents",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      preview: (
        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Linked docs</span>
            <span className="font-medium text-foreground">{docCount}</span>
          </div>
          <p className="text-muted-foreground line-clamp-2">
            {docCount === 0
              ? "No documents tagged to this equipment"
              : `${docCount} document${docCount !== 1 ? "s" : ""} available`}
          </p>
        </div>
      ),
      onClick: () => {
        setPreFilterEquipmentId(equipment.id)
        setCurrentView("documents-tool")
        setViewMode("view")
      },
      disabled: false,
    },
    {
      key: "whatif",
      icon: <FlaskConical className="w-5 h-5" />,
      label: "What-If Scenario",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      preview: scenario ? (
        <div className="space-y-1 text-xs">
          <p className="font-medium text-foreground line-clamp-1">{scenario.name}</p>
          {latestRun ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="line-clamp-1">Last: {latestRun.runName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>No runs yet</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No scenarios for this equipment</p>
      ),
      onClick: scenario
        ? () => {
            setWhatIfSelectedScenarioId(scenario.id)
            setCurrentView("whatIfTool")
            setViewMode("view")
          }
        : undefined,
      disabled: !scenario,
    },
  ]

  return (
    <section>
      <SectionHeader title="Tools" subtitle="Equipment-specific tools and data" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            onClick={tile.onClick}
            disabled={tile.disabled}
            className={cn(
              "text-left rounded-xl border border-border bg-card p-4 flex flex-col gap-3 transition-all",
              tile.disabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:border-primary/40 hover:shadow-sm hover:bg-secondary/20 group"
            )}
          >
            {/* Icon + label row */}
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg", tile.bgColor)}>
                <span className={tile.color}>{tile.icon}</span>
              </div>
              {!tile.disabled && (
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              {tile.disabled && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                  Coming soon
                </span>
              )}
            </div>
            {/* Title */}
            <div>
              <p className="text-sm font-semibold text-foreground">{tile.label}</p>
            </div>
            {/* Preview data */}
            <div className="flex-1">{tile.preview}</div>
          </button>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   EQUIPMENT HOME VIEW — main export
   ═══════════════════════════════════════════════════════════════════════════ */
export function EquipmentHomeView() {
  const {
    currentPath,
    setCurrentView,
    setViewMode,
    equipmentHomeAutoOpenTab,
    setEquipmentHomeAutoOpenTab,
  } = useAppStore()
  const router = useRouter()
  const setInitialEquipmentFilter = useWorkspaceStore((s) => s.setInitialEquipmentFilter)

  const site = sites.find((s) => s.id === currentPath.site)
  const unit = site?.units.find((p) => p.id === currentPath.plant)
  const equipment = unit?.equipment.find((e) => e.id === currentPath.equipment)

  const [activePopupDashboardId, setActivePopupDashboardId] = useState<string | null>(null)

  const openPopup = useCallback((dashboardId: string) => {
    setActivePopupDashboardId(dashboardId)
  }, [])

  const closePopup = useCallback(() => {
    setActivePopupDashboardId(null)
  }, [])

  useEffect(() => {
    if (!equipmentHomeAutoOpenTab) return
    setActivePopupDashboardId(equipmentHomeAutoOpenTab)
    setEquipmentHomeAutoOpenTab(null)
  }, [equipmentHomeAutoOpenTab, setEquipmentHomeAutoOpenTab])

  if (!site || !unit || !equipment) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No equipment selected. Navigate to an equipment from the Assets panel.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">

        {/* ── Page Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {site.name} › {unit.name}
            </p>
            <h1 className="text-xl font-bold text-foreground">{equipment.name}</h1>
          </div>
          <button
            onClick={() => {
              setInitialEquipmentFilter(equipment.id)
              router.push("/dashboard")
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Edit Dashboards
          </button>
        </div>

        {/* ── Dashboard Section ─────────────────────────────────────── */}
        <DashboardSection equipment={equipment} onOpenPopup={openPopup} />

        {/* ── Equipment Information ─────────────────────────────────── */}
        <EquipmentInfoSection equipment={equipment} unit={unit} site={site} />

        {/* ── Tools Section ─────────────────────────────────────────── */}
        <ToolsSection equipment={equipment} />

      </div>

      {/* ── Dashboard Popup overlay ───────────────────────────────── */}
      {activePopupDashboardId && (
        <DashboardPopup
          dashboardId={activePopupDashboardId}
          equipment={equipment}
          site={site}
          unit={unit}
          onClose={closePopup}
        />
      )}
    </div>
  )
}
