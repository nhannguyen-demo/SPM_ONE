"use client"

import { create } from "zustand"

export type NavigationPath = {
  site?: string
  plant?: string
  equipment?: string
  tab?: string
}

export type ViewMode = "view" | "edit" | "modules"

export type ActiveModule = 'portfolio' | 'workspace' | 'insights' | 'comms' | 'settings'

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
  
  // Sidebar collapsed state (kept for backward compat; panel open/close replaces it in new nav)
  sidebarCollapsed: boolean
  toggleSidebarCollapsed: () => void

  // ── TWO-LAYER NAV STATE ───────────────────────────────────────────────────
  // Active module selected in the Module Rail
  activeModule: ActiveModule
  setActiveModule: (module: ActiveModule) => void
  // Whether the contextual panel is open
  isPanelOpen: boolean
  togglePanel: () => void
  /** Search text for the active nav panel (Assets, Dashboard, Tools, …) */
  navPanelSearch: Record<ActiveModule, string>
  setNavPanelSearch: (module: ActiveModule, query: string) => void
  // ─────────────────────────────────────────────────────────────────────────

  // Current view
  currentView: "site" | "plant" | "equipment" | "data-sync"
  setCurrentView: (view: "site" | "plant" | "equipment" | "data-sync") => void
  
  // Dashboard edit mode
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Dashboard expanded (full-screen panel)
  dashboardExpanded: boolean
  setDashboardExpanded: (expanded: boolean) => void
  
  // What-If Scenario Modal
  whatIfModalOpen: boolean
  whatIfResultOpen: boolean
  setWhatIfModalOpen: (open: boolean) => void
  setWhatIfResultOpen: (open: boolean) => void

  // ── AI FEATURE STATE ──────────────────────────────────────────────────────
  // FEATURE 1 — Global Floating AI Spark Button
  aiSparkExpanded: boolean
  setAiSparkExpanded: (expanded: boolean) => void
  // FEATURE 6 — AI Insight Overlay (toggled via FEATURE 1 AI Insight button)
  aiInsightActive: boolean
  setAiInsightActive: (active: boolean) => void
  // ─────────────────────────────────────────────────────────────────────────
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

  // Sidebar collapsed (legacy; kept for backward compat)
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // ── TWO-LAYER NAV STATE ───────────────────────────────────────────────────
  activeModule: 'portfolio',
  setActiveModule: (module) => set({ activeModule: module, isPanelOpen: true }),
  isPanelOpen: true,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  navPanelSearch: {
    portfolio: "",
    workspace: "",
    insights: "",
    comms: "",
    settings: "",
  },
  setNavPanelSearch: (module, query) =>
    set((state) => ({
      navPanelSearch: { ...state.navPanelSearch, [module]: query },
    })),
  // ─────────────────────────────────────────────────────────────────────────
  
  // Current view
  currentView: "site",
  setCurrentView: (view) => set({ currentView: view }),
  
  // Dashboard edit mode
  viewMode: "view",
  setViewMode: (mode) => set({ viewMode: mode }),

  // Dashboard expanded
  dashboardExpanded: false,
  setDashboardExpanded: (expanded) => set({ dashboardExpanded: expanded }),
  
  // What-If Scenario Modal
  whatIfModalOpen: false,
  whatIfResultOpen: false,
  setWhatIfModalOpen: (open) => set({ whatIfModalOpen: open }),
  setWhatIfResultOpen: (open) => set({ whatIfResultOpen: open }),

  // ── AI FEATURE STATE ──────────────────────────────────────────────────────
  // FEATURE 1 — Global Floating AI Spark Button
  aiSparkExpanded: false,
  setAiSparkExpanded: (expanded) => set({ aiSparkExpanded: expanded }),
  // FEATURE 6 — AI Insight Overlay
  aiInsightActive: false,
  setAiInsightActive: (active) => set({ aiInsightActive: active }),
  // ─────────────────────────────────────────────────────────────────────────
}))
