"use client"

import { create } from "zustand"

export type NavigationPath = {
  site?: string
  plant?: string
  equipment?: string
  tab?: string
}

export type ViewMode = "view" | "edit" | "modules"

interface AppState {
  // Navigation
  currentPath: NavigationPath
  setCurrentPath: (path: NavigationPath) => void
  
  // Sidebar expansion state
  expandedSites: string[]
  expandedPlants: string[]
  expandedEquipment: string[]
  toggleSiteExpanded: (siteId: string) => void
  togglePlantExpanded: (plantId: string) => void
  toggleEquipmentExpanded: (equipmentId: string) => void
  
  // Current view
  currentView: "site" | "plant" | "equipment" | "data-sync"
  setCurrentView: (view: "site" | "plant" | "equipment" | "data-sync") => void
  
  // Dashboard edit mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  
  // What-If Scenario Modal
  whatIfModalOpen: boolean
  whatIfResultOpen: boolean
  setWhatIfModalOpen: (open: boolean) => void
  setWhatIfResultOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentPath: { site: "site-x" },
  setCurrentPath: (path) => set({ currentPath: path }),
  
  // Sidebar expansion
  expandedSites: ["site-x"],
  expandedPlants: [],
  expandedEquipment: [],
  toggleSiteExpanded: (siteId) =>
    set((state) => ({
      expandedSites: state.expandedSites.includes(siteId)
        ? state.expandedSites.filter((id) => id !== siteId)
        : [...state.expandedSites, siteId],
    })),
  togglePlantExpanded: (plantId) =>
    set((state) => ({
      expandedPlants: state.expandedPlants.includes(plantId)
        ? state.expandedPlants.filter((id) => id !== plantId)
        : [...state.expandedPlants, plantId],
    })),
  toggleEquipmentExpanded: (equipmentId) =>
    set((state) => ({
      expandedEquipment: state.expandedEquipment.includes(equipmentId)
        ? state.expandedEquipment.filter((id) => id !== equipmentId)
        : [...state.expandedEquipment, equipmentId],
    })),
  
  // Current view
  currentView: "site",
  setCurrentView: (view) => set({ currentView: view }),
  
  // Dashboard edit mode
  viewMode: "view",
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // What-If Scenario Modal
  whatIfModalOpen: false,
  whatIfResultOpen: false,
  setWhatIfModalOpen: (open) => set({ whatIfModalOpen: open }),
  setWhatIfResultOpen: (open) => set({ whatIfResultOpen: open }),
}))
