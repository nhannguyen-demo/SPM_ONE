# Project Context

## What is this project?
SPM ONE is an industrial asset performance management (APM) web application prototype. It provides Integrity Engineers with a hierarchical view of their asset portfolio — from site level down to individual equipment — including real-time interactive KPI dashboards built with Recharts, a Drag-and-Drop widget customization system, P&ID diagrams, a What-If scenario modeller, and an AI-assisted insight layer. The app is built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

## Where are we in the project, what have we recently done?
Mid-deployment — **WIS (What-If Scenario) Tool** & **Documents Tool**. 
*   **WIS Tool v2**: Successfully migrated from a simple modal to a full-featured centralized view (`whatif-tool-view.tsx`). It features a scenario list sidebar, animated live run progress (5-step simulation), comprehensive result panels with delta tables, and side-by-side comparison with live data. Navigation is now direct: clicking "Run WIS" in the Equipment Dashboard nav points the user to the tool's Configure & Run tab.
*   **Documents Tool**: Built a dedicated document management view (`documents-view.tsx`) supporting grid/list layouts, asset-level filtering, and sharing. WIS results can now be exported as PDF reports directly into this storage.
*   **Home Page**: Default landing view is fully functional with 6 modules (Search, AI Summary, Recents, Favourites, Change Log, Documents).
*   **Integration**: Wired WIS report generation to auto-save into the Documents library with equipment-aware tagging.

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.7
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix UI primitives), `tw-animate-css`
- **State:** Zustand 5
- **Charts:** Recharts 2.15
- **Interactivity:** `react-grid-layout` (Responsive) for free-form Drag & Drop and Resizing
- **Utility:** `react-resizable` for widget scaling components
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Package manager:** pnpm
- **Backend:** None — all data is static mock data in `lib/data.ts`
- **DB:** None
- **Hosting:** Vercel (deploy via GitHub or directly from v0)

## Folder Structure (key paths only)
```
spm-one/
├── app/
│   ├── globals.css          ← Design tokens and Tailwind v4 theme
│   ├── layout.tsx           ← Root layout (fonts, metadata)
│   └── page.tsx             ← App shell: mounts Sidebar, Header, view router, modals, AI button
├── components/
│   ├── sidebar.tsx          ← Collapsible left nav (Portfolio tree + Workspace/Insights/Comms sections)
│   ├── header.tsx           ← Top bar (search, icons)
│   ├── dashboard-card.tsx   ← Reusable dashboard thumbnail card
│   ├── equipment-3d.tsx     ← 3D Digital Twin viewer placeholder
│   ├── mini-charts.tsx      ← Sparkline/pie/bar chart components
│   ├── module-library.tsx   ← "Widget Library" slide-in panel (for Drag & Drop in Edit mode)
│   ├── theme-provider.tsx   ← next-themes wrapper
│   ├── ai/                  ← AI feature components (feature1 through feature10)
│   ├── modals/
│   │   └── what-if-scenario.tsx   ← What-If config + results modals
│   ├── views/
│   │   ├── home-view.tsx          ← Screen 0 — Home (default landing: search, AI, recents, favourites, changelog, docs)
│   │   ├── site-overview.tsx      ← Screen 1 — Site level
│   │   ├── plant-overview.tsx     ← Screen 2 — Plant level
│   │   ├── equipment-dashboard.tsx← Screens 3–6 — Equipment tabs
│   │   ├── data-sync.tsx          ← Screen 9 — Data & Sync
│   │   ├── whatif-tool-view.tsx   ← Screen 10 — WIS Centralized Management (list, run, history, results, compare)
│   │   └── documents-view.tsx     ← Screen 11 — Documents Centralized Storage (Uploaded/Shared/WIS Reports)
│   └── ui/                        ← shadcn/ui base components
├── lib/
│   ├── store.ts             ← Zustand global state (navigation, view mode, modals, AI flags)
│   ├── data.ts              ← All mock/static data (sites, plants, equipment, KPIs)
│   └── utils.ts             ← cn() helper
└── public/
    └── images/              ← Drop site-map.jpg and pid-diagram.jpg here
        └── thumbnails/      ← Dashboard card thumbnails
```

## How to run locally
```bash
# Prerequisites: Node.js v20+, pnpm
npm install -g pnpm   # if pnpm not installed

# Install dependencies
pnpm install

# Start dev server
pnpm dev
# → open http://localhost:3000
```

## Current Tasks / What's In Progress
- [x] Core navigation shell (sidebar, header, view routing)
- [x] Site Overview view
- [x] Plant Overview view
- [x] Equipment Dashboard view (multi-tab)
- [x] Data & Sync view
- [x] Collapsible sidebar with tooltips
- [x] What-If Scenario modal (config + results)
- [x] What-If Scenario accessible from sidebar nav (under each Equipment node)
- [x] WIS (What-If Scenario) centralized tool view (config, animated run, history, comparison)
- [x] WIS navigation flow: "Run WIS" in dashboard now navigates to Tool → Configure tab
- [x] Documents tool view (Grid/List, Filter, Share, Download, WIS Report integration)
- [x] AI components scaffolded (Feature 1–10)
- [x] Feature 1 — Global Floating AI Spark Button (wired to global state)
- [x] Feature 8 — WIS Result: AI Summary Card (inline in results and modal)
- [x] Feature 6 — AI Insight Overlay (wired to global state)
- [x] Two-layer navigation system (Module Rail + Contextual Panel)
- [x] Interactive Recharts widgets for all Equipment dashboards
- [x] Drag & Drop (DnD) functional widget grid (move, scale, remove)
- [x] Widget Library dropout with drag-to-dashboard support
- [x] Fixed Site/Plant level dashboard tab navigation
- [x] Responsive Dashboard Grid (reflows widgets based on screen size)
- [x] Deterministic skeleton loaders (resolved hydration errors)
- [x] Corrected semantic HTML in Sidebar (resolved hydration issues)
- [x] Polished Tab Stack UI (refined offsets and badge positioning)
- [x] Dynamic Sidebar slot in Dashboard (alternates between Library and Info)
- [x] Fixed NaN values in WIS Modal parameter inputs
- [x] Resolved react-resizable build errors
- [x] Search input implemented in navigation panels (module rail & contextual panel)
- [x] Dashboard cards enhanced with image thumbnail support
- [x] Conditional filtering implemented for dashboard views
- [x] Equipment dashboard layout refined and widget management improved
- [x] **Home page** — new default landing view with 6 modules
- [x] **Global Search** — real-time autofill across sites, plants, equipment, dashboard tabs
- [x] **AI Summary** — mockup critical notices + safe suggested actions panel
- [x] **Recent Dashboards** — live LRU list (max 6), auto-populated by all navigation paths
- [x] **Favourite Dashboards** — bookmark icon on Equipment Dashboard header, shows in Home grid
- [x] **Change Log** — dashboard + operation changes table with tab filtering
- [x] **Your Documents** — document library with Uploaded/Shared + asset-level filtering
- [ ] Features 2–5, 7, 9–10 — not yet wired up / functional
- [ ] Real data integration (replace mock data in `lib/data.ts`)
- [ ] Authentication / user management
- [ ] Backend / API layer
- [ ] Shift Log view (navigation item exists, view not built)
- [ ] Chat & Alerts views (navigation items exist, views not built)
- [ ] Favorite & Share with me views (navigation items exist, views not built)

## Key Decisions & Constraints
- **`currentView: "home"` is the default** — the app opens on the Home page.
- **Home page state is Zustand only** — recents and favourites reset on hard refresh.
- **Bookmark is per-tab** — operates on specific dashboard IDs.
- **WIS Tool v2 Navigation** — Clicking "Run WIS" in the Equipment Dashboard **navigates** the user to the centralized `whatif-tool-view.tsx` with the `run` tab pre-selected. We moved away from the old modal-only configuration flow to provide a more robust environment.
- **WIS Report Storage** — Reports generated from a WIS run are automatically saved into the **Documents** store (`savedDocuments` in Zustand) with `Uploaded` category and auto-tagged to the specific equipment.
- **Zustand for all cross-view state** — navigation tabs (initialTab), WIS sessions, and document storage live in the store.
- **AI content rules** — AI Summary is a mock. Do not suggest dangerous operational actions.
- **No backend yet** — all data is static mock data in `lib/data.ts`.
- **View routing is manual** — `currentView` in the store drives which `<View />` component renders in `page.tsx`.
- **WIS features follow a 5-step progress model** — simulations are visual only, using animated progress steps and pre-defined mock result deltas.
- **Sidebar Slot Sharing** — In the Equipment Dashboard, the right sidebar slot is shared between `ModuleLibrary` (Edit mode) and `EquipmentInformation` (View mode) to maintain layout consistency.
- **`public/images/`** — `site-map.jpg` (site aerial view) and `pid-diagram.jpg` (P&ID diagram) are expected here but not committed. Users drop them in manually.

## People & Roles
- **Nhan** — product owner, UI design decisions, all feature development
- **AI coding agents** — implementation partner; reads this file and analyze the source code to understand deeply about the project at the start of every session.
