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

  return (
    <aside className="w-60 h-screen flex flex-col bg-sidebar-bg text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-base">SPM ONE</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* Portfolio Section */}
        <div className="px-3 mb-4">
          <div className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-2">
            Portfolio
          </div>
          {sites.map((site) => {
            const isSiteExpanded = expandedSites.includes(site.id)
            const isSiteActive = currentPath.site === site.id && currentView === "site"
            
            return (
              <div key={site.id}>
                <button
                  onClick={() => handleSiteClick(site.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
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
                    className="p-0.5"
                  >
                    {isSiteExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <Building2 className="w-4 h-4" />
                  <span>{site.name}</span>
                </button>

                {/* Plants */}
                {isSiteExpanded && site.plants.length > 0 && (
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
                            <Factory className="w-4 h-4" />
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
                                      <Box className="w-4 h-4" />
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

        {/* Workspace Section */}
        <div className="px-3 mb-4">
          <div className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-2">
            Workspace
          </div>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-hover transition-colors">
            <Star className="w-4 h-4" />
            <span>Favorite</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-hover transition-colors">
            <FolderOpen className="w-4 h-4" />
            <span>Share with me</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </button>
        </div>

        {/* Insight & Reports Section */}
        <div className="px-3 mb-4">
          <div className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-2">
            Insight & Reports
          </div>
          <button
            onClick={handleDataSyncClick}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
              currentView === "data-sync"
                ? "bg-sidebar-active text-white"
                : "hover:bg-sidebar-hover text-sidebar-foreground"
            )}
          >
            <Database className="w-4 h-4" />
            <span>Data & Sync</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-hover transition-colors">
            <FileText className="w-4 h-4" />
            <span>Shift Log</span>
          </button>
        </div>

        {/* Communication Section */}
        <div className="px-3">
          <div className="text-xs font-medium text-sidebar-muted uppercase tracking-wider mb-2 px-2">
            Communication
          </div>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-hover transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-sidebar-hover transition-colors">
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-active flex items-center justify-center">
            <span className="text-white text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">user1075920580</p>
            <p className="text-xs text-sidebar-muted truncate">Role: Integrity Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
