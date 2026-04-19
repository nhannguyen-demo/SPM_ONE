"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import type { ActiveModule } from "@/lib/store"
import { sites } from "@/lib/data"
import {
  Building2,
  Factory,
  Box,
  ChevronRight,
  ChevronDown,
  Star,
  FolderOpen,
  Database,
  FileText,
  MessageSquare,
  Bell,
  LayoutDashboard,
  BarChart3,
  Settings,
  Search,
  X,
  PanelLeftClose,
  Home,
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
   MODULE RAIL CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const MODULES: {
  key: ActiveModule
  icon: React.ReactNode
  label: string
}[] = [
  { key: "home",      icon: <Home className="w-5 h-5" />,           label: "Home"       },
  { key: "portfolio",  icon: <Building2 className="w-5 h-5" />,      label: "Assets"  },
  { key: "workspace",  icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard"  },
  { key: "insights",   icon: <BarChart3 className="w-5 h-5" />,       label: "Tools"   },
  { key: "comms",      icon: <MessageSquare className="w-5 h-5" />,   label: "Comms"      },
  { key: "settings",   icon: <Settings className="w-5 h-5" />,        label: "Settings"   },
]

const NAV_SEARCH_PLACEHOLDERS: Record<ActiveModule, string> = {
  home: "Search home…",
  portfolio: "Search assets…",
  workspace: "Search dashboards…",
  insights: "Search tools…",
  comms: "Search messages…",
  settings: "Search settings…",
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE RAIL — narrow 56px strip always visible on the far left
   ═══════════════════════════════════════════════════════════════════════════ */
function ModuleRail() {
  const { activeModule, setActiveModule, isPanelOpen, togglePanel, setCurrentView } = useAppStore()

  const handleModuleClick = (key: ActiveModule) => {
    if (key === "home") {
      // Home always navigates directly, never opens panel
      setActiveModule(key)
      setCurrentView("home")
      return
    }
    if (key === activeModule && isPanelOpen) {
      // Same icon clicked again → collapse panel
      togglePanel()
    } else {
      setActiveModule(key)   // opens panel + switches module
    }
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
            const isActive = activeModule === key && isPanelOpen
            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    id={`rail-btn-${key}`}
                    aria-label={label}
                    aria-pressed={isActive}
                    onClick={() => handleModuleClick(key)}
                    className={cn(
                      "w-full flex flex-col items-center justify-center gap-0.5",
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
                  </button>
                </TooltipTrigger>
                {/* Tooltip only useful when panel is closed */}
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
    portfolio: "Assets",
    workspace: "Dashboard",
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
      {/* Panel header */}
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

      {/* Per-module search (same pattern as former Assets search) */}
      <div className="px-2 pt-2 pb-2 border-b border-white/10 flex-shrink-0">
        <PanelSearchInput
          value={searchQuery}
          onChange={(q) => setNavPanelSearch(activeModule, q)}
          placeholder={NAV_SEARCH_PLACEHOLDERS[activeModule]}
        />
      </div>

      {/* Panel body — scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {activeModule === "home"      && <HomePanel />}
        {activeModule === "portfolio"  && <PortfolioPanel searchQuery={searchQuery} />}
        {activeModule === "workspace"  && <WorkspacePanel searchQuery={searchQuery} />}
        {activeModule === "insights"   && <InsightsPanel searchQuery={searchQuery} />}
        {activeModule === "comms"      && <CommsPanel searchQuery={searchQuery} />}
        {activeModule === "settings"   && <SettingsPanel searchQuery={searchQuery} />}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PANEL — shown when Home module is active (panel is closed; this is a
   fallback in case the panel is somehow open)
   ═══════════════════════════════════════════════════════════════════════════ */
function HomePanel() {
  const { setCurrentView, setViewMode } = useAppStore()
  return (
    <div className="px-3 py-2">
      <button
        onClick={() => { setCurrentView("home"); setViewMode("view") }}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm bg-sidebar-active text-white"
      >
        <Home className="w-4 h-4 flex-shrink-0" />
        <span>Home</span>
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTFOLIO PANEL — hierarchical asset tree with search
   ═══════════════════════════════════════════════════════════════════════════ */
function PortfolioPanel({ searchQuery }: { searchQuery: string }) {
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
    setWhatIfModalOpen,
  } = useAppStore()

  const handleSiteClick = (siteId: string) => {
    setCurrentPath({ site: siteId })
    setCurrentView("site")
    setViewMode("view")
    if (!expandedSites.includes(siteId)) toggleSiteExpanded(siteId)
  }

  const handlePlantClick = (siteId: string, plantId: string) => {
    setCurrentPath({ site: siteId, plant: plantId })
    setCurrentView("plant")
    setViewMode("view")
    if (!expandedPlants.includes(plantId)) togglePlantExpanded(plantId)
  }

  const handleEquipmentClick = (siteId: string, plantId: string, equipmentId: string) => {
    const site = sites.find(s => s.id === siteId)
    const plant = site?.plants.find(p => p.id === plantId)
    const equipment = plant?.equipment.find(e => e.id === equipmentId)
    const firstTab = equipment?.tabs?.[0] || "Overview"
    
    setCurrentPath({ site: siteId, plant: plantId, equipment: equipmentId, tab: firstTab })
    setCurrentView("equipment")
    setViewMode("view")
    if (!expandedEquipment.includes(equipmentId)) toggleEquipmentExpanded(equipmentId)
  }

  const handleTabClick = (siteId: string, plantId: string, equipmentId: string, tab: string) => {
    setCurrentPath({ site: siteId, plant: plantId, equipment: equipmentId, tab })
    setCurrentView("equipment")
    setViewMode("view")
  }

  /* ── Search / filter logic ── */
  const q = searchQuery.trim().toLowerCase()

  // Determine which nodes are visible given the query
  const filteredSites = sites.flatMap((site) => {
    if (!q) return [{ site, visible: true, matchedPlants: site.plants }]

    const siteMatches = site.name.toLowerCase().includes(q)

    const matchedPlants = site.plants.flatMap((plant) => {
      const plantMatches = plant.name.toLowerCase().includes(q)
      const matchedEquipment = plant.equipment.filter((eq) =>
        eq.name.toLowerCase().includes(q)
      )
      if (plantMatches || matchedEquipment.length > 0) {
        return [{ ...plant, equipment: plantMatches ? plant.equipment : matchedEquipment }]
      }
      return []
    })

    if (siteMatches || matchedPlants.length > 0) {
      return [{ site: { ...site, plants: siteMatches ? site.plants : matchedPlants }, visible: true, matchedPlants }]
    }
    return []
  })

  // Auto-expand parents when searching
  const autoExpand = q.length > 0

  return (
    <div className="px-2">
      {/* Asset tree */}
      {filteredSites.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No assets match.</p>
      ) : (
        filteredSites.map(({ site }) => {
          const isSiteExpanded = autoExpand || expandedSites.includes(site.id)
          const isSiteActive = currentPath.site === site.id && currentView === "site"

          return (
            <div key={site.id}>
              {/* Site row */}
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

              {/* Plants */}
              {isSiteExpanded && site.plants.length > 0 && (
                <div className="ml-4 mt-0.5">
                  {site.plants.map((plant) => {
                    const isPlantExpanded = autoExpand || expandedPlants.includes(plant.id)
                    const isPlantActive = currentPath.plant === plant.id && currentView === "plant"

                    return (
                      <div key={plant.id}>
                        <div
                          onClick={() => handlePlantClick(site.id, plant.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                            isPlantActive
                              ? "bg-sidebar-active text-white"
                              : "hover:bg-sidebar-hover text-sidebar-foreground"
                          )}
                        >
                          {plant.equipment.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePlantExpanded(plant.id)
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
                          <span className="truncate">{plant.name}</span>
                        </div>

                        {/* Equipment */}
                        {isPlantExpanded && plant.equipment.length > 0 && (
                          <div className="ml-4 mt-0.5">
                            {plant.equipment.map((equipment) => {
                              const isEquipExpanded = autoExpand || expandedEquipment.includes(equipment.id)
                              const isEquipActive = currentPath.equipment === equipment.id

                              return (
                                <div key={equipment.id}>
                                  <button
                                    onClick={() => handleEquipmentClick(site.id, plant.id, equipment.id)}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                      isEquipActive && currentView === "equipment"
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
   WORKSPACE PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function navMatches(label: string, q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return true
  return label.toLowerCase().includes(s)
}

function WorkspacePanel({ searchQuery }: { searchQuery: string }) {
  const q = searchQuery
  const items = [
    { key: "fav", label: "Favorite", icon: <Star className="w-4 h-4 flex-shrink-0" />, trailing: <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" /> },
    { key: "share", label: "Share with me", icon: <FolderOpen className="w-4 h-4 flex-shrink-0" />, trailing: <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" /> },
  ].filter((row) => navMatches(row.label, q))

  return (
    <div className="px-2 flex flex-col gap-0.5">
      {items.length === 0 ? (
        <p className="text-xs text-sidebar-muted px-1 py-2">No items match.</p>
      ) : (
        items.map((row) => (
          <PanelNavItem key={row.key} icon={row.icon} label={row.label}>
            {row.trailing}
          </PanelNavItem>
        ))
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   INSIGHTS PANEL
   ═══════════════════════════════════════════════════════════════════════════ */
function InsightsPanel({ searchQuery }: { searchQuery: string }) {
  const { currentView, setCurrentView, setViewMode, setWhatifSelectedScenarioId } = useAppStore()
  const q = searchQuery

  const handleDataSyncClick = () => {
    setCurrentView("data-sync")
    setViewMode("view")
  }

  const handleWhatIfClick = () => {
    setWhatifSelectedScenarioId("scenario-coke-drum")
    setCurrentView("whatif-tool")
    setViewMode("view")
  }

  const rows = [
    {
      key: "sync",
      label: "Data & Sync",
      icon: <Database className="w-4 h-4 flex-shrink-0" />,
      onClick: handleDataSyncClick,
      active: currentView === "data-sync",
    },
    {
      key: "shift",
      label: "Shift Log",
      icon: <FileText className="w-4 h-4 flex-shrink-0" />,
    },
    {
      key: "whatif",
      label: "What-If Scenarios",
      icon: <BarChart3 className="w-4 h-4 flex-shrink-0" />,
      onClick: handleWhatIfClick,
      active: currentView === "whatif-tool",
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
  const q = searchQuery
  const items = [
    { key: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4 flex-shrink-0" /> },
    { key: "alerts", label: "Alerts", icon: <Bell className="w-4 h-4 flex-shrink-0" /> },
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
