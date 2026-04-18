# Project Context

## What is this project?
SPM ONE is an industrial asset performance management (APM) web application prototype. It provides Integrity Engineers with a hierarchical view of their asset portfolio — from site level down to individual equipment — including real-time interactive KPI dashboards built with Recharts, a Drag-and-Drop widget customization system, P&ID diagrams, a What-If scenario modeller, and an AI-assisted insight layer. The app is built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and shadcn/ui.

## Where are we in the project, what have we recently done?
Mid-deployment — Dashboards & Navigation Overhaul. The UI prototype has transitioned from static mockups to a dynamic, interactive environment. A major navigation redesign implemented a two-layer "Gmail-pattern" system: a persistent Module Rail and a contextual Panel. The Equipment Dashboard was migrated from `@dnd-kit` to `react-grid-layout`, enabling a sophisticated, professional 12-column grid with free-form drag-and-drop and corner resizing (iPhone-like arrangement). A new "Dashboard Tab Stack" UI was implemented for Site/Plant views, featuring grouped tabs with hover "fan" effects and click-to-expand motion. The 3D Digital Twin viewer now renders context-aware models (Coke Drum, HCU, Pump) based on the active asset. Navigation at Site and Plant levels was also fixed to support deep-linking to specific equipment dashboard tabs with functional global filtering.

## Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.7
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix UI primitives), `tw-animate-css`
- **State:** Zustand 5
- **Charts:** Recharts 2.15
- **Interactivity:** `react-grid-layout` for advanced Drag & Drop (resizing, free-form positioning)
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
│   │   ├── site-overview.tsx      ← Screen 1 — Site level (uses Tab Stacks)
│   │   ├── plant-overview.tsx     ← Screen 2 — Plant level (uses Tab Stacks)
│   │   ├── equipment-dashboard.tsx← Screens 3–6 — RGL-powered grid
│   │   └── data-sync.tsx          ← Screen 9 — Data & Sync
│   └── ui/                        ← shadcn/ui base components
│       └── dashboard-tab-stack.tsx ← Grouped tab UI with fan-spread animation
├── lib/
│   ├── store.ts             ← Zustand global state (navigation, view mode, modals, AI flags)
│   ├── data.ts              ← All mock/static data (sites, plants, equipment, KPIs)
│   └── utils.ts             ← cn() helper
└── public/
    └── images/              ← Drop site-map.jpg and pid-diagram.jpg here
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
- [x] AI components scaffolded (Feature 1–10)
- [x] Feature 1 — Global Floating AI Spark Button (wired to global state)
- [x] Feature 6 — AI Insight Overlay (wired to global state)
- [x] Two-layer navigation system (Module Rail + Contextual Panel)
- [x] Interactive Recharts widgets for all Equipment dashboards
- [x] Migration to `react-grid-layout` for professional dashboard editing
- [x] Resizable widgets (corner-pull) and free-form arrangement
- [x] Dashboard Tab Stack UI (hover fan-spread, click expand)
- [x] Context-aware 3D SVG models (Coke Drum, HCU, Pump)
- [x] Global functional filtering on Site/Plant overview panels
- [x] Widget Library dropout with click-to-add support
- [x] Fixed Site/Plant level dashboard tab navigation
- [ ] Features 2–5, 7–10 — not yet wired up / functional
- [ ] Real data integration (replace mock data in `lib/data.ts`)
- [ ] Authentication / user management
- [ ] Backend / API layer
- [ ] Shift Log view (navigation item exists, view not built)
- [ ] Chat & Alerts views (navigation items exist, views not built)
- [ ] Favorite & Share with me views (navigation items exist, views not built)

## Key Decisions & Constraints
- **No backend yet** — all data is static mock data in `lib/data.ts`. Do not add API calls until a backend is decided.
- **State management via Zustand** — all global state (navigation path, view mode, modal open/close, AI flags) lives in `lib/store.ts`. Never manage cross-component state locally.
- **View routing is manual** — `currentView` in the store drives which `<View />` component renders in `page.tsx`. There is no Next.js file-based routing for sub-views; don't add it without discussion.
- **shadcn/ui for all new UI primitives** — use the components in `components/ui/`. Avoid adding other component libraries.
- **Tailwind CSS v4** — uses the new `@theme` / CSS-variable token system in `globals.css`. Do not use the old `tailwind.config.js` pattern.
- **pnpm only** — do not use npm or yarn to install packages.
- **What-If modal is global** — it is mounted once in `page.tsx` and toggled via `setWhatIfModalOpen` from the store. Do not mount it inside child components.
- **AI components follow a Feature-N naming convention** — files in `components/ai/` are named `featureN-*.tsx`. Keep this pattern for any new AI features.
- **Two-layer Navigation** — Persistent left Rail + Contextual slide-out Panel. All module switching happens via the Rail.
- **Interactive Dashboard Grid** — Powered by `react-grid-layout`. Supports 12-column responsive layouts, free-form positioning, and corner resizing.
- **Dashboard Tab Stacks** — Categorizes dashboards by equipment. Features "top-tip" counter badges and auto-expansion logic when filters reduce the set to a single group.
- **`public/images/`** — `site-map.jpg` (site aerial view) and `pid-diagram.jpg` (P&ID diagram) are expected here but not committed. Users drop them in manually.

## People & Roles
- **Nhan** — product owner, UI design decisions, all feature development
- **AI coding agents** — implementation partner; reads this file and analyze the source code to understand deeply about the project at the start of every session.

