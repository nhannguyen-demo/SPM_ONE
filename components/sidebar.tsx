"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
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
  Hash,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

export function Sidebar() {
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
    sidebarCollapsed,
    toggleSidebarCollapsed,
  } = useAppStore()

  const handleSiteClick = (siteId: string) => {
    setCurrentPath({ site: siteId })
    setCurrentView("site")
    setViewMode("view")
    if (!expandedSites.includes(siteId)) {
      toggleSiteExpanded(siteId)
    }
  }

  const handlePlantClick = (siteId: string, plantId: string) => {
    setCurrentPath({ site: siteId, plant: plantId })
    setCurrentView("plant")
    setViewMode("view")
    if (!expandedPlants.includes(plantId)) {
      togglePlantExpanded(plantId)
    }
  }

  const handleEquipmentClick = (siteId: string, plantId: string, equipmentId: string) => {
    setCurrentPath({ site: siteId, plant: plantId, equipment: equipmentId, tab: "#process" })
    setCurrentView("equipment")
    setViewMode("view")
    if (!expandedEquipment.includes(equipmentId)) {
      toggleEquipmentExpanded(equipmentId)
    }
  }

  const handleTabClick = (siteId: string, plantId: string, equipmentId: string, tab: string) => {
    setCurrentPath({ site: siteId, plant: plantId, equipment: equipmentId, tab })
    setCurrentView("equipment")
    setViewMode("view")
  }

  const handleDataSyncClick = () => {
    setCurrentView("data-sync")
    setViewMode("view")
  }

  const collapsed = sidebarCollapsed

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar-bg text-sidebar-foreground flex-shrink-0",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo + Collapse toggle */}
      <div className="border-b border-white/10 min-h-[61px]">
        {collapsed ? (
          /* ── Collapsed header: avatar + expand button stacked ── */
          <div className="flex flex-col items-center justify-center h-full py-3 gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <button
              onClick={toggleSidebarCollapsed}
              aria-label="Expand sidebar"
              className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center",
                "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
                "transition-colors duration-150"
              )}
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ── Expanded header: logo + name + collapse button in a row ── */
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-base flex-1 whitespace-nowrap">SPM ONE</span>
            <button
              onClick={toggleSidebarCollapsed}
              aria-label="Collapse sidebar"
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center",
                "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover",
                "transition-colors duration-150"
              )}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        {/* ── Portfolio Section ── */}
        <div className="px-2 mb-4">
          {/* Section label */}
          <div
            className={cn(
              "text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-1 whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
            )}
          >
            Portfolio
          </div>

          {sites.map((site) => {
            const isSiteExpanded = expandedSites.includes(site.id)
            const isSiteActive = currentPath.site === site.id && currentView === "site"

            return (
              <div key={site.id}>
                <div className="relative group/site">
                  <button
                    onClick={() => handleSiteClick(site.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      isSiteActive
                        ? "bg-sidebar-active text-white"
                        : "hover:bg-sidebar-hover text-sidebar-foreground"
                    )}
                  >
                    {/* Expand / collapse chevron for tree */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSiteExpanded(site.id)
                      }}
                      className={cn(
                        "p-0.5 flex-shrink-0 transition-all duration-300",
                        collapsed ? "w-0 opacity-0 pointer-events-none overflow-hidden" : ""
                      )}
                    >
                      {isSiteExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Building2 className="w-4 h-4 flex-shrink-0" />

                    <span
                      className={cn(
                        "whitespace-nowrap overflow-hidden transition-all duration-300",
                        collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                      )}
                    >
                      {site.name}
                    </span>
                  </button>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover/site:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
                      {site.name}
                    </div>
                  )}
                </div>

                {/* Plants – hidden when sidebar is collapsed */}
                {!collapsed && isSiteExpanded && site.plants.length > 0 && (
                  <div className="ml-4 mt-1">
                    {site.plants.map((plant) => {
                      const isPlantExpanded = expandedPlants.includes(plant.id)
                      const isPlantActive = currentPath.plant === plant.id && currentView === "plant"

                      return (
                        <div key={plant.id}>
                          <button
                            onClick={() => handlePlantClick(site.id, plant.id)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
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
                                className="p-0.5"
                              >
                                {isPlantExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            ) : (
                              <span className="w-4" />
                            )}
                            <Factory className="w-4 h-4 flex-shrink-0" />
                            <span>{plant.name}</span>
                          </button>

                          {/* Equipment */}
                          {isPlantExpanded && plant.equipment.length > 0 && (
                            <div className="ml-4 mt-1">
                              {plant.equipment.map((equipment) => {
                                const isEquipmentExpanded = expandedEquipment.includes(equipment.id)
                                const isEquipmentActive = currentPath.equipment === equipment.id

                                return (
                                  <div key={equipment.id}>
                                    <button
                                      onClick={() => handleEquipmentClick(site.id, plant.id, equipment.id)}
                                      className={cn(
                                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                        isEquipmentActive && currentView === "equipment" && !currentPath.tab
                                          ? "bg-sidebar-active text-white"
                                          : "hover:bg-sidebar-hover text-sidebar-foreground"
                                      )}
                                    >
                                      {equipment.tabs.length > 0 ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleEquipmentExpanded(equipment.id)
                                          }}
                                          className="p-0.5"
                                        >
                                          {isEquipmentExpanded ? (
                                            <ChevronDown className="w-3.5 h-3.5" />
                                          ) : (
                                            <ChevronRight className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      ) : (
                                        <span className="w-4" />
                                      )}
                                      <Box className="w-4 h-4 flex-shrink-0" />
                                      <span>{equipment.name}</span>
                                    </button>

                                    {/* Tabs */}
                                    {isEquipmentExpanded && equipment.tabs.length > 0 && (
                                      <div className="ml-6 mt-1">
                                        {equipment.tabs.map((tab) => {
                                          const isTabActive = currentPath.tab === tab && currentPath.equipment === equipment.id

                                          return (
                                            <button
                                              key={tab}
                                              onClick={() => handleTabClick(site.id, plant.id, equipment.id, tab)}
                                              className={cn(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                                                isTabActive
                                                  ? "bg-sidebar-active text-white"
                                                  : "hover:bg-sidebar-hover text-sidebar-foreground"
                                              )}
                                            >
                                              <Hash className="w-3.5 h-3.5" />
                                              <span>{tab.replace("#", "")}</span>
                                            </button>
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
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Workspace Section ── */}
        <div className="px-2 mb-4">
          <div
            className={cn(
              "text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-1 whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
            )}
          >
            Workspace
          </div>

          <NavItem collapsed={collapsed} icon={<Star className="w-4 h-4 flex-shrink-0" />} label="Favorite" tooltip="Favorite">
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </NavItem>

          <NavItem collapsed={collapsed} icon={<FolderOpen className="w-4 h-4 flex-shrink-0" />} label="Share with me" tooltip="Share with me">
            {!collapsed && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
          </NavItem>
        </div>

        {/* ── Insight & Reports Section ── */}
        <div className="px-2 mb-4">
          <div
            className={cn(
              "text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-1 whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
            )}
          >
            Insight &amp; Reports
          </div>

          <NavItem
            collapsed={collapsed}
            icon={<Database className="w-4 h-4 flex-shrink-0" />}
            label="Data &amp; Sync"
            tooltip="Data & Sync"
            onClick={handleDataSyncClick}
            active={currentView === "data-sync"}
          />

          <NavItem collapsed={collapsed} icon={<FileText className="w-4 h-4 flex-shrink-0" />} label="Shift Log" tooltip="Shift Log" />
        </div>

        {/* ── Communication Section ── */}
        <div className="px-2">
          <div
            className={cn(
              "text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-1 whitespace-nowrap overflow-hidden transition-all duration-300",
              collapsed ? "opacity-0 h-0 mb-0" : "opacity-100 h-auto"
            )}
          >
            Communication
          </div>

          <NavItem collapsed={collapsed} icon={<MessageSquare className="w-4 h-4 flex-shrink-0" />} label="Chat" tooltip="Chat" />
          <NavItem collapsed={collapsed} icon={<Bell className="w-4 h-4 flex-shrink-0" />} label="Alerts" tooltip="Alerts" />
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-active flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          <div
            className={cn(
              "flex-1 min-w-0 overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <p className="text-sm font-medium truncate">user1075920580</p>
            <p className="text-xs text-sidebar-muted truncate">Role: Integrity Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

/* ─────────────────────────────────────────────────────────────
   NavItem helper – handles collapsed / expanded rendering
   and shows a tooltip when the sidebar is collapsed
───────────────────────────────────────────────────────────── */
interface NavItemProps {
  collapsed: boolean
  icon: React.ReactNode
  label: string
  tooltip: string
  onClick?: () => void
  active?: boolean
  children?: React.ReactNode
}

function NavItem({ collapsed, icon, label, tooltip, onClick, active, children }: NavItemProps) {
  return (
    <div className="relative group/nav">
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
        <span
          className={cn(
            "whitespace-nowrap overflow-hidden transition-all duration-300",
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          )}
          dangerouslySetInnerHTML={{ __html: label }}
        />
        {children}
      </button>

      {/* Tooltip shown only when collapsed */}
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  )
}
