"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import type { ActiveModule } from "@/lib/store"
import { FolderTree } from "@/components/workspace/folder-tree"
import { sites } from "@/lib/data"
import { MODULES, NAV_SEARCH_PLACEHOLDERS, navMatches } from "@/components/sidebar/config"
import { useWorkspaceStore, selectMyUnreadCount } from "@/lib/workspace/store"
import { useRouter, usePathname } from "next/navigation"
import {
  Building2,
  Factory,
  Box,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Database,
  FileText,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  Search,
  X,
  PanelLeftClose,
  Home,
  LayoutGrid,
  Inbox,
  Clock,
  Trash2,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function PanelSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (q: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-muted pointer-events-none" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full pl-7 pr-7 py-1.5 rounded-md text-xs",
          "bg-sidebar-hover text-sidebar-foreground placeholder:text-sidebar-muted",
          "border border-white/10 focus:outline-none focus:border-sidebar-active",
          "transition-colors duration-150"
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-muted hover:text-sidebar-foreground"
        >
          <X className="w-3 h-3" />
        </button>
      ) : null}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cross-routing helpers — bridge legacy `currentView` SPA with new App Router
   surfaces (/workspace, /comms/alerts, etc.).
   ═══════════════════════════════════════════════════════════════════════════ */

/** Modules that own dedicated App Router pages. Clicking the rail icon for one
 *  of these performs a `router.push` instead of just toggling the legacy
 *  in-page view. */
const APP_ROUTER_MODULES: Partial<Record<ActiveModule, string>> = {
  workspace: "/workspace",
  comms: "/comms/alerts",
}

function useIsOnAppRouter() {
  const pathname = usePathname() || "/"
  return pathname !== "/"
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE RAIL — narrow 56px strip always visible on the far left
   ═══════════════════════════════════════════════════════════════════════════ */
function ModuleRail() {
  const { activeModule, setActiveModule, isPanelOpen, togglePanel, setCurrentView } = useAppStore()
  const router = useRouter()
  const onAppRouter = useIsOnAppRouter()
  const unreadAlerts = useWorkspaceStore(selectMyUnreadCount)

  const handleModuleClick = (key: ActiveModule) => {
    const targetRoute = APP_ROUTER_MODULES[key]

    // Same module clicked again with panel open → just collapse the panel.
    if (key === activeModule && isPanelOpen && !targetRoute) {
      togglePanel()
      return
    }

    if (targetRoute) {
      setActiveModule(key)
      router.push(targetRoute)
      return
    }

    // Legacy module — must return to single-page shell first.
    if (onAppRouter) {
      router.push("/")
    }

    if (key === "home") {
      setActiveModule(key)
      setCurrentView("home")
      return
    }

    setActiveModule(key)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          "flex flex-col items-center flex-shrink-0",
          "bg-sidebar-bg text-sidebar-foreground",
          "border-r border-white/10",
          "w-14 h-screen py-3 gap-1"
        )}
      >
        {/* Logo mark */}
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mb-3 flex-shrink-0">
          <span className="text-primary-foreground font-bold text-sm select-none">A</span>
        </div>

        {/* Module buttons */}
        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1">
          {MODULES.map(({ key, icon, label }) => {
            const isActive = activeModule === key
            const showBadge = key === "comms" && unreadAlerts > 0
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    id={`rail-btn-${key}`}
                    aria-label={label}
                    aria-pressed={isActive}
                    onClick={() => handleModuleClick(key)}
                    className={cn(
                      "relative w-full flex flex-col items-center justify-center gap-0.5",
                      "rounded-lg py-2 px-1 transition-colors duration-150 cursor-pointer",
                      isActive
                        ? "bg-sidebar-active text-white"
                        : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
                    )}
                  >
                    {icon}
                    <span className="text-[9px] font-medium leading-tight tracking-wide select-none">
                      {label}
                    </span>
                    {showBadge && (
                      <span
                        className={cn(
                          "absolute top-1 right-2 min-w-[16px] h-4 px-1 rounded-full",
                          "bg-rose-500 text-white text-[9px] font-bold",
                          "flex items-center justify-center leading-none"
                        )}
                        aria-label={`${unreadAlerts} unread alerts`}
                      >
                        {unreadAlerts > 99 ? "99+" : unreadAlerts}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {!isPanelOpen && (
                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* User avatar at the bottom */}
        <div className="mt-auto mb-1">
          <div className="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium select-none">U</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXTUAL PANEL — slides in/out next to the rail
   ═══════════════════════════════════════════════════════════════════════════ */
function ContextualPanel() {
  const {
    activeModule,
    isPanelOpen,
    togglePanel,
    navPanelSearch,
    setNavPanelSearch,
  } = useAppStore()

  const MODULE_LABELS: Record<ActiveModule, string> = {
    home:      "Home",
    assets: "Assets",
    workspace: "Workspace",
    insights:  "Tools",
    comms:     "Comms",
    settings:  "Settings",
  }

  const searchQuery = navPanelSearch[activeModule]

  return (
    <div
      className={cn(
        "h-screen flex flex-col flex-shrink-0",
        "bg-sidebar-bg text-sidebar-foreground",
        "border-r border-white/10",
        "overflow-hidden transition-all duration-150 ease-in-out",
        isPanelOpen ? "w-[220px]" : "w-0"
      )}
    >
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/10 flex-shrink-0 min-h-[61px]">
        <span className="font-semibold text-base whitespace-nowrap text-sidebar-foreground">
          {MODULE_LABELS[activeModule]}
        </span>
        <button
          onClick={togglePanel}
          aria-label="Close panel"
          className={cn(
            "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
            "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
            "transition-colors duration-150"
          )}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="px-2 pt-2 pb-2 border-b border-white/10 flex-shrink-0">
        <PanelSearchInput
          value={searchQuery}
          onChange={(q) => setNavPanelSearch(activeModule, q)}
          placeholder={NAV_SEARCH_PLACEHOLDERS[activeModule]}
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {activeModule === "home"      && <HomePanel />}
        {activeModule === "assets"     && <AssetsPanel searchQuery={searchQuery} />}
        {activeModule === "workspace"  && <WorkspacePanel searchQuery={searchQuery} />}
        {activeModule === "insights"   && <InsightsPanel searchQuery={searchQuery} />}
        {activeModule === "comms"      && <CommsPanel searchQuery={searchQuery} />}
        {activeModule === "settings"   && <SettingsPanel searchQuery={searchQuery} />}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function HomePanel() {
  const { setCurrentView, setViewMode } = useAppStore()
  const router = useRouter()
  const onAppRouter = useIsOnAppRouter()
  return (
    <div className="px-3 py-2">
      <button
        onClick={() => {
          if (onAppRouter) router.push("/")
          setCurrentView("home")
          setViewMode("view")
        }}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm bg-sidebar-active text-white"
      >
        <Home className="w-4 h-4 flex-shrink-0" />
        <span>Home</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASSETS PANEL — hierarchical tree (unchanged)
   ═══════════════════════════════════════════════════════════════════════════ */
function AssetsPanel({ searchQuery }: { searchQuery: string }) {
  const {
    currentPath,
    setCurrentPath,
    expandedSites,
    expandedPlants,
    expandedEquipment,
    toggleSiteExpanded,
    togglePlantExpanded,
    toggleEquipmentExpanded,
    currentView,
    setCurrentView,
    setViewMode,
  } = useAppStore()
  const router = useRouter()
  const onAppRouter = useIsOnAppRouter()

  const ensureSpaShell = () => {
    if (onAppRouter) router.push("/")
  }

  const handleSiteClick = (siteId: string) => {
    ensureSpaShell()
    setCurrentPath({ site: siteId })
    setCurrentView("site")
    setViewMode("view")
    if (!expandedSites.includes(siteId)) toggleSiteExpanded(siteId)
  }

  const handlePlantClick = (siteId: string, plantId: string) => {
    ensureSpaShell()
    setCurrentPath({ site: siteId, plant: plantId })
    setCurrentView("plant")
    setViewMode("view")
    if (!expandedPlants.includes(plantId)) togglePlantExpanded(plantId)
  }

  const handleEquipmentClick = (siteId: string, plantId: string, equipmentId: string) => {
    ensureSpaShell()
    const site = sites.find((s) => s.id === siteId)
    const unit = site?.units.find((p) => p.id === plantId)
    const equipment = unit?.equipment.find((e) => e.id === equipmentId)
    if (equipment?.isPlaceholder) return
    const firstTab = equipment?.tabs?.[0] || "Overview"

    setCurrentPath({ site: siteId, plant: plantId, equipment: equipmentId, tab: firstTab })
    setCurrentView("equipment-home")
    setViewMode("view")
    if (!expandedEquipment.includes(equipmentId)) toggleEquipmentExpanded(equipmentId)
  }

  const q = searchQuery.trim().toLowerCase()

  const filteredSites = sites.flatMap((site) => {
    if (!q) return [{ site, visible: true, matchedUnits: site.units }]

    const siteMatches = site.name.toLowerCase().includes(q)

    const matchedUnits = site.units.flatMap((unit) => {
      const unitMatches = unit.name.toLowerCase().includes(q)
      const matchedEquipment = unit.equipment.filter((eq) =>
        eq.name.toLowerCase().includes(q)
      )
      if (unitMatches || matchedEquipment.length > 0) {
        return [{ ...unit, equipment: unitMatches ? unit.equipment : matchedEquipment }]
      }
      return []
    })

    if (siteMatches || matchedUnits.length > 0) {
      return [{ site: { ...site, units: siteMatches ? site.units : matchedUnits }, visible: true, matchedUnits }]
    }
    return []
  })

  const autoExpand = q.length > 0

  return (
    <div className="px-2">
      {filteredSites.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No assets match.</p>
      ) : (
        filteredSites.map(({ site }) => {
          const isSiteExpanded = autoExpand || expandedSites.includes(site.id)
          const isSiteActive = currentPath.site === site.id && currentView === "site"

          return (
            <div key={site.id}>
              <div className="relative group/site">
                <div
                  onClick={() => handleSiteClick(site.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                    isSiteActive
                      ? "bg-sidebar-active text-white"
                      : "hover:bg-sidebar-hover text-sidebar-foreground"
                  )}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSiteExpanded(site.id)
                    }}
                    className="p-0.5 flex-shrink-0"
                  >
                    {isSiteExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{site.name}</span>
                </div>
              </div>

              {isSiteExpanded && site.units.length > 0 && (
                <div className="ml-4 mt-0.5">
                  {site.units.map((unit) => {
                    const isPlantExpanded = autoExpand || expandedPlants.includes(unit.id)
                    const isPlantActive = currentPath.plant === unit.id && currentView === "plant"

                    return (
                      <div key={unit.id}>
                        <div
                          onClick={() => handlePlantClick(site.id, unit.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                            isPlantActive
                              ? "bg-sidebar-active text-white"
                              : "hover:bg-sidebar-hover text-sidebar-foreground"
                          )}
                        >
                          {unit.equipment.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePlantExpanded(unit.id)
                              }}
                              className="p-0.5 flex-shrink-0"
                            >
                              {isPlantExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 flex-shrink-0" />
                          )}
                          <Factory className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{unit.name}</span>
                        </div>

                        {isPlantExpanded && unit.equipment.length > 0 && (
                          <div className="ml-4 mt-0.5">
                            {unit.equipment.map((equipment) => {
                              const isEquipActive = currentPath.equipment === equipment.id
                              const isPlaceholder = equipment.isPlaceholder
                              return (
                                <div key={equipment.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleEquipmentClick(site.id, unit.id, equipment.id)}
                                    disabled={isPlaceholder}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                      isPlaceholder
                                        ? "text-sidebar-muted/80 cursor-default"
                                        : isEquipActive && (currentView === "equipment" || currentView === "equipment-home" || currentView === "workspace")
                                        ? "bg-sidebar-active text-white"
                                        : "hover:bg-sidebar-hover text-sidebar-foreground"
                                    )}
                                  >
                                    <span className="w-4 flex-shrink-0" />
                                    <Box className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">{equipment.name}</span>
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORKSPACE PANEL — clean 4-entry submenu (per Task 24)
   ═══════════════════════════════════════════════════════════════════════════ */
function WorkspacePanel({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="px-2">
      <FolderTree tone="sidebar" inline searchQuery={searchQuery} />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INSIGHTS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function InsightsPanel({ searchQuery }: { searchQuery: string }) {
  const { currentView, setCurrentView, setViewMode, setWhatIfSelectedScenarioId } = useAppStore()
  const router = useRouter()
  const onAppRouter = useIsOnAppRouter()
  const q = searchQuery

  const ensureSpaShell = () => {
    if (onAppRouter) router.push("/")
  }

  const handleDataSyncClick = () => {
    ensureSpaShell()
    setCurrentView("data-sync")
    setViewMode("view")
  }

  const handleWhatIfClick = () => {
    ensureSpaShell()
    setWhatIfSelectedScenarioId("scenario-coke-drum")
    setCurrentView("whatIfTool")
    setViewMode("view")
  }

  const rows = [
    {
      key: "sync",
      label: "Data & Sync",
      icon: <Database className="w-4 h-4 flex-shrink-0" />,
      onClick: handleDataSyncClick,
      active: !onAppRouter && currentView === "data-sync",
    },
    {
      key: "shift",
      label: "Shift Log",
      icon: <FileText className="w-4 h-4 flex-shrink-0" />,
    },
    {
      key: "documents",
      label: "Documents",
      icon: <FolderOpen className="w-4 h-4 flex-shrink-0" />,
      onClick: () => { ensureSpaShell(); setCurrentView("documents-tool"); setViewMode("view") },
      active: !onAppRouter && currentView === "documents-tool",
    },
    {
      key: "what-if-scenarios",
      label: "What-If Scenario",
      icon: <BarChart3 className="w-4 h-4 flex-shrink-0" />,
      onClick: handleWhatIfClick,
      active: !onAppRouter && currentView === "whatIfTool",
    },
  ].filter((row) => navMatches(row.label, q))

  return (
    <div className="px-2 flex flex-col gap-0.5">
      {rows.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No items match.</p>
      ) : (
        rows.map((row) => (
          <PanelNavItem
            key={row.key}
            icon={row.icon}
            label={row.label}
            onClick={row.onClick}
            active={row.active}
          />
        ))
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMMS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function CommsPanel({ searchQuery }: { searchQuery: string }) {
  const router = useRouter()
  const pathname = usePathname() || "/"
  const unread = useWorkspaceStore(selectMyUnreadCount)
  const q = searchQuery

  const items = [
    {
      key: "chat",
      label: "Chat",
      icon: <MessageSquare className="w-4 h-4 flex-shrink-0" />,
      onClick: () => {},
      active: false,
      badge: 0,
    },
    {
      key: "alerts",
      label: "Alerts",
      icon: <Bell className="w-4 h-4 flex-shrink-0" />,
      onClick: () => router.push("/comms/alerts"),
      active: pathname === "/comms/alerts",
      badge: unread,
    },
  ].filter((row) => navMatches(row.label, q))

  return (
    <div className="px-2 flex flex-col gap-0.5">
      {items.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No items match.</p>
      ) : (
        items.map((row) => (
          <PanelNavItem
            key={row.key}
            icon={row.icon}
            label={row.label}
            onClick={row.onClick}
            active={row.active}
          >
            {row.badge > 0 && (
              <span
                className={cn(
                  "ml-auto min-w-[18px] h-[18px] px-1.5 rounded-full",
                  "bg-rose-500 text-white text-[10px] font-bold",
                  "flex items-center justify-center leading-none"
                )}
              >
                {row.badge > 99 ? "99+" : row.badge}
              </span>
            )}
          </PanelNavItem>
        ))
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SETTINGS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function SettingsPanel({ searchQuery }: { searchQuery: string }) {
  const q = searchQuery
  const items = [
    { key: "gen", label: "General", icon: <Settings className="w-4 h-4 flex-shrink-0" /> },
    { key: "int", label: "Integrations", icon: <Database className="w-4 h-4 flex-shrink-0" /> },
    { key: "notif", label: "Notifications", icon: <Bell className="w-4 h-4 flex-shrink-0" /> },
  ].filter((row) => navMatches(row.label, q))

  return (
    <div className="px-2 flex flex-col gap-0.5">
      {items.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No items match.</p>
      ) : (
        items.map((row) => <PanelNavItem key={row.key} icon={row.icon} label={row.label} />)
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PanelNavItem — reusable flat item inside contextual panels
   ═══════════════════════════════════════════════════════════════════════════ */
interface PanelNavItemProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
  children?: React.ReactNode
}

function PanelNavItem({ icon, label, onClick, active, children }: PanelNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "bg-sidebar-active text-white"
          : "hover:bg-sidebar-hover text-sidebar-foreground"
      )}
    >
      {icon}
      <span className="truncate text-left">{label}</span>
      {children}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR — top-level export: flex row of Rail + Panel
   ═══════════════════════════════════════════════════════════════════════════ */
export function Sidebar() {
  return (
    <div className="flex flex-row h-screen flex-shrink-0">
      <ModuleRail />
      <ContextualPanel />
    </div>
  )
}
