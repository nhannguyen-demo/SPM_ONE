## Product
SPM ONE is an industrial Asset Performance Management (APM) web application prototype for Integrity Engineers. It gives users a hierarchical portfolio view (Site -> Plant -> Equipment), an Equipment Home Page for browsing dashboards and scoped tools, a per-user **Workspace** feature (AppModule key `workspace`) for managing dashboards (folders, drafts, sharing, commenting, publishing, editing), a Comms Module with an in-app Alerts page, a centralized What-If Scenario (WIS) tool, document management, and AI-assisted insights.

**UI naming:** The Workspace module is labeled **Dashboard** in the product UI (module rail, sidebar panel header, search placeholder, and related navigation copy). App Router URLs live under **`/dashboard/*`**; Zustand (`useWorkspaceStore`), `lib/workspace/`, and types such as `WorkspaceDashboard` keep **Workspace** in code to distinguish the module from individual `Dashboard` records.

Core value:
- Provide one operational workspace from portfolio-level navigation down to equipment-level health/performance analysis.
- Let engineers quickly review equipment dashboards in a read-only popup and launch scoped tools from an equipment-centric home page.
- Let engineers configure and compare simulated operating scenarios before decisions.
- Give each engineer a private dashboard CMS (Workspace / **Dashboard** in UI) with a Canva-like folder system, drag-and-drop organization, drafts vs. published lifecycle, sharing with named users or copyable links, in-popup commenting, and the **Dashboard** module editor that reuses the Widget Library.
- Surface every sharing event and permission request through the Comms Module Alerts page, with one-click deep-links back to the relevant **Dashboard** module surface (`/dashboard`).
- Allow engineers to monitor the same dashboard simultaneously across multiple browser tabs (Full-Screen Dashboard Viewer route) with a live "open elsewhere" indicator on the Equipment Home Page.
- Capture and share generated scenario reports through an integrated document library.
- **Editor consolidation (Option A):** Interactive dashboard authoring lives only in the **Dashboard** module App Router editor (`/dashboard/dashboard/[dashboardId]/edit`). The legacy in-shell equipment dashboard editor is removed; Asset module surfaces stay read-only for preview.
- **Catalog-driven library (Coker v1 — in design / build):** Dashboards are composed from **versioned equipment knowledge packs** (`EquipmentKnowledgePack`, `ParameterFamily`, `CatalogWidgetTemplate` in `domain.ontology.yaml`). Only the **product team** changes the catalog via releases. **Equipment** gains `equipmentTypeKey` (e.g. `coker`) and optional `parameterAddonKeys`. **Workspace** persisted `widgets[]` evolves to **template key + options + display title + packVersion**; the **Coker** pack must cover six client reference screens (R1–R6 — equipment info + model, operations/sensors, fatigue overview, bulging, crack/FAD, per-cycle). Users submit **ParameterRequest** in-app (product team queue). **PDF/print** shall match on-screen themed layout. Source PRD: `scripts/prd.txt`; layer plan: `.taskmaster/docs/coker-catalog-rebuild-layers.md`.

## Ontology Summary
Key entities:
- Asset hierarchy: `Site`, `Unit`, `Equipment` (mock JSON uses `site.units` on each site; Zustand navigation still uses `currentPath.plant` for the selected unit id — see `domain.ontology.yaml`). Optional `Plant` remains in the ontology for future multi-plant sites and is not used in the Apr 2026 mock between Site and Unit. **`Equipment`** includes **`equipmentTypeKey`** (selects pack for Widget Library) and **`parameterAddonKeys`** (product-team add-ons per asset).
- Visualization / dashboard: `Dashboard` (per equipment; lifecycle, Workspace fields), `Widget` / `DashboardWidget` (legacy), `WidgetLibraryItem` (legacy catalog join), **`EquipmentKnowledgePack`**, **`ParameterFamily`**, **`CatalogWidgetTemplate`**, **`ParameterRequest`**; transition remains until all tiles use `CatalogWidgetTemplate` keys.
- Workspace Module entities (UI: **Dashboard** module): `WorkspaceFolder` (per-user nested folder tree), `DashboardShare` (per-recipient grant), `ShareLink` (token-based grant), `DashboardComment`, `PermissionRequest`.
- Comms Module entities: `Notification` (in-app alert).
- Cross-tab UI context: `DashboardViewerTabSession` (non-persisted; broadcast cross-tab) and `EquipmentHomeView.externalOpenTabCounts`.
- Navigation/tooling: `AppModule` (keys: `home`, `assets`, `workspace`, `insights`, `comms`, `settings`; the `workspace` entry is shown as **Dashboard** in the UI), `Tool` (canonical keys: `data_sync`, `shift_log`, `documents`, `whatif`).
- UI context (non-persisted): `EquipmentHomeView` — tracks active dashboard popup, viewed-data scenario, and external-open-tab counts for the Equipment Home Page.
- What-If domain: `WhatIfScenario`, `WhatIfScenarioParameter`, `WhatIfRunSession`, `WhatIfRunInput`, `WhatIfRunResult`.
- Supporting operational data: `User` (now with `isCurrentUser` mock-auth flag and `avatarUrl`), `UserDocument`, `ChangeLogEntry`, `DataSyncStatus`, `SyncJob`.

Key relationships:
- A `Site` has many `Unit`; a `Unit` has many `Equipment`. Placeholder equipment rows (`isPlaceholder`) appear in the asset menu only and do not navigate.
- An `Equipment` has zero or many `Dashboard`.
- A `Widget` can appear in many `Dashboard` via `DashboardWidget`.
- A `Dashboard` has exactly one owner `User`, zero or many contributor `User`s, and lives in zero or one `WorkspaceFolder` (nested tree per user).
- A `Dashboard` has zero or many `DashboardShare`s (named recipients), zero or many `ShareLink`s (token recipients), and zero or many `DashboardComment`s.
- A `PermissionRequest` references one `Dashboard`, one requester `User`, and one resolver `User`.
- A `Notification` references one recipient `User` and optionally a `Dashboard`, `DashboardShare`, `PermissionRequest`, and actor `User`.
- A `WhatIfScenario` belongs to one `Equipment` and has parameters + run history.
- A `User` with `role = product_team` may access the in-app **ParameterRequest** queue (v1; mock-gated).
- `UserDocument` can be scoped to site/plant/equipment and optionally linked to a run session.
- What-If tool is modeled as a `Tool` under the `Tools` `AppModule`.
- `EquipmentHomeView` is scoped to one `Equipment`; it can show one `Dashboard` in a read-only popup overlay at a time and aggregates per-dashboard external-open-tab counts.
- Navigating from `EquipmentHomeView` tool tiles to a `Tool` passes `Equipment` context as a pre-filter.

Business behavior reflected in ontology:
- KPI is treated as a widget subtype (not a separate KPI entity).
- Users can create dashboards from blank or by cloning existing dashboards.
- The Workspace feature (`AppModule.workspace`) is per-user: a user only sees their own dashboards and dashboards explicitly shared with them.
- A `Dashboard` has two lifecycle states: `created` (draft, Workspace-only) and `published` (also visible in the Asset Module Equipment Home Page). Owners can transition between them.
- Sharing is independent of ownership; share permission levels are `view` < `comment` < `edit`.
- Saving an edit by a non-owner with edit permission appends them to `contributorUserIds` (idempotent).
- Comments do NOT generate notifications; only sharing-related events do (share, first-view, permission requests, resolutions).
- Users can queue additional What-If runs while another run is running.
- Selected-dashboard requirement for WIS runs has been removed.
- Current mock profile: **Site 2000** (`site-x`) has three units — **Unit 2006 - DCU**, **Unit 2007 - HCU**, **Unit 2008 - Hydrogen Unit** — with primary equipment **Coker 01** (`equipment-a`), **HCU 01** (`equipment-b`), and **SMR Pigtails** (`equipment-c`). Former labels (Site X, Unit CFR.101, Coke Drum, HCU, SMR Unit A) are retired; **Site Y** and **Unit TFR.40** are removed from mock data. Additional menu-only placeholders: Coker 02, Coker Furnace, HCU 02, SMR Catalyst Tubes.
- The SMR Pigtails equipment has a dashboard tab named `SMR Pigtail Integrity`.
- Equipment dashboard widgets for this profile are SMR-focused where applicable; the 3D model widget shows an SMR mockup model (not a pump model) for `equipment-c`.
- Navigating to an Equipment asset now lands on the Equipment Home Page (not directly on the dashboard editor).
- Dashboard Popup on the Equipment Home Page is read-only; Viewed Data, report, share, and **Open in new tab** are available.
- The Equipment Home Page Dashboard Popup `Open in new tab` action navigates a new browser tab to the Full-Screen Dashboard Viewer route and closes the popup in the originating tab.
- A dashboard can be open simultaneously in multiple browser tabs; the Equipment Home Page shows a live `open elsewhere` indicator (count) per dashboard via cross-tab `BroadcastChannel`/`storage` signalling.
- The Workspace `AppModule` (`workspace` key) is the canonical home for dashboard editing; **Edit Dashboards** from Equipment Home Page navigates here (`/dashboard`) pre-scoped to the originating equipment.
- **Canonical data source (Apr 27 2026)**: `WorkspaceDashboard` (from `useWorkspaceStore`) is the single source of truth for dashboard metadata. Equipment Home Page, Home Page Recents/Favorites, and Site/Plant Overview Tab Stacks derive their dashboard lists from published `WorkspaceDashboard` records via `lib/workspace-data.ts` adapters. The static `dashboardCards` array in `lib/data.ts` is deprecated. Dashboard identity across Asset surfaces is keyed on `WorkspaceDashboard.id`.

## Current Build State
- ✅ App shell and manual view router (`currentView`) with two-layer sidebar + header.
- ✅ Home view with modules: Global Search, AI Summary, Recents, Favorites, Change Log, Documents preview.
- ✅ Site Overview view (map, plant markers, KPIs/charts, docs panel, dashboard tab stack).
- ✅ Plant Overview view (equipment context, P&ID panel, charts, AI health overlays).
- ✅ Read-only dashboard preview: Full-Screen Viewer, **Dashboard** module popup, and **Equipment Home** popup all use `ResponsiveDashboardGrid` + `DashboardWidgetBody` (catalog `templateKey` → `CokerTemplateView`). Equipment Home passes `viewedDataIds` and equipment-scoped What-If runs; empty published dashboards use `useEmptyFallback={false}` with asset-appropriate copy.
- 🚧 **Catalog-driven Coker dashboard library (in design / build):** See `scripts/prd.txt`, `domain.ontology.yaml` (new entities), `.taskmaster/docs/coker-catalog-rebuild-layers.md`. Replaces ad-hoc `viewType` widgets with **template key + options**; adds **ParameterRequest** queue, **dashboard context** bar, **duplicate across same equipment type**, **export/print** parity.
- ✅ Data & Sync view table screens with equipment pre-filter support from Equipment Home tool entry.
- ✅ Centralized What-If Scenario Tool v2 (scenario list, configure/run/history/results/compare, animated run steps).
- ✅ WIS-to-dashboard flow (viewed data selection, compare with live).
- ✅ Documents Tool view (grid/list, category + asset filters, search, share/download interactions).
- ✅ WIS report metadata integration into Documents store.
- ✅ AI feature wiring for key surfaced modules (Feature 1, 3, 4, 5, 6, 7, 8).
- 🔄 Legacy What-If modal flow still mounted alongside centralized WIS tool.
- 🔄 Sidebar entries exist but no built views: Shift Log, Chat, Alerts, Favorite Dashboard panel stubs, Settings subsections.
- 🔄 All functional data remains mock/static (no backend/API persistence).
- ✅ Equipment Home Page implemented as the default equipment entry point from Asset hierarchy.
- ✅ Dashboard Popup implemented in read-only mode with Viewed Data + report/share actions.
- ✅ Tools Section implemented on Equipment Home Page (Data & Sync, Shift Log placeholder, Documents, What-If Scenario).
- ✅ **Dashboard** module (code: Workspace) stub implemented as the "Edit Dashboards" navigation target.
- ✅ What-If History -> "View results" / result **View Data** routes back to Equipment Home for that run's equipment; viewed-data run is queued for overlay when the user opens a dashboard popup (no forced popup or mystery dashboard).
- ✅ Site/Plant dashboard stack tab clicks now route to Equipment Home popup (not legacy equipment dashboard screen).
- ✅ Site/Plant dashboard stack equipment-name labels now route to Equipment Home page and are visually clickable link controls.
- 🚧 **Dashboard module (Workspace) — full content management (in design)**: per-user dashboards, nested folders, search/filter/sort, drafts vs. published lifecycle, popup viewer with Comments + Edit + Open-in-new-tab, Workspace-native editor reusing Widget Library, sharing with named users and copyable links with permission levels (view/comment/edit), Shared-with-me, permission requests.
- 🚧 **Comms Module Alerts page (in design)**: notifications for `dashboard_shared_with_you`, `dashboard_first_view`, `permission_request_received`, `permission_request_resolved`; deep-link "View" actions back to `/dashboard`; live unread-count badge on module rail.
- 🚧 **Equipment Home Page deep-linking & multi-tab (in design)**: `Edit Dashboards` button now navigates to **Dashboard** (`/dashboard`) pre-scoped to the originating equipment; Dashboard Popup gains `Open in new tab`; Full-Screen Dashboard Viewer route renders chromeless; `open elsewhere` indicator on dashboard tabs uses `BroadcastChannel` cross-tab signalling.
- 🚧 **App Router migration (in design)**: real Next.js routes (`/dashboard`, `/dashboard/folder/[id]`, `/dashboard/shared`, `/dashboard/recent`, `/dashboard/trash`, `/dashboard/dashboard/[id]/edit`, `/dashboards/[id]/full`, `/share/[token]`); legacy `currentView` router stays for Home / Site / Plant / Equipment Home / Tools during transition. Old `/workspace/*` URLs redirect to `/dashboard/*`.

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

Note: `@dnd-kit/*` will be activated for the Workspace folder tree drag-and-drop and dashboard "Move to folder" interactions.

## Routes & Pages
Existing single-page shell (`app/page.tsx`) renders the legacy `currentView` switcher for Home, Site, Plant, Equipment Home, Tools (Data & Sync, What-If, Documents). **Dashboard widget editing** is not routed through this shell; it uses the App Router **Dashboard** module at `/dashboard/dashboard/[id]/edit`. The legacy `currentView: "equipment"` surface (in-shell equipment dashboard with tab strip and local grid) is **deprecated** and will be removed per Option A.

New App Router pages introduced by the Workspace + multi-tab work:

| Route | Purpose | Chrome |
|---|---|---|
| `/dashboard` | Workspace Module main view (All Dashboards) | Sidebar + Header |
| `/dashboard/folder/[folderId]` | Folder-scoped Workspace view | Sidebar + Header |
| `/dashboard/shared` | Shared-with-me view | Sidebar + Header |
| `/dashboard/recent` | Recent dashboards (LRU, max 20) | Sidebar + Header |
| `/dashboard/trash` | Soft-deleted dashboards (cap 30 days) | Sidebar + Header |
| `/dashboard/dashboard/[dashboardId]/edit` | Workspace-native dashboard editor (Widget Library reuse) | Sidebar + Header |
| `/dashboards/[dashboardId]/full` | Full-Screen Dashboard Viewer (read-only) — opens in new tab | **No chrome** |
| `/share/[token]` | Share-link landing + identity-pick stub | Minimal chrome |
| `/comms/alerts` | Comms Module Alerts page | Sidebar + Header |

Routing principles:
- New surfaces are URL-driven; deep links survive reload and external sharing.
- Legacy `currentView` router remains for the listed legacy surfaces during the transition.
- Cross-tab navigation (e.g. `Open in new tab`) only works correctly with real URLs — hence the routing migration.

## Key Technical Decisions
- Default landing is `currentView: "home"`.
- View routing is manual (store-driven render switching in `app/page.tsx`, not URL-driven route transitions).
- Zustand is the cross-view source of truth for navigation, WIS sessions, and saved documents.
- WIS v2 is centralized (`whatif-tool-view.tsx`); dashboard “Run WIS” navigates into the tool with preselected tab/context.
- WIS report generation writes to the same documents store with equipment-aware tagging.
- WIS execution model uses a 5-step visual progress simulation.
- **Legacy only:** the removed in-shell equipment dashboard shared the right column between "Equipment Information" and `ModuleLibrary` in edit mode; that pattern is not part of the single editor (Dashboard module + `DashboardEditor` only).
- Home recents/favorites are in-memory state (reset on hard refresh by design today).
- AI safety constraint: AI Summary content is mock/advisory and should avoid unsafe operational guidance.
- Strong reusable UI patterns identified in audit: `WidgetErrorBoundary`, seed hooks for store initialization, declarative default widget set/layout maps, two-layer sidebar architecture.
- **Equipment Home Page entry point**: navigating to an equipment from the asset hierarchy sets `currentView: "equipment-home"`. **Edit** uses the **Dashboard** module only: links go to `/dashboard` (filtered) or `/dashboard/dashboard/[id]/edit` — not to `currentView: "equipment"`.
- **Dashboard Popup (Equipment Home)**: state lives in local `EquipmentHomeView` (`activePopupDashboardId`); the popup reuses `ResponsiveDashboardGrid` with `viewedDataIds` and equipment-scoped `scenarioRuns` so layout and Coker catalog tiles match the **Dashboard** module and full-screen viewer.
- **Cross-view auto-open behavior**: Site/Plant dashboard stack tab clicks set one-shot popup targeting (`equipmentHomeAutoOpenTab`) so Equipment Home opens directly into the selected read-only dashboard popup.
- **Equipment pre-filter for Tools**: when navigating from Equipment Home Page tool tiles, the target equipment `id` is written to a Zustand slice (`preFilterEquipmentId`) so the destination tool page can read and apply it on mount.
- **Data & Sync filter**: `DataSyncView` will accept `preFilterEquipmentId` from Zustand to auto-select the equipment filter on entry.
- **Stack label navigation UX**: equipment labels in dashboard tab stacks are explicit link-style controls with dedicated click handling (separate from stack expand/collapse interaction).
- **Mock current-user identity (Workspace)**: in lieu of real auth, exactly one `User` row carries `isCurrentUser=true`; the value persists in `localStorage` and can be switched via a debug user-switcher. All ownership / sharing / contributor logic keys off this id.
- **Workspace persistence**: Workspace mock data (folders, dashboards, shares, links, comments, notifications) lives in a `localStorage`-backed Zustand slice; reload preserves state. A debug "Reset Workspace" action re-seeds.
- **Dashboard module editor (sole authoring engine)**: `components/workspace/dashboard-editor.tsx` at `/dashboard/dashboard/[dashboardId]/edit` is the **only** surface for add/remove/drag/resize/save of widget layout. The legacy `equipment-dashboard.tsx` editor is **retired**; shared building blocks remain (`ModuleLibrary`, `layouts.ts` for seed/defaults, `WidgetViewResolver`). External widget drops: `react-grid-layout` `onDrop`; HTML5 payload `application/x-spm-widget` (JSON) from `ModuleLibrary`.
- **Cross-tab open-state signalling**: `BroadcastChannel('spm-one:viewer-tabs')` with `localStorage` `storage`-event fallback; viewer tab broadcasts JOIN on mount, LEAVE on `pagehide`, heartbeat every 5s. Equipment Home Page derives `externalOpenTabCounts` from these signals and renders an indicator on each dashboard tab/card.
- **Routing strategy (phased)**: new Workspace, Full-Screen Viewer, and Share-link surfaces are URL-driven via App Router; legacy surfaces continue to use `currentView`. Cross-module navigation that must survive reload (folder, dashboard popup target, full-screen viewer, share-link landing) goes through real URLs.
- **Workspace module rail submenu** (UI: **Dashboard** module): cleaned to a single-level list — "All Dashboards", "Shared with me", "Recent", "Trash". No nested submenu permitted. Replaces previous "Favorite" / "Share with me" stubs.
- **Workspace in-page menu unification** (shown inside **Dashboard**): Workspace must render a single in-module navigation panel (no duplicate white + blue menus). The unified panel uses the dark-blue submenu visual style used across modules, while retaining all functional behavior currently provided by the white Workspace menu (locations, folder tree interactions, and badges/counters).
- **Canonical dashboard data source**: `WorkspaceDashboard` records (via `useWorkspaceStore`) are the single source of truth for dashboard metadata. `lib/workspace-data.ts` provides the `EquipmentHomeDashCard` adapter type and bridge functions (`getPublishedDashboardsForEquipment`, `getDashboardById`, `getWorkspaceDashboardIdForTag`) that Asset and Home modules consume. The legacy `dashboardCards` static array is deprecated. Cross-tab presence and Site/Plant one-shot auto-open use `WorkspaceDashboard.id`. What-If result **View Data** navigates to Equipment Home only (no auto-open popup); `whatIfDashboardAutoSelectRunId` still primes Viewed Data when the user opens a dashboard.

## Known Tech Debt
Prioritized from audit:

1) High
- URL-less navigation (`currentView` only) for many legacy surfaces: no deep links/back-button semantics for those flows. **Exception (resolved for editing):** dashboard authoring uses real URLs under `/dashboard/*` (Option A: single editor).
- No persistence for recents/favourites (session reset on refresh).
- Global single `equipmentKPIs` constant still used in UI (not per-equipment data model).
- Static `dashboardCards` array in `lib/data.ts` (deprecated; active migration to `WorkspaceDashboard` canonical source underway).
- **Duplicate legacy Equipment Dashboard editor** — **resolved:** removed `components/views/equipment-dashboard.tsx` and `currentView: "equipment"`. Authoring is `DashboardEditor` + `useWorkspaceStore` only; shared grid/helpers live under `components/dashboard/`.

2) Medium
- Legacy What-If modal flow still mounted while WIS Tool v2 is canonical (parallel pathways).
- Fragile typing/lookup patterns in overview screens (`any` card handlers, fallback string-to-id derivation).
- Hardcoded invalid tab behavior in plant overview navigation (`#process` fallback).
- Component naming collision risk: app `components/sidebar.tsx` vs `components/ui/sidebar.tsx`.

3) Maintainability
- Large component files are partially decomposed but still need additional extraction (`whatif-tool-view.tsx`, `home-view.tsx`, `sidebar.tsx` remain sizeable).
- Recent decomposition completed:
  - Equipment dashboard widget/layout logic now lives in `components/dashboard/widget-view-resolver.tsx` and `components/dashboard/layouts.ts` (shared with Workspace editor and read-only grids). Legacy in-shell `equipment-dashboard.tsx` removed.
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
  - `Dashboard.isFavorite` and `Dashboard.lastAccessedAt` per user (Equipment Home Page grouping).
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
  - Equipment-level filtering API (to support Equipment Home Page tile preview + tool filter).
- Persistent user state (recents/favourites/preferences) beyond in-memory Zustand.
- **Workspace module backend (spec defined Apr 27 2026)**:
  - Per-user ownership; row-level access control; Site/Plant/Equipment authorization for published dashboards.
  - `Dashboard` lifecycle (`created` ↔ `published`) with audit, dashboard version history, collaborative editing.
  - Folder tree CRUD (`WorkspaceFolder`).
  - `DashboardShare` (named recipients) and `ShareLink` (token-based) with permission levels (`view`/`comment`/`edit`), revoke, regenerate.
  - `DashboardComment` storage and (eventually) realtime fan-out.
  - `PermissionRequest` workflow (request, grant/deny, audit).
  - `Notification` storage, fan-out, and read-state tracking.
  - "First view" detection per share for `dashboard_first_view` alerts.
  - Cross-tab `DashboardViewerTabSession` aggregation (currently client-only via `BroadcastChannel`; eventual server-side presence may be desired).
