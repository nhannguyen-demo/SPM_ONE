"use client"

import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  Search,
  Filter,
  X,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronDown,
  Plus,
  Folder,
  ChevronRight as ChevronRightIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  useWorkspaceStore,
} from "@/lib/workspace/store"
import { getCurrentUserId, ORG_USERS } from "@/lib/workspace/identity"
import { sites } from "@/lib/data"
import type {
  DashboardSortDir,
  DashboardSortKey,
  WorkspaceFilters,
} from "@/lib/workspace/types"

const SORT_LABELS: Record<DashboardSortKey, string> = {
  lastChange: "Last change",
  name: "Name",
  created: "Created",
  equipment: "Equipment",
}

const STATUS_LABELS = { "": "Any status", created: "Draft", published: "Published" } as const

function activeFilterCount(filters: WorkspaceFilters): number {
  let n = 0
  for (const v of Object.values(filters)) if (v) n++
  return n
}

export interface WorkspaceToolbarProps {
  /** The breadcrumb / page title shown above the search row. */
  title: string
  subtitle?: string
  breadcrumb?: Array<{ label: string; onClick?: () => void }>
  /** Hide the New button (e.g. on Trash / Recent / Shared). */
  hideNew?: boolean
  onCreateDashboard?: () => void
}

export function WorkspaceToolbar({
  title,
  subtitle,
  breadcrumb,
  hideNew,
  onCreateDashboard,
}: WorkspaceToolbarProps) {
  // useShallow keeps the subscription stable when the underlying arrays are
  // unchanged; otherwise array-returning selectors create a new reference on
  // every call and trigger an infinite render loop with useSyncExternalStore.
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilters,
    sortKey,
    sortDir,
    setSort,
    rawFolders,
  } = useWorkspaceStore(
    useShallow((s) => ({
      searchQuery: s.searchQuery,
      setSearchQuery: s.setSearchQuery,
      filters: s.filters,
      setFilter: s.setFilter,
      clearFilters: s.clearFilters,
      sortKey: s.sortKey,
      sortDir: s.sortDir,
      setSort: s.setSort,
      rawFolders: s.folders,
    }))
  )

  const meId = getCurrentUserId()
  const folders = useMemo(
    () => rawFolders.filter((f) => f.ownerUserId === meId),
    [rawFolders, meId]
  )

  const [open, setOpen] = useState(false)
  const fc = activeFilterCount(filters)

  const allEquipment = useMemo(
    () =>
      sites.flatMap((site) =>
        site.plants.flatMap((p) =>
          p.equipment.map((e) => ({ id: e.id, label: `${e.name} (${p.name})` }))
        )
      ),
    []
  )

  void folders

  return (
    <div className="border-b border-border bg-background/80 backdrop-blur px-6 py-4 flex flex-col gap-3">
      {/* Breadcrumb / title row */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div className="space-y-0.5 min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  {b.onClick ? (
                    <button onClick={b.onClick} className="hover:text-foreground transition-colors">
                      {b.label}
                    </button>
                  ) : (
                    <span>{b.label}</span>
                  )}
                  {i < breadcrumb.length - 1 && (
                    <ChevronRightIcon className="w-3 h-3 text-muted-foreground/60" />
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-bold text-foreground truncate flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500 flex-shrink-0" />
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!hideNew && onCreateDashboard && (
            <Button onClick={onCreateDashboard} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Search + filters + sort row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dashboards by name…"
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="w-4 h-4" />
              Filters
              {fc > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {fc}
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Filter dashboards</div>
              {fc > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Equipment</Label>
              <select
                value={filters.equipmentId}
                onChange={(e) => setFilter("equipmentId", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Any equipment</option>
                {allEquipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilter("status", e.target.value as WorkspaceFilters["status"])
                }
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                {(Object.entries(STATUS_LABELS) as Array<[
                  WorkspaceFilters["status"],
                  string,
                ]>).map(([k, lbl]) => (
                  <option key={k} value={k}>
                    {lbl}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Creator</Label>
                <select
                  value={filters.creatorUserId}
                  onChange={(e) => setFilter("creatorUserId", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Anyone</option>
                  {ORG_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Contributor</Label>
                <select
                  value={filters.contributorUserId}
                  onChange={(e) => setFilter("contributorUserId", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">Anyone</option>
                  {ORG_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Changed from</Label>
                <Input
                  type="date"
                  value={filters.changedFrom}
                  onChange={(e) => setFilter("changedFrom", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Changed to</Label>
                <Input
                  type="date"
                  value={filters.changedTo}
                  onChange={(e) => setFilter("changedTo", e.target.value)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              {sortDir === "asc" ? (
                <ArrowUpAZ className="w-4 h-4" />
              ) : (
                <ArrowDownAZ className="w-4 h-4" />
              )}
              Sort: {SORT_LABELS[sortKey]}
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortKey}
              onValueChange={(v) => setSort(v as DashboardSortKey, sortDir)}
            >
              {(Object.keys(SORT_LABELS) as DashboardSortKey[]).map((k) => (
                <DropdownMenuRadioItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Direction</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sortDir}
              onValueChange={(v) => setSort(sortKey, v as DashboardSortDir)}
            >
              <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filter chips */}
      {fc > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.equipmentId && (
            <FilterChip
              label={`Equipment: ${allEquipment.find((e) => e.id === filters.equipmentId)?.label ?? filters.equipmentId}`}
              onClear={() => setFilter("equipmentId", "")}
            />
          )}
          {filters.status && (
            <FilterChip
              label={`Status: ${STATUS_LABELS[filters.status]}`}
              onClear={() => setFilter("status", "")}
            />
          )}
          {filters.creatorUserId && (
            <FilterChip
              label={`Creator: ${ORG_USERS.find((u) => u.id === filters.creatorUserId)?.name ?? filters.creatorUserId}`}
              onClear={() => setFilter("creatorUserId", "")}
            />
          )}
          {filters.contributorUserId && (
            <FilterChip
              label={`Contributor: ${ORG_USERS.find((u) => u.id === filters.contributorUserId)?.name ?? filters.contributorUserId}`}
              onClear={() => setFilter("contributorUserId", "")}
            />
          )}
          {filters.changedFrom && (
            <FilterChip
              label={`From: ${filters.changedFrom}`}
              onClear={() => setFilter("changedFrom", "")}
            />
          )}
          {filters.changedTo && (
            <FilterChip
              label={`To: ${filters.changedTo}`}
              onClear={() => setFilter("changedTo", "")}
            />
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5",
        "bg-primary/10 text-primary border border-primary/20"
      )}
    >
      {label}
      <button
        type="button"
        onClick={onClear}
        className="hover:bg-primary/20 rounded-full p-0.5"
        aria-label={`Clear ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}
