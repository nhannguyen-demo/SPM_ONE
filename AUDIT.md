# SPM ONE — Frontend Codebase Audit

> Generated: April 22, 2026  
> Scope: full read of all source files in the repo root

---

## 1. TECH STACK ACTUALLY USED

### Core Framework
| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.0 |
| Language | TypeScript | 5.7.3 |
| Runtime | React | 19 |
| Package manager | pnpm | — |

### Styling
| Layer | Choice | Notes |
|---|---|---|
| CSS engine | Tailwind CSS v4 | Uses `@theme` tokens in `app/globals.css` |
| Component system | shadcn/ui (Radix UI) | All primitives individually installed |
| Animation | tw-animate-css | Dev dependency |
| Theme | next-themes | Dark/light mode wrapper |

### State & Data
| Layer | Choice | Version |
|---|---|---|
| Global state | Zustand | 5.0.12 |
| Local state | React `useState` / `useRef` | throughout |
| Backend | **None** | All data is static mock in `lib/data.ts` |
| DB | **None** | — |
| Forms | react-hook-form + Zod | Installed, not yet wired in main views |

### UI Libraries
| Library | What it does | Version |
|---|---|---|
| Recharts | All chart widgets | 2.15.0 |
| react-grid-layout | Drag-resize widget grid in Equipment Dashboard | 2.2.3 |
| react-resizable | Widget resizing CSS/helpers | 3.0.5 |
| lucide-react | All icons | 0.564.0 |
| embla-carousel-react | Carousel primitives (shadcn) | 8.6.0 — **installed, not used in any view** |
| sonner | Toast notifications | 1.7.1 — **installed, not used** |
| vaul | Drawer primitive (shadcn) | 1.1.2 |
| cmdk | Command palette (shadcn) | 1.1.1 — **installed, not used** |
| date-fns | Date utilities | 4.1.0 — **installed, not used** |
| react-day-picker | Calendar (shadcn) | 9.13.2 — **installed, not used** |
| input-otp | OTP input (shadcn) | 1.4.2 — **installed, not used** |
| @dnd-kit/core, /sortable, /utilities | Drag-and-drop primitives | — **installed, not used** (react-grid-layout handles DnD instead) |

### Analytics / Deployment
- `@vercel/analytics` is installed and implicitly used via Vercel hosting.

---

## 2. PAGES AND ROUTES

There is **one Next.js route** — `app/page.tsx`. All navigation is client-side via Zustand's `currentView` string field. No URL changes happen when the user navigates.

| `currentView` value | Component rendered | What it shows |
|---|---|---|
| `"home"` | `HomeView` | Default landing: greeting, global search, AI summary, recent/favourite dashboards, change log, documents |
| `"site"` | `SiteOverview` | Aerial map of the selected site with plant markers, KPI stats, mini charts, document list, and a tab strip of all equipment dashboards at that site |
| `"plant"` | `PlantOverview` | Plant-level view with equipment cards, P&ID diagram, mini KPI bars, AI health summary |
| `"equipment"` | `EquipmentDashboard` | Multi-tab, drag-resize widget dashboard for the selected equipment; includes Edit mode with widget library |
| `"data-sync"` | `DataSyncView` | Read-only tables for data upload status and FEA/sync job history |
| `"whatif-tool"` | `WhatifToolView` | Centralised WIS tool: scenario list sidebar → Configure & Run → animated 5-step progress → Results → Compare |
| `"documents-tool"` | `DocumentsView` | Full document library: grid/list layout, category/asset/filetype filters, share, download |

**Navigation that exists in the sidebar but has no view yet:**
- Shift Log (Insights panel)
- Chat (Comms panel)
- Alerts (Comms panel)
- Favourite (Workspace panel)
- Share with me (Workspace panel)
- General / Integrations / Notifications (Settings panel)

---

## 3. COMPONENT INVENTORY

### Shell / Layout

| Component | File | What it does |
|---|---|---|
| `Sidebar` | `components/sidebar.tsx` | Two-layer nav: fixed 56px `ModuleRail` + sliding 220px `ContextualPanel`. Contains 8 sub-components below. |
| `ModuleRail` | sidebar.tsx (internal) | 6 icon buttons: Home, Assets, Dashboard, Tools, Comms, Settings. Clicking same active icon closes the panel. |
| `ContextualPanel` | sidebar.tsx (internal) | Slide-in panel with per-module search bar. Routes to the correct sub-panel below. |
| `PortfolioPanel` | sidebar.tsx (internal) | Hierarchical asset tree (Sites → Plants → Equipment). Full search/filter with auto-expand. |
| `WorkspacePanel` | sidebar.tsx (internal) | Stub: "Favourite" and "Share with me" items (unlinked). |
| `InsightsPanel` | sidebar.tsx (internal) | Links to Data & Sync, Shift Log (stub), Documents, What-If Scenarios. |
| `CommsPanel` | sidebar.tsx (internal) | Stub: Chat and Alerts items. |
| `SettingsPanel` | sidebar.tsx (internal) | Stub: General, Integrations, Notifications. |
| `Header` | `components/header.tsx` | Top 56px bar. Bell (with unread dot) and Settings buttons — **both are visual only, no handlers**. |

### Views

| Component | File | Key props / data consumed |
|---|---|---|
| `HomeView` | `views/home-view.tsx` | `recentDashboardIds`, `favouriteDashboardIds` from store; `changeLogEntries`, `userDocuments` from data.ts |
| `SiteOverview` | `views/site-overview.tsx` | `currentPath.site` → renders from `sites[]`; `dashboardCards`, `siteDocuments` |
| `PlantOverview` | `views/plant-overview.tsx` | `currentPath.{site,plant}` → renders from `sites[]`; `dashboardCards`, `plantDocuments` |
| `EquipmentDashboard` | `views/equipment-dashboard.tsx` | `currentPath.{site,plant,equipment,tab}`; `equipmentKPIs`, `dashboardCards`, `whatifRunSessions` from store |
| `WhatifToolView` | `views/whatif-tool-view.tsx` | `whatifRunSessions`, `whatifSelectedScenarioId`, `whatifInitialTab`, `whatifActiveRunId` from store; `whatIfScenarios` from data.ts |
| `DocumentsView` | `views/documents-view.tsx` | `savedDocuments` from store (seeded from `userDocuments` on first mount) |
| `DataSyncView` | `views/data-sync.tsx` | `dataStatusItems`, `syncJobs` from data.ts. **Fully static, no interactivity.** |

### Home View Sub-Modules (all defined inline in `home-view.tsx`)

| Sub-component | What it does |
|---|---|
| `GlobalSearchBar` | Real-time autocomplete over a static search index built from `sites[]`. Keyboard navigable (↑↓ Enter Escape). Navigates on select. |
| `AISummaryModule` | Two-column layout: "Critical Notices" and "Suggested Actions". Both hardcoded. Marked "AI Preview". |
| `RecentDashboardsModule` | LRU list of up to 6 dashboard cards from Zustand state. Empty state shown until navigation. |
| `FavouriteDashboardsModule` | Bookmarked dashboards from Zustand. Show-more toggle at 6 items. |
| `ChangeLogModule` | Tab-filtered table (All / Dashboard / Operations). Data from `changeLogEntries`. |
| `DocumentsModule` | Category + asset filter + search over `userDocuments` static array. Grid layout with `DocumentCard`. |

### Equipment Dashboard Sub-Components (all in `equipment-dashboard.tsx`)

| Sub-component | What it does |
|---|---|
| `EquipmentDashboard` | Main container: tab strip, RGL grid, right sidebar slot selector, create/delete dashboard dialogs |
| `WidgetViewResolver` | Giant switch on `viewType` string; renders 20+ chart/KPI variants using Recharts |
| `WidgetErrorBoundary` | Class component error boundary; catches per-widget render failures without crashing the whole dashboard |
| `KPIPill` | Simple label + large value display for KPI widgets |

### Shared / Reusable

| Component | File | Props |
|---|---|---|
| `DashboardCard` | `components/dashboard-card.tsx` | `card`, `thumbnailSrc?`, `cardIndex?`, `showEquipmentName?`. Shows thumbnail image or fallback mini-charts. Includes Feature 4 AI strip. |
| `ModuleLibrary` | `components/module-library.tsx` | `onClose?`, `onAddModule?`, `onWidgetDragStart?`, `onWidgetDragEnd?`. Slide-in widget palette with category tabs and search. HTML5 drag source. |
| `Equipment3DViewer` | `components/equipment-3d.tsx` | `equipmentId?`. Renders inline SVG for Coke Drum, HCU, or Pump. Pure placeholder. |
| `MiniLineChart`, `MiniPieChart`, `MiniBarChart` | `components/mini-charts.tsx` | Used in DashboardCard fallback and overview views |
| `DashboardTabStack` | `components/ui/dashboard-tab-stack.tsx` | Custom shadcn-style component for the stacked tab strip in site/plant overviews |

### Modals

| Component | File | Notes |
|---|---|---|
| `WhatIfScenarioModal` | `components/modals/what-if-scenario.tsx` | **Legacy** config + run modal. Still mounted in `page.tsx` but the primary WIS flow is now `WhatifToolView`. Creates a run session and shows `WhatIfResultModal`. |
| `WhatIfResultModal` | same file | **Legacy** results display. Still functional as a quick-access result viewer. |

### AI Feature Components (`components/ai/`)

| Feature | File | Status | What it does |
|---|---|---|---|
| Feature 1 | `feature1-spark-button.tsx` | **Wired** | Floating AI button on site/plant/equipment views. Expands to chat input + insight toggle. Delegates to Feature 7 in edit mode. |
| Feature 2 | `feature2-search-autocomplete.tsx` | **Not wired** | Scaffolded AI search enhancement |
| Feature 3 | `feature3-health-summary.tsx` | **Wired** | AI Health Summary Card rendered in SiteOverview and PlantOverview |
| Feature 4 | `feature4-insight-strips.tsx` | **Wired** | AI insight strips on DashboardCard thumbnails |
| Feature 5 | `feature5-pid-anomaly.tsx` | **Wired** | P&ID anomaly overlay in PlantOverview |
| Feature 6 | `feature6-ai-insight-overlay.tsx` | **Wired** | `AIKPIBadgeWrapper`, `AILineChartMarkers`, `AIBarChartThreshold`, `AIMapBadges` — toggled by Feature 1 insight button |
| Feature 7 | `feature7-edit-suggestion.tsx` | **Wired** | Editing suggestion button shown in place of Feature 1 when in Edit mode |
| Feature 8 | `feature8-whatif-summary.tsx` | **Wired** | AI Summary Card inside WIS results (modal and tool view) |
| Feature 9 | `feature9-optimization-rec.tsx` | **Not wired** | Scaffolded AI optimization card |
| Feature 10 | `feature10-generate-report.tsx` | **Not wired** | AI report share dropdown (imported in modal, but stub) |

---

## 4. IMPLIED DOMAIN MODEL

### Entities

#### Site
```
id: string            // "site-x", "site-y"
name: string          // "Site X"
plants: Plant[]
```

#### Plant
```
id: string            // "plant-1", "plant-2"
name: string          // "Plant 1"
equipment: Equipment[]
```

#### Equipment
```
id: string            // "equipment-a", "equipment-b", "equipment-c"
name: string          // "Coke Drum", "HCU", "Pump ND.1X02"
tabs: string[]        // Dashboard tab names for this equipment
```

#### DashboardCard
```
id: string            // "dash-1", "dash-hcu-1"
equipment: string     // Equipment name (denormalised)
equipId: string       // FK → Equipment.id
tag: string           // Tab name (e.g. "Fatigue", "Monitoring")
metrics: { value1: string; value2: string } | null
```
Note: `metrics` is unnamed — the UI doesn't label what value1/value2 mean.

#### EquipmentKPIs
```
dmg: string           // e.g. "201%" — damage percentage
reLife: string        // e.g. "40 yrs" — remaining life
date: string          // install/reference date
id: string            // equipment tag ID
```
**Critical flaw:** this is a single global constant object. All equipment shows the same KPI values.

#### WhatIfScenarioDefinition
```
id: string
equipmentId: string
equipmentName: string
name: string
description: string
details: string
availableDashboards: string[]
defaultParams: Record<string, { value: string; unit: string }>
plant: string
site: string
```

#### WhatIfRunSession (Zustand)
```
id: string
scenarioId: string
equipmentId: string
equipmentName: string
runName: string
startedAt: string           // ISO datetime
duration: string            // e.g. "4m 12s"
status: "queued" | "running" | "success" | "failed"
user: string
selectedDashboards: string[]
results: Array<{ checked: boolean; col1: string; col2: string; col3: string }>
progressStep: number        // 0-5
params: Record<string, string>
source: "tool" | "dashboard"
parameterInputMode?: "full-csv" | "per-parameter-csv" | "typed" | "mixed"
```

#### UserDocument
```
id: string
name: string
fileType: "pdf" | "docx" | "xlsx" | "link"
category: "Uploaded" | "Shared"
siteId?: string
plantId?: string
equipmentId?: string
size: string              // e.g. "4.2 MB"
date: string              // e.g. "2026-04-10"
sharedBy?: string
```

#### ChangeLogEntry
```
id: string
timestamp: string         // e.g. "2026-04-19 19:42"
user: string
action: string
location: string          // e.g. "Site X › Plant 1 › Coke Drum › Fatigue"
type: "dashboard" | "operation"
```

#### SyncJob
```
asset: string
description: string
state: "Success" | "Failed"
startTime: string
elapsed: string
user: string
tokens: number
```

#### DataStatusItem
```
asset: string
files: number
loadStatus: string        // e.g. "10/10"
lastUpdate: string
error: string             // e.g. "0/10"
```

### Relationships
```
Site  ──< Plant ──< Equipment ──< DashboardCard (by equipId + tag)
                                └─ WhatIfScenarioDefinition (1:1 currently)
Equipment ──< WhatIfRunSession (by equipmentId)
UserDocument >── Site (optional)
UserDocument >── Plant (optional)
UserDocument >── Equipment (optional)
WhatIfRunSession >── WhatIfScenarioDefinition (by scenarioId)
```

### Actions / Mutations the UI Allows
- Navigate to Site / Plant / Equipment / Dashboard tab
- Toggle equipment dashboard favourite (bookmark)
- Toggle sidebar panel open/closed
- Enter / exit dashboard Edit mode
- Reposition and resize widgets (react-grid-layout)
- Add widget from library (click or drag-drop)
- Remove widget
- Create new dashboard tab (from template or blank)
- Delete dashboard tab
- Run a What-If Scenario (configure params → animated 5-step run → view results)
- Delete a WIS run session
- Compare WIS runs side by side
- Navigate from WIS results to Equipment Dashboard with run pre-selected
- Generate a visual report from Equipment Dashboard → saves to Documents
- Upload/share a document (stub — no file input, no real upload)
- Filter and search documents
- Toggle AI insight overlay on/off
- Toggle favourite dashboard
- Search assets globally from Home

---

## 5. HARDCODED DATA

Everything in `lib/data.ts` is mock data. Specifically:

| Data | Location | What it mocks |
|---|---|---|
| Asset hierarchy | `sites[]` | 2 sites, 2 plants, 3 equipment items with tabs |
| Dashboard card metrics | `dashboardCards[]` | `value1` and `value2` per tab — unlabelled percentages |
| Equipment KPIs | `equipmentKPIs` | **Single global object** — DMG 201%, Re-Life 40yrs, date 10/02/2026, ID 260020. Same for all equipment |
| Equipment thumbnails | `equipmentDashboardThumbnails` | Three hardcoded image paths |
| Widget chart data | In `equipment-dashboard.tsx` | `mockLineData`, `mockProcessData`, `mockScatterData`, `pieData` — all static arrays |
| WIS scenario definitions | `whatIfScenarios[]` | 2 scenarios (Coke Drum, HCU) with hand-written params |
| WIS run history | `mockWhatifRunSessions[]` | 4 pre-seeded runs (wir-001 to wir-004) |
| WIS result rows | `whatIfResults[]` | 8 generic parameter rows (col1/col2/col3 unlabelled) |
| User documents | `userDocuments[]` | 8 documents with hardcoded sizes and dates |
| Change log | `changeLogEntries[]` | 8 entries with hardcoded users (Nhan N., Ben T., Alex P., Simon K.) |
| Sync jobs | `syncJobs[]` | 4 jobs |
| Data status | `dataStatusItems[]` | 4 assets with hardcoded load status |
| Site documents | `siteDocuments[]` | 5 docs (informal names like "how to fly") |
| Plant documents | `plantDocuments[]` | 5 docs (same informal style) |
| Module library | `moduleLibrary[]` | 7 widget types with categories |
| WIS explore templates | `whatIfExploreDashboardTemplates[]` | 3 layout templates |
| AI notices | `AI_NOTICES` in `home-view.tsx` | 3 hardcoded critical notices |
| AI actions | `AI_ACTIONS` in `home-view.tsx` | 3 hardcoded suggested actions |
| Data grid widget data | `WidgetViewResolver` inline | 4 hardcoded sensor rows (T_in, P_shell, ΔP, Flow) |
| Process stream widget | `WidgetViewResolver` inline | 6 hardcoded process points with formula-generated values |
| Summary widget KPIs | `WidgetViewResolver` inline | OEE 86%, Uptime 99.9%, Quality 98.5% |
| Fatigue remaining cycles | `WidgetViewResolver` inline | Hardcoded `12,405` |
| Flaw sizes | `WidgetViewResolver` inline | `Math.random()` — changes on every render |
| Logged-in user name | `home-view.tsx` | `"Welcome back, Nhan 👋"` — hardcoded string |
| User avatar initial | `sidebar.tsx` | `"U"` — hardcoded letter |

---

## 6. TECHNICAL DEBT

### 6a. Naming Inconsistencies

| Issue | Where |
|---|---|
| Module rail key `"portfolio"` but its label is `"Assets"` | `sidebar.tsx` |
| Module rail key `"workspace"` but its label is `"Dashboard"` | `sidebar.tsx` |
| Module rail key `"insights"` but its label is `"Tools"` | `sidebar.tsx` |
| British `"favourite"` / `"favouriteDashboardIds"` — fine to keep, just be consistent; the UI also says "Favorite" (American) in the Workspace panel | `store.ts`, `home-view.tsx`, `sidebar.tsx` |
| WIS is called: `what-if` (kebab in `currentView`), `whatif` (camelCase in store keys), `WhatIf` (PascalCase in modal names), `WIS` (acronym in comments). No single canonical spelling | throughout |
| `WhatIfRunSession.results` columns named `col1`, `col2`, `col3` — purely positional, no domain meaning | `store.ts`, `data.ts` |
| `DashboardCard.metrics.value1` / `value2` — also positional and undocumented | `lib/data.ts` |

### 6b. Duplicate Components

| Duplicate | Files | Impact |
|---|---|---|
| Document display/filter (full version) | `components/views/documents-view.tsx` AND `DocumentsModule` in `components/views/home-view.tsx` | Two separate implementations; filters and layout logic will drift |
| Dashboard tab strip (exact copy) | Appears **twice** inside `EquipmentDashboard` — once in normal view (line ~724) and once in the expanded slide-up panel (line ~780) | Any tab strip change requires editing both |
| `handleCardClick` (navigate to equipment from dashboard card) | Duplicated identically in `RecentDashboardsModule` and `FavouriteDashboardsModule` inside `home-view.tsx` | Should be extracted to a shared function or hook |
| `hooks/use-mobile.ts` and `hooks/use-toast.ts` | Duplicate of `components/ui/use-mobile.tsx` and `components/ui/use-toast.ts` | Two copies of the same code |

### 6c. Overly Large Components

| File | Lines | Problem |
|---|---|---|
| `equipment-dashboard.tsx` | 1,533 | Contains: main component, `WidgetViewResolver` (20+ chart types as inline JSX), all chart mock data, `DEFAULT_WIDGET_SETS`, `DEFAULT_GRIDS`, `buildDefaultGrid`, `KPIPill`, `WidgetErrorBoundary`. The `WidgetViewResolver` alone is ~300 lines. |
| `whatif-tool-view.tsx` | 1,035 | Contains: main view, `RunProgressOverlay`, `StatusBadge`, `ScenarioSidebar`, `ConfigureRunTab`, `HistoryTab`, `ResultsPanel`, `ComparePanel`, `useSeedMockHistory` — all inline. |
| `home-view.tsx` | 848 | Contains 6 feature modules plus 5 helper sub-components, all inline. No files are split. |
| `sidebar.tsx` | 653 | Contains `ModuleRail`, `ContextualPanel`, `HomePanel`, `PortfolioPanel`, `WorkspacePanel`, `InsightsPanel`, `CommsPanel`, `SettingsPanel`, `PanelNavItem`, `PanelSearchInput` — 10 components in one file. |

### 6d. Structural Problems

| Problem | Location | Severity |
|---|---|---|
| `equipmentKPIs` is a single global constant — all equipment shows DMG 201%, Re-Life 40yrs, etc. No per-equipment KPI data exists. | `lib/data.ts`, `equipment-dashboard.tsx` | High |
| `WhatIfScenarioModal` + `WhatIfResultModal` are still mounted in `page.tsx` despite the WIS tool view (`WhatifToolView`) being the canonical flow. The old modal flow still works and creates real sessions. | `app/page.tsx`, `components/modals/what-if-scenario.tsx` | Medium |
| `sidebarCollapsed: boolean` is kept in the store "for backward compat" but no code sets or reads it functionally. Dead state. | `lib/store.ts` | Low |
| `styles/globals.css` exists alongside `app/globals.css`. Next.js App Router only processes `app/globals.css`. The `styles/` file is silently ignored. | repo root | Low |
| `components/ui/sidebar.tsx` (shadcn Sidebar primitive) clashes in name with `components/sidebar.tsx` (the app's actual Sidebar). Risky when auto-importing. | both files | Medium |
| `handleEquipmentClick` in `plant-overview.tsx` hardcodes `tab: "#process"` which is not a valid tab name for HCU or Pump equipment. | `views/plant-overview.tsx` line 46 | Medium |
| `handleDashboardClick` in `site-overview.tsx` and `plant-overview.tsx` accepts `card: any` and contains fragile fallback ID derivation: `card.equipment.toLowerCase().replace(": ", "-").replace(" ", "-")` | both overview views | Medium |
| `crack-flaws` widget uses `Math.random()` inline — flaw sizes change on every render, causing hydration warnings and jitter. | `equipment-dashboard.tsx` `WidgetViewResolver` | Low |
| `@dnd-kit` trio of packages is installed but never imported — `react-grid-layout` handles all DnD. | `package.json` | Low |
| Several shadcn component packages (`embla-carousel-react`, `date-fns`, `react-day-picker`, `input-otp`, `cmdk`) are installed but no view file imports them. | `package.json` | Low |
| All navigation is URL-less (`currentView` string in Zustand). There is no back button, no shareable link to any view, and hard-refresh always resets to Home. | `lib/store.ts`, `app/page.tsx` | High (when real users arrive) |
| `recentDashboardIds` and `favouriteDashboardIds` live only in Zustand (no localStorage/cookie). Hard-refresh clears them. | `lib/store.ts` | High (when real users arrive) |

---

## 7. WHAT IS WORKING WELL

### Architecture Patterns to Keep

| Pattern | Where | Why it works |
|---|---|---|
| Zustand store with domain-segmented sections | `lib/store.ts` | Clear separation: Navigation, Documents, WIS, Home, AI. Well-commented with `──` dividers. Easy to find and extend any domain slice. |
| TypeScript interfaces for all data shapes | `lib/data.ts`, `lib/store.ts` | `WhatIfScenarioDefinition`, `UserDocument`, `ChangeLogEntry`, `WhatIfRunSession` etc. are all typed and exported. |
| `cn()` utility used everywhere | `lib/utils.ts` | Consistent className merging; no string concatenation or ternary messes. |
| `"use client"` properly scoped | all interactive files | No accidental RSC/client boundary violations. |
| Component file grouping | `views/`, `modals/`, `ai/`, `ui/` | Clear intent: where to add things, where to find things. |
| AI feature isolation | `components/ai/feature{N}-*.tsx` | Each feature is self-contained with file-level comments on how to remove it. Feature 1 comment explicitly says "To remove: delete this file and remove the import." |
| `WidgetErrorBoundary` class component | `equipment-dashboard.tsx` | Prevents a single widget crash from taking down the entire dashboard. This is the correct pattern. |
| Seed hook pattern (`useSeedDocuments`, `useSeedMockHistory`) | `documents-view.tsx`, `whatif-tool-view.tsx` | Cleanly initialises Zustand from static data on first mount using a `ref` guard — no double-seeding. |
| Two-layer sidebar (Rail + Panel) | `sidebar.tsx` | The 56px always-visible icon rail + sliding 220px panel is a proven pattern for complex tools. It scales to many modules without crowding. |
| Design token usage | `app/globals.css` + all Tailwind classes | All colours reference `hsl(var(--card))`, `hsl(var(--foreground))` etc., not hardcoded hex. Dark/light mode works for free. |
| `DashboardCard` reuse | 5 different locations | Same component used correctly in Home recents, Home favourites, SiteOverview, PlantOverview, and EquipmentDashboard tab strip. Props handle display variants cleanly. |
| `WidgetViewResolver` switch dispatch | `equipment-dashboard.tsx` | Clean single entry point for all widget types. Adding a new widget = one new `case`. No conditional component trees scattered across files. |
| `buildDefaultGrid` + `DEFAULT_WIDGET_SETS` | `equipment-dashboard.tsx` | Declarative widget layout specifications. Each tab's contents and positions are described as plain data, not imperative code. |
| `findAssetPathForEquipment` utility | `whatif-tool-view.tsx` | Encapsulates the hierarchical lookup (site → plant from equipment id) rather than inlining it. |
| `ResponsiveGridLayout` breakpoints | `equipment-dashboard.tsx` | 5-tier responsive grid (lg/md/sm/xs/xxs) with a `ResizeObserver` measuring container width correctly — avoids RGL's known width-calculation bugs. |

---

*End of audit. Total source files reviewed: ~30 (all `.tsx`/`.ts` files excluding `node_modules`, `.next`, shadcn `ui/` primitives, and lock files).*
