"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useAppStore } from "@/lib/store"
import {
  sites,
  dashboardCards,
  getEquipmentDashboardThumbnail,
  changeLogEntries,
  userDocuments,
} from "@/lib/data"
import type { ChangeLogType, DocumentCategory, UserDocument } from "@/lib/data"
import { DashboardCard } from "@/components/dashboard-card"
import { buildAssetOptions, filterDocuments } from "@/lib/documents"
import { cn } from "@/lib/utils"
import {
  AI_ACTIONS,
  AI_NOTICES,
  FILE_BADGE_COLORS,
  FILE_ICONS,
  SEARCH_INDEX,
  type SearchResult,
} from "@/components/views/home/constants"
import {
  Search,
  Building2,
  Factory,
  Box,
  LayoutDashboard,
  X,
  Sparkles,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Clock,
  Star,
  FileText,
  LayoutGrid,
  BookOpen,
  FileSpreadsheet,
  File,
  Link,
  Upload,
  Users,
  SlidersHorizontal,
  Zap,
  Activity,
} from "lucide-react"

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 1 — GLOBAL SEARCH BAR
   ═══════════════════════════════════════════════════════════════════════════ */

function GlobalSearchBar() {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const {
    setCurrentPath,
    setCurrentView,
    setViewMode,
    addRecentDashboard,
  } = useAppStore()

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return SEARCH_INDEX.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.sublabel.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [query])

  useEffect(() => { setCursor(-1) }, [suggestions])

  const navigate = (result: SearchResult) => {
    setQuery("")
    setOpen(false)
    setCursor(-1)
    setViewMode("view")

    switch (result.kind) {
      case "site":
        setCurrentPath({ site: result.siteId })
        setCurrentView("site")
        break
      case "plant":
        setCurrentPath({ site: result.siteId, plant: result.plantId })
        setCurrentView("plant")
        break
      case "equipment":
        setCurrentPath({ site: result.siteId, plant: result.plantId, equipment: result.equipmentId })
        setCurrentView("equipment")
        break
      case "dashboard": {
        const card = dashboardCards.find(
          (c) => c.equipId === result.equipmentId && c.tag === result.tab
        )
        if (card) addRecentDashboard(card.id)
        setCurrentPath({
          site: result.siteId,
          plant: result.plantId,
          equipment: result.equipmentId,
          tab: result.tab,
        })
        setCurrentView("equipment")
        break
      }
    }
  }

  const kindIcon = (kind: SearchResult["kind"]) => {
    switch (kind) {
      case "site": return <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
      case "plant": return <Factory className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      case "equipment": return <Box className="w-4 h-4 text-amber-400 flex-shrink-0" />
      case "dashboard": return <LayoutDashboard className="w-4 h-4 text-purple-400 flex-shrink-0" />
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault()
      navigate(suggestions[cursor])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <div className={cn(
        "flex items-center gap-3 px-5 py-4 rounded-2xl border transition-all duration-200",
        "bg-card border-border shadow-sm",
        open && query ? "rounded-b-none border-b-transparent shadow-lg ring-2 ring-primary/20" : "hover:shadow-md"
      )}>
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          id="home-global-search"
          type="text"
          placeholder="Search assets, plants, equipment, dashboards…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); inputRef.current?.focus() }}
            className="p-1 rounded-full hover:bg-secondary transition-colors"
            aria-label="Clear"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
        <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-muted">
          <span>⌘</span><span>K</span>
        </kbd>
      </div>

      {/* Suggestions dropdown */}
      {open && query && (
        <ul
          ref={listRef}
          className={cn(
            "absolute left-0 right-0 bg-card border border-border border-t-0",
            "rounded-b-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto"
          )}
        >
          {suggestions.length === 0 ? (
            <li className="px-5 py-4 text-sm text-muted-foreground">No results for "{query}"</li>
          ) : (
            suggestions.map((r, i) => (
              <li key={r.id}>
                <button
                  onMouseDown={() => navigate(r)}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                    cursor === i ? "bg-primary/10" : "hover:bg-secondary"
                  )}
                >
                  {kindIcon(r.kind)}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.sublabel}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 2 — AI SUMMARY (MOCKUP)
   ═══════════════════════════════════════════════════════════════════════════ */


function AISummaryModule() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Critical Notices */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-gradient-to-r from-amber-500/5 to-transparent">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-foreground text-sm">Critical Notices</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-medium">
            <Sparkles className="w-3 h-3" /> AI Preview
          </span>
        </div>
        <div className="divide-y divide-border">
          {AI_NOTICES.map((n, i) => (
            <div key={i} className="px-5 py-4 flex gap-3">
              {n.severity === "warning"
                ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                : <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />}
              <div>
                <div className="text-sm font-medium text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary/70 bg-primary/8 px-2 py-0.5 rounded-full">
                  <LayoutDashboard className="w-3 h-3" /> {n.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Actions */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-gradient-to-r from-purple-500/5 to-transparent">
          <Zap className="w-4 h-4 text-purple-500" />
          <span className="font-semibold text-foreground text-sm">Suggested Actions</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 font-medium">
            <Sparkles className="w-3 h-3" /> AI Preview
          </span>
        </div>
        <div className="divide-y divide-border">
          {AI_ACTIONS.map((a, i) => (
            <div key={i} className="px-5 py-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                {a.icon}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{a.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{a.reason}</div>
                <div className="mt-1.5 text-[11px] text-muted-foreground/70 italic">{a.dashboardKind}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-muted/30 text-[11px] text-muted-foreground border-t border-border">
          ⚠️ AI suggestions are advisory only. Always verify before taking operational action.
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED — Dashboard Card Row (used by Recent + Favorite)
   ═══════════════════════════════════════════════════════════════════════════ */

function DashboardCardRow({
  cardIds,
  emptyMessage,
  onCardClick,
}: {
  cardIds: string[]
  emptyMessage: string
  onCardClick: (card: (typeof dashboardCards)[0]) => void
}) {
  const cards = cardIds
    .map((id) => dashboardCards.find((c) => c.id === id))
    .filter(Boolean) as (typeof dashboardCards)

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {cards.map((card, idx) => (
        <button
          key={card.id}
          onClick={() => onCardClick(card)}
          className="flex-shrink-0 text-left rounded-xl border-2 border-transparent hover:border-primary/40 transition-all"
        >
          <DashboardCard
            card={card}
            cardIndex={idx}
            thumbnailSrc={getEquipmentDashboardThumbnail(card.equipId)}
          />
        </button>
      ))}
    </div>
  )
}

function navigateToDashboardFromCard(
  card: (typeof dashboardCards)[0],
  currentPath: ReturnType<typeof useAppStore.getState>["currentPath"],
  addRecentDashboard: (cardId: string) => void,
  setCurrentPath: ReturnType<typeof useAppStore.getState>["setCurrentPath"],
  setCurrentView: ReturnType<typeof useAppStore.getState>["setCurrentView"],
  setViewMode: ReturnType<typeof useAppStore.getState>["setViewMode"]
) {
  addRecentDashboard(card.id)
  const site = sites.find((s) => s.plants.some((p) => p.equipment.some((e) => e.id === card.equipId)))
  const plant = site?.plants.find((p) => p.equipment.some((e) => e.id === card.equipId))
  setCurrentPath({
    site: site?.id ?? currentPath.site,
    plant: plant?.id ?? currentPath.plant,
    equipment: card.equipId,
    tab: card.tag,
  })
  setCurrentView("equipment")
  setViewMode("view")
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 3 — RECENT DASHBOARDS
   ═══════════════════════════════════════════════════════════════════════════ */

function RecentDashboardsModule() {
  const {
    recentDashboardIds,
    addRecentDashboard,
    setCurrentPath,
    setCurrentView,
    setViewMode,
    currentPath,
  } = useAppStore()

  const navigateToDashboard = (card: (typeof dashboardCards)[0]) =>
    navigateToDashboardFromCard(card, currentPath, addRecentDashboard, setCurrentPath, setCurrentView, setViewMode)

  return (
    <DashboardCardRow
      cardIds={recentDashboardIds}
      emptyMessage="No recently visited dashboards yet — navigate to an equipment dashboard to populate this list."
      onCardClick={navigateToDashboard}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 4 — FAVOURITE DASHBOARDS
   ═══════════════════════════════════════════════════════════════════════════ */

function FavoriteDashboardsModule() {
  const [showAll, setShowAll] = useState(false)
  const {
    favoriteDashboardIds,
    addRecentDashboard,
    setCurrentPath,
    setCurrentView,
    setViewMode,
    currentPath,
  } = useAppStore()

  const LIMIT = 6
  const visibleIds = showAll ? favoriteDashboardIds : favoriteDashboardIds.slice(0, LIMIT)
  const hasMore = favoriteDashboardIds.length > LIMIT

  const navigateToDashboard = (card: (typeof dashboardCards)[0]) =>
    navigateToDashboardFromCard(card, currentPath, addRecentDashboard, setCurrentPath, setCurrentView, setViewMode)

  return (
    <div>
      <DashboardCardRow
        cardIds={visibleIds}
        emptyMessage="No favorited dashboards yet — click the bookmark icon on any equipment dashboard to add it here."
        onCardClick={navigateToDashboard}
      />
      {hasMore && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          {showAll ? (
            <><ChevronDown className="w-4 h-4 rotate-180" /> Show fewer</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Show {favoriteDashboardIds.length - LIMIT} more</>
          )}
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 5 — CHANGE LOG
   ═══════════════════════════════════════════════════════════════════════════ */

function ChangeLogModule() {
  const [activeTab, setActiveTab] = useState<ChangeLogType | "all">("all")

  const filtered = activeTab === "all"
    ? changeLogEntries
    : changeLogEntries.filter((e) => e.type === activeTab)

  const typeColor = (type: ChangeLogType) =>
    type === "dashboard"
      ? "bg-blue-500/10 text-blue-600"
      : "bg-emerald-500/10 text-emerald-600"

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 border-b border-border pb-0">
        {(["all", "dashboard", "operation"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize -mb-px",
              activeTab === tab
                ? "bg-card border border-border border-b-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "all" ? "All Changes" : tab === "dashboard" ? "Dashboard" : "Operations"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((entry) => (
              <tr key={entry.id} className="hover:bg-secondary/30 transition-colors group">
                <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground font-mono text-xs">{entry.timestamp}</td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                      {entry.user[0]}
                    </div>
                    <span className="font-medium text-foreground text-xs">{entry.user}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-foreground max-w-xs">
                  <span className="line-clamp-2">{entry.action}</span>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground text-xs max-w-[200px] truncate">{entry.location}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium capitalize", typeColor(entry.type))}>
                    {entry.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE 6 — YOUR DOCUMENTS
   ═══════════════════════════════════════════════════════════════════════════ */

function DocumentsModule() {
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | "All">("All")
  const [assetFilter, setAssetFilter] = useState<string>("All")
  const [docSearch, setDocSearch] = useState("")

  // Build asset filter options
  const assetOptions = useMemo(() => buildAssetOptions(), [])

  const filtered = useMemo(
    () => filterDocuments(userDocuments, { categoryFilter, assetFilter, docSearch }),
    [categoryFilter, assetFilter, docSearch]
  )

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        {/* Category tabs */}
        <div className="flex items-center bg-secondary rounded-lg p-0.5 gap-0.5">
          {(["All", "Uploaded", "Shared"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                categoryFilter === cat
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "Uploaded" && <Upload className="w-3 h-3" />}
              {cat === "Shared" && <Users className="w-3 h-3" />}
              {cat === "All" && <BookOpen className="w-3 h-3" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Asset filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="h-8 px-2 bg-secondary border border-border rounded-lg text-xs text-foreground"
          >
            {assetOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Doc search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Filter documents…"
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-44"
          />
        </div>
      </div>

      {/* Document grid */}
      {filtered.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
          <FileText className="w-8 h-8" />
          <span className="text-sm">No documents match your filters.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentCard({ doc }: { doc: UserDocument }) {
  return (
    <button className="flex flex-col items-start p-4 bg-secondary/40 rounded-xl border border-border hover:border-primary/40 hover:bg-secondary/70 transition-all text-left group">
      <div className="mb-3">{FILE_ICONS[doc.fileType] ?? FILE_ICONS.link}</div>
      <div className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
        {doc.name}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
        <span className={cn("text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold", FILE_BADGE_COLORS[doc.fileType])}>
          {doc.fileType}
        </span>
        <span className="text-[10px] text-muted-foreground">{doc.size}</span>
      </div>
      {doc.sharedBy && (
        <div className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="w-2.5 h-2.5" /> {doc.sharedBy}
        </div>
      )}
      <div className="mt-1 text-[10px] text-muted-foreground/70">{doc.date}</div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER — reusable module title row
   ═══════════════════════════════════════════════════════════════════════════ */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-foreground text-base leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME VIEW — root export
   ═══════════════════════════════════════════════════════════════════════════ */

export function HomeView() {
  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ── Top greeting + Search ─────────────────────────────────────────── */}
        <div className="text-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Welcome back, Nhan 👋</h1>
            <p className="text-muted-foreground mt-1.5">
              Here&apos;s what&apos;s happening across your assets today.
            </p>
          </div>
          <GlobalSearchBar />
        </div>

        {/* ── AI Summary ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Sparkles className="w-4 h-4" />}
            title="AI Summary"
            subtitle="Automatically generated insights from recent operational data."
          />
          <AISummaryModule />
        </section>

        {/* ── Recent Dashboards ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Clock className="w-4 h-4" />}
            title="Recent Dashboards"
            subtitle="Your 6 most recently accessed dashboards, newest first."
          />
          <RecentDashboardsModule />
        </section>

        {/* ── Favorite Dashboards ───────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Star className="w-4 h-4" />}
            title="Favorite Dashboards"
            subtitle="Dashboards you've bookmarked from the equipment view."
          />
          <FavoriteDashboardsModule />
        </section>

        {/* ── Change Log ───────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<LayoutGrid className="w-4 h-4" />}
            title="Change Log"
            subtitle="Recent dashboard edits and operational changes across all assets."
          />
          <ChangeLogModule />
        </section>

        {/* ── Your Documents ───────────────────────────────────────────────── */}
        <section className="pb-10">
          <SectionHeader
            icon={<FileText className="w-4 h-4" />}
            title="Your Documents"
            subtitle="All documents you've uploaded or that have been shared with you."
          />
          <DocumentsModule />
        </section>

      </div>
    </div>
  )
}
