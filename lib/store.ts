"use client"

import { create } from "zustand"

/* ─── What-If Run Session ─────────────────────────────────────────────────── */
export type WhatIfRunStatus = "queued" | "running" | "success" | "failed"

export interface WhatIfRunSession {
  id: string
  scenarioId: string          // e.g. "scenario-coke-drum"
  equipmentId: string         // e.g. "equipment-a"
  equipmentName: string
  runName: string
  startedAt: string           // ISO string
  duration: string            // e.g. "4m 12s"
  status: WhatIfRunStatus
  user: string
  selectedDashboards: string[]
  results: Array<{ checked: boolean; col1: string; col2: string; col3: string }>
  progressStep: number        // 0-5
  params: Record<string, string>
  source: "tool" | "dashboard" // where it was triggered from
}
/* ─────────────────────────────────────────────────────────────────────────── */

export type NavigationPath = {
  site?: string
  plant?: string
  equipment?: string
  tab?: string
}

export type ViewMode = "view" | "edit" | "modules"

export type ActiveModule = 'home' | 'portfolio' | 'workspace' | 'insights' | 'comms' | 'settings'

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
  currentView: "home" | "site" | "plant" | "equipment" | "data-sync" | "whatif-tool"
  setCurrentView: (view: "home" | "site" | "plant" | "equipment" | "data-sync" | "whatif-tool") => void

  // ── WHAT-IF TOOL STATE ────────────────────────────────────────────────────
  whatifRunSessions: WhatIfRunSession[]
  addWhatifRunSession: (session: WhatIfRunSession) => void
  updateWhatifRunSession: (id: string, updates: Partial<WhatIfRunSession>) => void
  whatifSelectedScenarioId: string | null
  setWhatifSelectedScenarioId: (id: string | null) => void
  whatifActiveRunId: string | null
  setWhatifActiveRunId: (id: string | null) => void
  // ─────────────────────────────────────────────────────────────────────────

  // ── HOME PAGE STATE ───────────────────────────────────────────────────────
  /** Recently visited dashboard card IDs — newest first, max 6 (LRU). */
  recentDashboardIds: string[]
  addRecentDashboard: (cardId: string) => void
  /** Favourited dashboard card IDs. */
  favouriteDashboardIds: string[]
  toggleFavouriteDashboard: (cardId: string) => void
  // ─────────────────────────────────────────────────────────────────────────
  
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
  activeModule: 'home',
  setActiveModule: (module) => set({ activeModule: module, isPanelOpen: module !== 'home' }),
  isPanelOpen: false,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  navPanelSearch: {
    home: "",
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
  currentView: "home",
  setCurrentView: (view) => set({ currentView: view }),

  // ── WHAT-IF TOOL STATE ────────────────────────────────────────────────────
  whatifRunSessions: [],
  addWhatifRunSession: (session) =>
    set((state) => ({ whatifRunSessions: [session, ...state.whatifRunSessions] })),
  updateWhatifRunSession: (id, updates) =>
    set((state) => ({
      whatifRunSessions: state.whatifRunSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  whatifSelectedScenarioId: "scenario-coke-drum",
  setWhatifSelectedScenarioId: (id) => set({ whatifSelectedScenarioId: id }),
  whatifActiveRunId: null,
  setWhatifActiveRunId: (id) => set({ whatifActiveRunId: id }),
  // ─────────────────────────────────────────────────────────────────────────

  // ── HOME PAGE STATE ───────────────────────────────────────────────────────
  recentDashboardIds: [],
  addRecentDashboard: (cardId) =>
    set((state) => {
      const filtered = state.recentDashboardIds.filter((id) => id !== cardId)
      return { recentDashboardIds: [cardId, ...filtered].slice(0, 6) }
    }),
  favouriteDashboardIds: [],
  toggleFavouriteDashboard: (cardId) =>
    set((state) => ({
      favouriteDashboardIds: state.favouriteDashboardIds.includes(cardId)
        ? state.favouriteDashboardIds.filter((id) => id !== cardId)
        : [...state.favouriteDashboardIds, cardId],
    })),
  // ─────────────────────────────────────────────────────────────────────────
  
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
