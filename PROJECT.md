## Product
SPM ONE is an industrial Asset Performance Management (APM) web application prototype for Integrity Engineers. It gives users a hierarchical portfolio view (Site -> Plant -> Equipment), equipment-centric dashboards with drag-and-drop widget customization, P&ID/site visualization, a centralized What-If Scenario (WIS) tool, document management, and AI-assisted insights.

Core value:
- Provide one operational workspace from portfolio-level navigation down to equipment-level health/performance analysis.
- Let engineers configure and compare simulated operating scenarios before decisions.
- Keep dashboarding flexible through reusable widgets and editable dashboard layouts.
- Capture and share generated scenario reports through an integrated document library.

## Ontology Summary
Key entities:
- Asset hierarchy: `Site`, `Plant`, `Equipment`.
- Visualization layer: `Dashboard` (per equipment), `Widget` (KPI/chart/table/summary components), `DashboardWidget` (placement/layout join), `WidgetLibraryItem` (drag/drop catalog).
- Navigation/tooling: `AppModule`, `Tool` (with What-If Scenarios under Tools).
- What-If domain: `WhatIfScenario`, `WhatIfScenarioParameter`, `WhatIfRunSession`, `WhatIfRunInput`, `WhatIfRunResult`.
- Supporting operational data: `User`, `UserDocument`, `ChangeLogEntry`, `DataSyncStatus`, `SyncJob`.

Key relationships:
- A `Site` has many `Plant`; a `Plant` has many `Equipment`.
- An `Equipment` has zero or many `Dashboard`.
- A `Widget` can appear in many `Dashboard` via `DashboardWidget`.
- A `WhatIfScenario` belongs to one `Equipment` and has parameters + run history.
- A `WhatIfRunSession` has many inputs and many results.
- `UserDocument` can be scoped to site/plant/equipment and optionally linked to a run session.
- What-If tool is modeled as a `Tool` under the `Tools` `AppModule`.

Business behavior reflected in ontology:
- KPI is treated as a widget subtype (not a separate KPI entity).
- Users can create dashboards from blank or by cloning existing dashboards.
- Users can queue additional What-If runs while another run is running.
- Selected-dashboard requirement for WIS runs has been removed.

## Current Build State
- ✅ App shell and manual view router (`currentView`) with two-layer sidebar + header.
- ✅ Home view with modules: Global Search, AI Summary, Recents, Favorites, Change Log, Documents preview.
- ✅ Site Overview view (map, plant markers, KPIs/charts, docs panel, dashboard tab stack).
- ✅ Plant Overview view (equipment context, P&ID panel, charts, AI health overlays).
- ✅ Equipment Dashboard core (multi-dashboard/tab experience, widget grid rendering, edit mode).
- ✅ Widget management in Equipment Dashboard (drag, resize, remove, add from Widget Library).
- ✅ Dashboard creation/deletion UX (clone existing or blank dashboard).
- ✅ Data & Sync view table screens.
- ✅ Centralized What-If Scenario Tool v2 (scenario list, configure/run/history/results/compare, animated run steps).
- ✅ WIS-to-dashboard flow (viewed data selection, compare with live).
- ✅ Documents Tool view (grid/list, category + asset filters, search, share/download interactions).
- ✅ WIS report metadata integration into Documents store.
- ✅ AI feature wiring for key surfaced modules (Feature 1, 3, 4, 5, 6, 7, 8).
- 🔄 Legacy What-If modal flow still mounted alongside centralized WIS tool.
- 🔄 Sidebar entries exist but no built views: Shift Log, Chat, Alerts, Favorite workspace, Share with me, Settings subsections.
- 🔄 All functional data remains mock/static (no backend/API persistence).

## Tech Stack
Actually used in the frontend:
- Framework/runtime: Next.js 16 (App Router), React 19, TypeScript 5.7.
- Styling/UI: Tailwind CSS v4, shadcn/ui (Radix primitives), `tw-animate-css`, `next-themes`.
- State: Zustand 5 (cross-view state, WIS sessions, docs store, navigation/view mode).
- Charts/visualization: Recharts 2.15.
- Dashboard layout interactivity: `react-grid-layout` + `react-resizable`.
- Icons: `lucide-react`.
- Package manager/build: pnpm, Next build pipeline.
- Hosting/analytics: Vercel + `@vercel/analytics`.
- Backend/data layer: none yet (static mock data in `lib/data.ts`).

Notable installed-but-not-actively-used packages from audit: `@dnd-kit/*`, `cmdk`, `date-fns`, `react-day-picker`, `input-otp`, `embla-carousel-react`, `sonner` (in app views).

## Key Technical Decisions
- Default landing is `currentView: "home"`.
- View routing is manual (store-driven render switching in `app/page.tsx`, not URL-driven route transitions).
- Zustand is the cross-view source of truth for navigation, WIS sessions, and saved documents.
- WIS v2 is centralized (`whatif-tool-view.tsx`); dashboard “Run WIS” navigates into the tool with preselected tab/context.
- WIS report generation writes to the same documents store with equipment-aware tagging.
- WIS execution model uses a 5-step visual progress simulation.
- Equipment dashboard right slot is shared dynamically between information panel and widget library based on mode.
- Home recents/favorites are in-memory state (reset on hard refresh by design today).
- AI safety constraint: AI Summary content is mock/advisory and should avoid unsafe operational guidance.
- Strong reusable UI patterns identified in audit: `WidgetErrorBoundary`, seed hooks for store initialization, declarative default widget set/layout maps, two-layer sidebar architecture.

## Known Tech Debt
Prioritized from audit:

1) High
- URL-less navigation (`currentView` only): no deep links/back-button semantics for real workflows.
- No persistence for recents/favourites (session reset on refresh).
- Global single `equipmentKPIs` constant still used in UI (not per-equipment data model).

2) Medium
- Legacy What-If modal flow still mounted while WIS Tool v2 is canonical (parallel pathways).
- Fragile typing/lookup patterns in overview screens (`any` card handlers, fallback string-to-id derivation).
- Hardcoded invalid tab behavior in plant overview navigation (`#process` fallback).
- Component naming collision risk: app `components/sidebar.tsx` vs `components/ui/sidebar.tsx`.

3) Maintainability
- Large component files are partially decomposed but still need additional extraction (`equipment-dashboard.tsx`, `whatif-tool-view.tsx`, `home-view.tsx`, `sidebar.tsx` remain sizeable).
- Recent decomposition completed:
  - Equipment dashboard widget/layout logic moved to `components/views/equipment-dashboard/widget-view-resolver.tsx` and `components/views/equipment-dashboard/layouts.ts`.
  - What-If shared helpers moved to `components/views/whatif-tool/shared.tsx`.
  - Home constants moved to `components/views/home/constants.tsx`.
  - Sidebar config/constants moved to `components/sidebar/config.tsx`.
- Duplicate component debt was addressed by extracting shared document helpers (`lib/documents.ts`), reusing one tab-strip renderer in equipment dashboard, sharing home card navigation helper, and consolidating duplicate hook implementations.

4) Low
- `styles/globals.css` appears unused in App Router context.
- Some packages installed but not used in app views.
- Randomized widget values in render path (`Math.random()` in flaw widget) can cause UI instability.

## What Needs Backend
- Asset hierarchy source (`Site`, `Plant`, `Equipment`) and metadata services.
- Dashboard persistence:
  - `Dashboard` CRUD per equipment.
  - `Widget` catalog registry and versioning.
  - `DashboardWidget` layout persistence and per-user/team permissions.
- Real equipment performance/health data pipelines for widget rendering (replace static chart arrays/constants).
- What-If backend:
  - Scenario definitions and parameter schemas.
  - Run orchestration queue/executor and status tracking.
  - Run inputs/results storage.
  - Run history retrieval and viewed-data serving for dashboard overlays.
- Documents backend:
  - File upload/storage URLs.
  - Share permissions and recipient resolution.
  - Report generation artifacts linked to source run sessions.
- Authentication and user identity:
  - Replace hardcoded names/avatar initials.
  - Role-based authorization for edit/run/share actions.
- Change Log backend event ingestion (immutable audit records from real actions).
- Data & Sync backend:
  - Ingestion status and job history endpoints.
  - Log retrieval, failure diagnostics, retry actions.
- Persistent user state (recents/favourites/preferences) beyond in-memory Zustand.
