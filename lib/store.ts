"use client"

import { create } from "zustand"
import type { UserDocument } from "@/lib/data"
import { mockWhatIfRunSessions } from "@/lib/data"

/* ─── What-If Run Session ─────────────────────────────────────────────────── */
export type WhatIfRunStatus = "queued" | "running" | "success" | "failed"

/** How the user supplied parameters for this run (mock / UX only). */
export type WhatIfParameterInputMode = "full-csv" | "per-parameter-csv" | "typed" | "mixed"

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
  /** Mock: describes CSV / typing / mixed inputs used for this run. */
  parameterInputMode?: WhatIfParameterInputMode
}
/* ─────────────────────────────────────────────────────────────────────────── */

export type NavigationPath = {
  site?: string
  plant?: string
  equipment?: string
  tab?: string
}

export type ViewMode = "view" | "edit" | "modules"

export type ActiveModule = "home" | "assets" | "workspace" | "insights" | "comms" | "settings"

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
  currentView: "home" | "site" | "plant" | "equipment" | "equipment-home" | "workspace" | "data-sync" | "whatIfTool" | "documents-tool"
  setCurrentView: (view: "home" | "site" | "plant" | "equipment" | "equipment-home" | "workspace" | "data-sync" | "whatIfTool" | "documents-tool") => void

  // ── EQUIPMENT HOME PAGE STATE ─────────────────────────────────────────────
  /** Equipment ID to pre-apply as filter when navigating into a tool from Equipment Home Page. Consumed on mount by the target tool view. */
  preFilterEquipmentId: string | null
  setPreFilterEquipmentId: (id: string | null) => void
  // ─────────────────────────────────────────────────────────────────────────

  // ── DOCUMENTS TOOL STATE ─────────────────────────────────────────────────
  /** All user-managed documents (seeded from data.ts + any generated reports) */
  savedDocuments: UserDocument[]
  addDocument: (doc: UserDocument) => void
  // ─────────────────────────────────────────────────────────────────────────

  // ── WHAT-IF TOOL STATE ────────────────────────────────────────────────────
  whatIfRunSessions: WhatIfRunSession[]
  addWhatIfRunSession: (session: WhatIfRunSession) => void
  updateWhatIfRunSession: (id: string, updates: Partial<WhatIfRunSession>) => void
  whatIfSelectedScenarioId: string | null
  setWhatIfSelectedScenarioId: (id: string | null) => void
  whatIfActiveRunId: string | null
  setWhatIfActiveRunId: (id: string | null) => void
  /** Tab to open when navigating into What-If tool externally (e.g. from equipment dashboard) */
  whatIfInitialTab: "overview" | "run" | "history" | null
  setWhatIfInitialTab: (tab: "overview" | "run" | "history" | null) => void
  /** When set, equipment dashboard shows full-screen explore workspace for this successful run id. */
  whatIfExploreRunId: string | null
  setWhatIfExploreRunId: (id: string | null) => void
  /** One-shot: when navigating from What-If results to dashboard, auto-select this run in Viewed Data. */
  whatIfDashboardAutoSelectRunId: string | null
  setWhatIfDashboardAutoSelectRunId: (id: string | null) => void
  /** One-shot: dashboard tab to auto-open as popup on Equipment Home after navigation from What-If. */
  equipmentHomeAutoOpenTab: string | null
  setEquipmentHomeAutoOpenTab: (tab: string | null) => void
  removeWhatIfRunSession: (id: string) => void
  // ─────────────────────────────────────────────────────────────────────────

  // ── HOME PAGE STATE ───────────────────────────────────────────────────────
  /** Recently visited dashboard card IDs — newest first, max 6 (LRU). */
  recentDashboardIds: string[]
  addRecentDashboard: (cardId: string) => void
  /** Favorited dashboard card IDs. */
  favoriteDashboardIds: string[]
  toggleFavoriteDashboard: (cardId: string) => void
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
    assets: "",
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
  setCurrentView: (view) =>
    set((state) => {
      let activeModule: ActiveModule = state.activeModule
      let isPanelOpen = state.isPanelOpen
      if (view === "home") {
        activeModule = "home"
        isPanelOpen = false
      } else if (view === "site" || view === "plant" || view === "equipment" || view === "equipment-home") {
        activeModule = "assets"
        isPanelOpen = true
      } else if (view === "workspace") {
        activeModule = "workspace"
        isPanelOpen = true
      } else if (view === "data-sync" || view === "whatIfTool" || view === "documents-tool") {
        activeModule = "insights"
        isPanelOpen = true
      }
      return { currentView: view, activeModule, isPanelOpen }
    }),

  // ── DOCUMENTS TOOL STATE ─────────────────────────────────────────────────
  savedDocuments: [],
  addDocument: (doc) => set((state) => ({ savedDocuments: [doc, ...state.savedDocuments] })),
  // ─────────────────────────────────────────────────────────────────────────

  // ── WHAT-IF TOOL STATE ────────────────────────────────────────────────────
  whatIfRunSessions: [...mockWhatIfRunSessions] as unknown as WhatIfRunSession[],
  addWhatIfRunSession: (session) =>
    set((state) => ({ whatIfRunSessions: [session, ...state.whatIfRunSessions] })),
  updateWhatIfRunSession: (id, updates) =>
    set((state) => ({
      whatIfRunSessions: state.whatIfRunSessions.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    })),
  whatIfSelectedScenarioId: "scenario-coke-drum",
  setWhatIfSelectedScenarioId: (id) => set({ whatIfSelectedScenarioId: id }),
  whatIfActiveRunId: null,
  setWhatIfActiveRunId: (id) => set({ whatIfActiveRunId: id }),
  whatIfInitialTab: null,
  setWhatIfInitialTab: (tab) => set({ whatIfInitialTab: tab }),
  whatIfExploreRunId: null,
  setWhatIfExploreRunId: (id) => set({ whatIfExploreRunId: id }),
  whatIfDashboardAutoSelectRunId: null,
  setWhatIfDashboardAutoSelectRunId: (id) => set({ whatIfDashboardAutoSelectRunId: id }),
  equipmentHomeAutoOpenTab: null,
  setEquipmentHomeAutoOpenTab: (tab) => set({ equipmentHomeAutoOpenTab: tab }),
  removeWhatIfRunSession: (id) =>
    set((state) => ({
      whatIfRunSessions: state.whatIfRunSessions.filter((s) => s.id !== id),
      whatIfExploreRunId: state.whatIfExploreRunId === id ? null : state.whatIfExploreRunId,
      whatIfActiveRunId: state.whatIfActiveRunId === id ? null : state.whatIfActiveRunId,
      whatIfDashboardAutoSelectRunId:
        state.whatIfDashboardAutoSelectRunId === id ? null : state.whatIfDashboardAutoSelectRunId,
      equipmentHomeAutoOpenTab: state.equipmentHomeAutoOpenTab,
    })),
  // ─────────────────────────────────────────────────────────────────────────

  // ── EQUIPMENT HOME PAGE STATE ─────────────────────────────────────────────
  preFilterEquipmentId: null,
  setPreFilterEquipmentId: (id) => set({ preFilterEquipmentId: id }),
  // ─────────────────────────────────────────────────────────────────────────

  // ── HOME PAGE STATE ───────────────────────────────────────────────────────
  recentDashboardIds: [],
  addRecentDashboard: (cardId) =>
    set((state) => {
      const filtered = state.recentDashboardIds.filter((id) => id !== cardId)
      return { recentDashboardIds: [cardId, ...filtered].slice(0, 6) }
    }),
  favoriteDashboardIds: [],
  toggleFavoriteDashboard: (cardId) =>
    set((state) => ({
      favoriteDashboardIds: state.favoriteDashboardIds.includes(cardId)
        ? state.favoriteDashboardIds.filter((id) => id !== cardId)
        : [...state.favoriteDashboardIds, cardId],
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
