## Product
SPM ONE is an industrial Asset Performance Management (APM) web application prototype for Integrity Engineers. It gives users a hierarchical portfolio view (Site -> Plant -> Equipment), an Equipment Home Page for browsing dashboards and scoped tools, a per-user **Workspace** feature (AppModule key `workspace`) for managing dashboards (folders, drafts, sharing, commenting, publishing, editing), a Comms Module with an in-app **Notifications** list (UI label; implementation route may remain `/comms/alerts`), a centralized What-If Scenario (WIS) tool, document management, **Alert Setting** (a **Tools / Insights** tool for equipment-scoped alert rules, assignees, schedules, and delete/recovery — **Coker 01** first with HCU/SMR coming soon in-tool), and AI-assisted insights. **Navigation requirement (May 1 2026):** all primary module experiences shall be **URL-backed** (App Router pages with real browser history), matching the Workspace (**Dashboard**) module pattern — **without** altering visible UI/UX (layout, styling, copy, control behavior) except as needed to preserve parity under routing. **Auth & shell (May 1 2026 rev 2):** the main app shell (sidebar + header routes such as `/home`, `/assets/*`, `/tools/*`) requires sign-in; unauthenticated users are sent to **`/login`**. The header **Bell** mirrors Comms **Notifications** (unread parity, bell dropdown, and **compact ephemeral previews** stacked under the bell for new items — short auto-dismiss; not a full-width strip and not Sonner toasts for that). The module-rail user control shows the signed-in user’s initial and hosts account actions (**Sign out**, read-only identity); the Settings **gear** is removed from the header (Settings remains on the rail). The **Settings** module (`AppModule.settings`) is **in-app application settings** (appearance, locale, workspace defaults, tools defaults, privacy, about) — **not persisted** in the sidebar until a backend exists; it does **not** host org-wide General/Integrations or duplicate **Comms → Notifications** (no **Alert Settings** row here).

**UI naming:** The Workspace module is labeled **Dashboard** in the product UI (module rail, sidebar panel header, search placeholder, and related navigation copy). App Router URLs live under **`/dashboard/*`**; Zustand (`useWorkspaceStore`), `lib/workspace/`, and types such as `WorkspaceDashboard` keep **Workspace** in code to distinguish the module from individual `Dashboard` records.

Core value:
- Provide one operational workspace from portfolio-level navigation down to equipment-level health/performance analysis.
- Let engineers quickly review equipment dashboards in a read-only popup and launch scoped tools from an equipment-centric home page.
- Let engineers configure and compare simulated operating scenarios before decisions.
- Give each engineer a private dashboard CMS (Workspace / **Dashboard** in UI) with a Canva-like folder system, drag-and-drop organization, drafts vs. published lifecycle, sharing with named users or copyable links, in-popup commenting, and the **Dashboard** module editor that reuses the Widget Library. The **Dashboard Popup** toolbar exposes **Comments**, **Publish/Unpublish**, **Edit**, and **Share** to every viewer; users without the needed grant use a unified **request access** dialog (optional note) instead of disabled buttons — Publish and Share requests ask for **edit** access; only the **owner** may execute publish/unpublish.
- Surface every sharing event and permission request through the Comms Module **Notifications** page, with row selection and actions that deep-link to the relevant in-app context when encoded (e.g. **Dashboard** module when `dashboardId` is present); **operational_alert** (equipment alert firings) uses stronger visual treatment and deep-links to **Equipment Home** when `actionHref` / equipment context is set. Users can **archive** (tidy inbox), **restore**, or **delete** rows; when signed in, **`Notification.archivedAt`** is persisted via the workspace API (client-only rows stay in memory until removed).
- Allow engineers to monitor the same dashboard simultaneously across multiple browser tabs (Full-Screen Dashboard Viewer route) with a live "open elsewhere" indicator on the Equipment Home Page.
- Capture and share generated scenario reports through an integrated document library.
- **Editor consolidation (Option A):** Interactive dashboard authoring lives only in the **Dashboard** module App Router editor (`/dashboard/dashboard/[dashboardId]/edit`). The legacy in-shell equipment dashboard editor is removed; Asset module surfaces stay read-only for preview.
- **Catalog-driven library (Coker v1 — parameter-driven redesign, May 2026):** Dashboards are composed from **versioned equipment knowledge packs** (`EquipmentKnowledgePack`, `CokerParameter`, `CatalogWidgetTemplate`, `CokerReferenceWidgetDef` in `domain.ontology.yaml`). Only the **product team** changes the catalog via code releases. The **Widget Library** sidebar splits into two sections: **Parameters** (13 Coker parameters: Temperature, Pressure, Coke Level, Steam Rate, Flow Rate, Bulging, Fatigue Damage, Stress, Remaining Life, PSLF, Ovality, Displacement, Crack) and **Reference & Tools** (Equipment Data, 3D Model, Sensor Location, Time Range, Cycle Selector). Dragging a parameter triggers a **three-step creation popup** (choose visual type → configure → name); dragging a reference widget places it directly. **One widget = one parameter** (composite strips removed). Widget grid stores `parameterId + visualTypeId + config` (replaces `templateKey + options`). Read-only surfaces gain a **focus/expand lightbox** per widget. Implementation plan: `.taskmaster/docs/coker-widget-redesign-prd.md`.

## Ontology Summary
Key entities:
- Asset hierarchy: `Site`, `Unit`, `Equipment` (mock JSON uses `site.units` on each site; Zustand navigation still uses `currentPath.plant` for the selected unit id — see `domain.ontology.yaml`). Optional `Plant` remains in the ontology for future multi-plant sites and is not used in the Apr 2026 mock between Site and Unit. **`Equipment`** includes **`equipmentTypeKey`** (selects pack for Widget Library) and **`parameterAddonKeys`** (product-team add-ons per asset).
- Visualization / dashboard: `Dashboard` (per equipment; lifecycle, Workspace fields), `Widget` / `DashboardWidget` (legacy), `WidgetLibraryItem` (legacy catalog join), **`EquipmentKnowledgePack`**, **`CokerParameter`** (replaces `ParameterFamily`; one physical measurement per widget), **`CatalogWidgetTemplate`** (visual type definitions; updated `kind` enum includes `ovality_chart`, `damage_table`, `severity_table`, `crack_table`; deprecated `composite_kpi_strip` / `empty_state` / `multi_tab_panel`), **`CokerReferenceWidgetDef`** (non-parameter widgets: Equipment Data, 3D Model, Sensor Location, Time Range, Cycle Selector), **`ParameterRequest`**; `ParameterFamily` superseded by `CokerParameter` but retained for backward compat.
- Workspace Module entities (UI: **Dashboard** module): `WorkspaceFolder` (per-user nested folder tree), `DashboardShare` (per-recipient grant), `ShareLink` (token-based grant), `DashboardComment`, `PermissionRequest`.
- Comms Module entities: `Notification` (in-app notification; UI list **Notifications**; optional **`archivedAt`** for inbox vs archived in mock UI).
- Cross-tab UI context: `DashboardViewerTabSession` (non-persisted; broadcast cross-tab) and `EquipmentHomeView.externalOpenTabCounts`.
- Navigation/tooling: `AppModule` (keys: `home`, `assets`, `workspace`, `insights`, `comms`, `settings`; the `workspace` entry is shown as **Dashboard** in the UI; **`settings`** is **in-app Settings** — mock sidebar entries only), `Tool` (canonical keys: `data_sync`, `shift_log`, `documents`, `whatif`, **`alert_setting`** — UI **Alert Setting**; `data_sync` is **Data & Jobs** with **Data Status** + **FEA Jobs**). **May 1 2026:** every primary module surface (except chromeless/full-screen exceptions) shall be reachable via a **stable App Router URL** with real navigation semantics, matching the **Dashboard** module — routing-only; no UI redesign.
- UI context (non-persisted): `EquipmentHomeView` — tracks active dashboard popup, viewed-data scenario, and external-open-tab counts for the Equipment Home Page.
- What-If domain: `WhatIfScenario`, `WhatIfScenarioParameter`, `WhatIfRunSession`, `WhatIfRunInput`, `WhatIfRunResult`.
- Supporting operational data: `User` (role, optional `passwordHash` / `emailVerified` for production auth; `isCurrentUser` **mock-only** until real login; **Account** / **Session** for OAuth and cookie sessions per ontology), `UserDocument`, `ChangeLogEntry`, `DataSyncStatus`, `SyncJob`; **Data & Jobs (May 2026):** ontology adds deferred `ClientSensorDatabaseSource`, `SensorIngestHealthSnapshot`, `EquipmentAnalysisOutputDescriptor`, `DataTransferLogEntry` (UI mock only until Prisma epic). **In-app Settings (May 2026):** deferred `UserApplicationPreference` (1:1 `User`) for persisted theme/locale/workspace defaults when the Settings module graduates from mock. **Alert Setting (May 2026):** ontology adds **`EquipmentAlertRule`**, **`EquipmentAlertAssignee`**, **`EquipmentAlertDeleteRequest`** (mock-first; Prisma epic later); `Notification` gains **`operational_alert`**, optional **`equipmentId`**, **`actionHref`**, **`equipmentAlertRuleId`** for equipment-alert delivery and navigation.

Key relationships:
- A `Site` has many `Unit`; a `Unit` has many `Equipment`. Placeholder equipment rows (`isPlaceholder`) appear in the asset menu only and do not navigate.
- An `Equipment` has zero or many `Dashboard`.
- A `Widget` can appear in many `Dashboard` via `DashboardWidget`.
- A `Dashboard` has exactly one owner `User`, zero or many contributor `User`s, and lives in zero or one `WorkspaceFolder` (nested tree per user).
- A `Dashboard` has zero or many `DashboardShare`s (named recipients), zero or many `ShareLink`s (token recipients), and zero or many `DashboardComment`s.
- A `PermissionRequest` references one `Dashboard`, one requester `User`, and one resolver `User`.
- A `Notification` references one recipient `User` and optionally a `Dashboard`, `DashboardShare`, `PermissionRequest`, `Equipment`, `EquipmentAlertRule`, and actor `User`.
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
- Comments do NOT generate notifications for comment activity; sharing-related events do (and optional operational categories such as edit-lock contention when implemented).
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
- ✅ App shell with two-layer sidebar + header; main modules use App Router URLs (`/home`, `/assets/*`, `/tools/*`) with Zustand `currentView` synced from the pathname (`MainRouteSync`).
- ✅ Home view with modules: Global Search, AI Summary, Recents, Favorites, Change Log, Documents preview.
- ✅ Site Overview view (map, plant markers, KPIs/charts, docs panel, dashboard tab stack).
- ✅ **Unit Overview (Plant Overview) — full P&ID + collapsible context panel (Jun 2026):** Route `/assets/plant/[siteId]/[unitId]`. Overview dashboard card is **P&ID-only** (`/images/pid-diagram.jpg`, Feature 5 overlay preserved). Right **Unit Context Panel** (`components/asset/unit-context-panel.tsx`) collapses via `PanelLeftClose` and reopens via edge `ChevronLeft` control. Applies to all Units.
- ✅ Read-only dashboard preview: Full-Screen Viewer, **Dashboard** module popup, and **Equipment Home** popup all use `ResponsiveDashboardGrid` + `DashboardWidgetBody` (catalog `templateKey` → `CokerTemplateView`). Equipment Home passes `viewedDataIds` and equipment-scoped What-If runs; empty published dashboards use `useEmptyFallback={false}` with asset-appropriate copy.
- 🚧 **Coker widget redesign — parameter-driven model (May 2026):** New architecture: **Widget Library** splits into Parameters section (`CokerParameter`) and Reference & Tools section (`CokerReferenceWidgetDef`). Dragging a parameter triggers a three-step creation popup (visual type → configure → name). One widget = one parameter. `GridWidget` stores `parameterId + visualTypeId + config`. Widget library rewrite: `lib/equipment-packs/coker-v1.ts` (13 parameters + valid visual type mappings), `components/catalog-module-library.tsx` (two-section layout), new `components/workspace/widget-config-popup.tsx` (multi-step popup), `components/dashboard/coker-template-view.tsx` (new renderer routing). Read-only surfaces gain a focus/expand lightbox (`components/workspace/widget-focus-overlay.tsx`). Broken placeholders (Remaining Life gauge, Flow Rate, Steam Rate, Stress, Ovality, Sensor Location) replaced with proper mockup renderers. See `.taskmaster/docs/coker-widget-redesign-prd.md`.
- ✅ **Data & Jobs** view (`/tools/data-sync`): **Tabs** — **Data Status** vs **FEA Jobs**; Data Status uses a tighter enterprise layout (scoped header, numbered sections, data grids, demo dataset); Coker fixtures unchanged logically; FEA table in its own tab; equipment filter above tabs.
- ✅ **Alert Setting** tool (`Tool.key = alert_setting`, route **`/tools/alert-setting`**): equipment alert rules (parameters aligned with Coker **Data & Jobs** inputs/outputs), composable conditions, assignees, schedules, multi-rule CRUD, deleted history recover — **Coker 01** full UX; rules **persist in the browser** (`localStorage`) so every signed-in user on **this device** sees the same active/draft list; **Create alert** sheet — rules with assignees save as **active** so assignees see them immediately; owner-only rules stay **draft** until activated in **Edit**; **Edit** gates changes; **Test** sends a preview **`operational_alert`**. **Schedule** uses structured date/time pickers: `one_shot` → specific date + time; `recurring` → frequency (daily/weekly/monthly) + time-of-day + optional end date; `date_window` → start + end date/time range. **"Can request delete"** is shown only for `notify_only` and `comment_on_alert` assignees — hidden for `co_edit_rule`. Free-text "Cron or window description" and "Slope window note" inputs are removed. See `domain.ontology.yaml`.
- ✅ **What-If Scenario Tool — layout alignment (Jun 2026):** WIS uses `ToolPageShell` + `ToolPageHeader`, **Equipment** filter bar (label **Equipment**, summary **Active equipment**), scenario card grid, and inline scenario detail. Generic entry shows **all equipment** browse (no default Coker scenario). Equipment Home deep links set `preFilterEquipmentId` + optional scenario. See `.taskmaster/docs/wis-layout-alignment-prd.md` and `.taskmaster/docs/wis-tools-polish-prd.md`.
- ✅ **What-If published dashboards (May 2026):** Overview **Available Result Dashboards** binds to **published `WorkspaceDashboard`** rows for the scenario's equipment (same list as Asset module Equipment Home) via `getWhatIfResultDashboardsForScenario`; cards open Equipment Home with `?openDashboard=`; runs snapshot `selectedDashboardIds`. See `domain.ontology.yaml` and `.taskmaster/docs/whatif-published-dashboards-layers.md`.
- ✅ WIS-to-dashboard flow (viewed data selection, compare with live).
- ✅ Documents Tool view (grid/list, category + asset filters, search, share/download interactions).
- ✅ WIS report metadata integration into Documents store.
- ✅ AI feature wiring for key surfaced modules (Feature 1, 3, 4, 5, 6, 7, 8).
- 🔄 Legacy What-If modal flow still mounted alongside centralized WIS tool.
- 🔄 Sidebar entries exist but no built views: Shift Log, Chat, Favorite Dashboard panel stubs. **Comms → Notifications** (`/comms/alerts`): inbox with All/Unread, **Archived** tab, archive/delete/restore backed by **`Notification.archivedAt`** in Postgres when using the workspace API (and in-memory when not). **Settings:** rail panel + **`/settings`** full page — in-app settings (appearance, language & region, workspace defaults, tools & exports, privacy, about) — **not persisted**; legacy **General / Integrations / Alert Settings** labels removed.
- 🔄 All functional data remains mock/static (no backend/API persistence).
- ✅ Equipment Home Page implemented as the default equipment entry point from Asset hierarchy.
- ✅ Dashboard Popup implemented in read-only mode with Viewed Data + report/share actions.
- ✅ Tools Section implemented on Equipment Home Page (Data & Jobs, Shift Log placeholder, Documents, What-If Scenario).
- ✅ **Dashboard** module (code: Workspace) stub implemented as the "Edit Dashboards" navigation target.
- ✅ What-If History -> "View results" / result **View Data** routes back to Equipment Home for that run's equipment; viewed-data run is queued for overlay when the user opens a dashboard popup (no forced popup or mystery dashboard).
- ✅ Site/Plant dashboard stack tab clicks now route to Equipment Home popup (not legacy equipment dashboard screen).
- ✅ Site/Plant dashboard stack equipment-name labels now route to Equipment Home page and are visually clickable link controls.
- 🚧 **Dashboard module (Workspace) — full content management (in design)**: per-user dashboards, nested folders, search/filter/sort, drafts vs. published lifecycle, popup viewer with always-active toolbar (**Comments · Publish/Unpublish · Edit · Share**) and unified access-request dialog, Workspace-native editor reusing Widget Library, sharing with named users and copyable links with permission levels (view/comment/edit), Shared-with-me, permission requests with optional requester note.
- 🚧 **Dashboard popup toolbar & access requests (May 2026 — in design)**: Publish/Unpublish visible to all popup viewers (between Comments and Edit); Comments/Edit/Publish/Share never disabled — insufficient permission opens request dialog (`comment` or `edit`; Publish/Share → edit). Spec: `domain.ontology.yaml`, `.taskmaster/docs/dashboard-toolbar-access-layers.md`.
- ✅ **Comms Module Notifications** (`/comms/alerts`): list for `dashboard_shared_with_you`, `dashboard_first_view`, `permission_request_received`, `permission_request_resolved`, `operational_alert`, and placeholders for `edit_lock_blocked`; **Inbox** (All / Unread) vs **Archived**; archive / restore / delete apply **immediately** in the UI, then sync via **`PATCH`/`DELETE`** on `/api/workspace/notifications/:id` when using the workspace API (requires DB migration for `archivedAt`); unread badge + header bell for non-archived items; bell dropdown + **ephemeral previews** (short TTL).
- 🚧 **Equipment Home Page deep-linking & multi-tab (in design)**: `Edit Dashboards` button now navigates to **Dashboard** (`/dashboard`) pre-scoped to the originating equipment; Dashboard Popup gains `Open in new tab`; Full-Screen Dashboard Viewer route renders chromeless; `open elsewhere` indicator on dashboard tabs uses `BroadcastChannel` cross-tab signalling.
- ✅ **App Router — main shell URL parity (May 2026):** `/` → `/home`; `/assets/site|plant|equipment/...`; `/tools/data-sync`, `/tools/what-if`, `/tools/documents`, `/tools/alert-setting`; query params for equipment pre-filter and equipment-home popup/tab. Dashboard (`/dashboard/*`), full-screen viewer, share link, and Comms notifications route unchanged (`/comms/alerts` unless aliased).
- ✅ **Tools module page chrome (May 2026):** **Data & Jobs**, **Documents**, **What-If Scenario**, and **Alert Setting** share one layout pattern (`components/tools/tool-page-layout.tsx`: breadcrumb **Tools** → tool name, shared `h1` + description styling, optional route path chip, gradient page shell). The first breadcrumb still goes to `/tools/data-sync` and uses the same Zustand updates as the previous inline “Tools” control.
- ✅ **Tools module UI alignment (Jun 2026):** Data & Jobs, What-If, Documents, and Alert Setting share the **Equipment** filter bar (not "Equipment scope"), **Active equipment** summary, and third breadcrumb segment for the selected equipment. Alert Setting has no title icon. See `.taskmaster/docs/wis-tools-polish-prd.md`.

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
- **Data layer (current):** no production API; mock data in `lib/data.ts`, Workspace in **Zustand + `localStorage`**. **Target (initiative):** PostgreSQL + Prisma + server session auth — see **Cloud backend & auth (initiative)** and `prisma/schema.prisma`.

Notable installed-but-not-actively-used packages from audit: `@dnd-kit/*`, `cmdk`, `date-fns`, `react-day-picker`, `input-otp`, `embla-carousel-react`, `sonner` (in app views).

Note: `@dnd-kit/*` will be activated for the Workspace folder tree drag-and-drop and dashboard "Move to folder" interactions.

## Routes & Pages
The **main app shell** (Home, Site / Plant / Equipment Home, Tools) is URL-backed under `app/(main)/` with `MainRouteSync` keeping Zustand `currentView` / `currentPath` aligned to the address bar. **`/`** redirects to **`/home`**. Canonical path map: `.taskmaster/docs/module-url-parity.md`.

**Dashboard widget editing** is not routed through the main shell; it uses the App Router **Dashboard** module at `/dashboard/dashboard/[id]/edit`. The legacy `currentView: "equipment"` surface (in-shell equipment dashboard with tab strip and local grid) is **deprecated** and removed per Option A.

App Router pages (main shell + Workspace + Comms + viewer):

| Route | Purpose | Chrome |
|---|---|---|
| `/home` | Home (`HomeView`) | Sidebar + Header |
| `/assets/site/[siteId]` | Site Overview | Sidebar + Header |
| `/assets/plant/[siteId]/[unitId]` | **Unit Overview** (Plant Overview) — full P&ID overview card + collapsible unit context panel | Sidebar + Header |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` | Equipment Home (`?tab`, `?openDashboard`) | Sidebar + Header |
| `/tools/data-sync` | Data & Jobs — `DataSyncView` (`?equipment`) | Sidebar + Header |
| `/tools/what-if` | What-If Scenario tool | Sidebar + Header |
| `/tools/documents` | Documents tool (`?equipment`) | Sidebar + Header |
| `/tools/alert-setting` | **Alert Setting** — equipment alert rules (`?equipment`) | Sidebar + Header |
| `/dashboard` | Workspace Module main view (All Dashboards) | Sidebar + Header |
| `/dashboard/folder/[folderId]` | Folder-scoped Workspace view | Sidebar + Header |
| `/dashboard/shared` | Shared-with-me view | Sidebar + Header |
| `/dashboard/recent` | Recent dashboards (LRU, max 20) | Sidebar + Header |
| `/dashboard/trash` | Soft-deleted dashboards (cap 30 days) | Sidebar + Header |
| `/dashboard/dashboard/[dashboardId]/edit` | Workspace-native dashboard editor (Widget Library reuse) | Sidebar + Header |
| `/dashboards/[dashboardId]/full` | Full-Screen Dashboard Viewer (read-only) — opens in new tab | **No chrome** |
| `/share/[token]` | Share-link landing + identity-pick stub | Minimal chrome |
| `/comms/alerts` | Comms Module **Notifications** page (in-app feed; URL stable) | Sidebar + Header |

**Settings:** **module-rail panel** (`SettingsPanel` in `components/sidebar.tsx`) plus **`/settings`** (`SettingsAppView`) — same in-app preference **mock** sections; non-persistent until the deferred preferences epic (`UserApplicationPreference`).

Routing principles:
- **Dashboard / Workspace**, **main shell** (`/home`, `/assets/*`, `/tools/*`, `/settings`), share/viewer, and Comms **Notifications** (`/comms/alerts`) are URL-driven; deep links survive reload where encoded in the path or query string.
- Zustand remains the in-session source of truth for navigation and feature state; **`MainRouteSync`** hydrates it from the URL on main-shell routes.
- Cross-tab navigation (e.g. `Open in new tab`) relies on real URLs — same pattern across modules.

## Key Technical Decisions
- Default landing is **`/home`** (server redirect from `/`); Zustand `currentView` is synced from the pathname on main-shell routes via `MainRouteSync`.
- View routing for Home / Site / Plant / Equipment Home / Tools is **pathname-driven** under `app/(main)/*`, with the same Zustand slices for data and UI state as before.
- Zustand is the cross-view source of truth for navigation, WIS sessions, and saved documents.
- WIS v2 is centralized (`whatif-tool-view.tsx`); dashboard “Run WIS” navigates into the tool with preselected tab/context.
- WIS report generation writes to the same documents store with equipment-aware tagging.
- WIS execution model uses a 5-step visual progress simulation.
- **Legacy only:** the removed in-shell equipment dashboard shared the right column between "Equipment Information" and `ModuleLibrary` in edit mode; that pattern is not part of the single editor (Dashboard module + `DashboardEditor` only).
- Home recents/favorites are in-memory state (reset on hard refresh by design today).
- AI safety constraint: AI Summary content is mock/advisory and should avoid unsafe operational guidance.
- Strong reusable UI patterns identified in audit: `WidgetErrorBoundary`, seed hooks for store initialization, declarative default widget set/layout maps, two-layer sidebar architecture.
- **Equipment Home Page entry point**: navigating to an equipment from the asset hierarchy opens **`/assets/equipment/...`** (store `currentView: "equipment-home"` synced from URL). **Edit** uses the **Dashboard** module only: links go to `/dashboard` (filtered) or `/dashboard/dashboard/[id]/edit` — not to legacy in-shell equipment editor.
- **Dashboard Popup (Equipment Home)**: state lives in local `EquipmentHomeView` (`activePopupDashboardId`); the popup reuses `ResponsiveDashboardGrid` with `viewedDataIds` and equipment-scoped `scenarioRuns` so layout and Coker catalog tiles match the **Dashboard** module and full-screen viewer.
- **Cross-view auto-open behavior**: Site/Plant dashboard stack tab clicks set one-shot popup targeting (`equipmentHomeAutoOpenTab`) so Equipment Home opens directly into the selected read-only dashboard popup.
- **Equipment pre-filter for Tools**: when navigating from Equipment Home Page tool tiles, the target equipment `id` is written to a Zustand slice (`preFilterEquipmentId`) so the destination tool page can read and apply it on mount.
- **Data & Jobs filter**: `DataSyncView` accepts `preFilterEquipmentId` from Zustand to auto-select the equipment filter on entry (same mechanism; route key remains `data-sync`).
- **What-If tool equipment filter**: `WhatIfToolView` consumes `preFilterEquipmentId` on mount; generic entry resets to all-equipment browse. Insights rail no longer pre-selects `scenario-coke-drum`. Breadcrumb: Tools → What-If Scenario → equipment name when filtered.
- **Stack label navigation UX**: equipment labels in dashboard tab stacks are explicit link-style controls with dedicated click handling (separate from stack expand/collapse interaction).
- **Workspace identity (Workspace UI)**: **Production builds** (`NODE_ENV === 'production'`): effective user id follows the signed-in Auth.js session (`session.user.id` must match a seeded `ORG_USERS` id); **manual localStorage overrides are ignored**. **Development**: mock flows may still read/write `spm-one:current-user-id` when not in production. Directory lookups (`findOrgUserById`, Share typeahead) remain client-side against `ORG_USERS`. Server APIs enforce ownership/shares independently.
- **Workspace persistence**: **Signed-in users:** folders, dashboards, and shares are loaded from PostgreSQL via `/api/workspace/bootstrap` and mutated through `/api/workspace/*` (Zustand holds a client cache; localStorage does **not** store those collections — see persist v2 in `lib/workspace/store.ts`). **`pnpm db:seed`** upserts the deterministic **`WORKSPACE_SEED`** bundle (`lib/workspace/seed.ts` → `prisma/seed-workspace.ts`) plus **`lib/data.ts`** asset hierarchy so **equipment-a / equipment-b / equipment-c** exist and dashboard lists are populated. **Signed-out / failure fallback:** the same seed shapes hydrate the store from mock data. Debug **Reset Workspace** still reverts the client slice to `WORKSPACE_SEED`.
- **Dashboard Popup toolbar (May 2026)**: `components/workspace/dashboard-popup.tsx` shall show **Comments → Publish/Unpublish → Edit → Share** for all users; gate behavior via click handlers + `AccessRequestDialog` (new) calling `requestPermission({ requestedPermission, message })`. Owner-only publish/unpublish execution; Share dialog only when `edit` (or owner). Remove disabled Edit/Share and footer-only request buttons once migrated.
- **Dashboard module editor (sole authoring engine)**: `components/workspace/dashboard-editor.tsx` at `/dashboard/dashboard/[dashboardId]/edit` is the **only** surface for add/remove/drag/resize/save of widget layout. The legacy `equipment-dashboard.tsx` editor is **retired**; shared building blocks remain (`ModuleLibrary`, `layouts.ts` for seed/defaults, `WidgetViewResolver`). External widget drops: `react-grid-layout` `onDrop`; HTML5 payload `application/x-spm-widget` (JSON) from `ModuleLibrary`.
- **Coker parameter-driven widget model (May 2026):** Widget Library sidebar splits into **Parameters** section (`CokerParameter` entries from `lib/equipment-packs/coker-v1.ts`) and **Reference & Tools** section (`CokerReferenceWidgetDef` entries). Dragging a `CokerParameter` triggers a new `WidgetConfigPopup` (three steps: visual type picker → typed config form → name). Dragging a reference/tool widget places it directly. `GridWidget` shape evolves: new fields `parameterId`, `visualTypeId`, `config`; legacy fields `templateKey` / `options` kept read-only for backward compat. `CokerTemplateView` re-routes on `parameterId + visualTypeId`. `CatalogModuleLibrary` rewritten. New: `components/workspace/widget-config-popup.tsx` (creation popup), `components/workspace/widget-focus-overlay.tsx` (lightbox for view mode). `CatalogTemplateKind` gains `ovality_chart`, `damage_table`, `severity_table`, `crack_table`; deprecated kinds (`composite_kpi_strip`, `empty_state`, `multi_tab_panel`) kept only for backward compat rendering.
- **Widget focus/expand (view mode):** In `ResponsiveDashboardGrid` (read-only), hovering a tile shows a focus button. Clicking mounts `WidgetFocusOverlay` — a portal covering the grid viewport; shows same renderer at full size with extended detail (more rows, full chart range). Dismissed by × or backdrop. Not mounted in `DashboardEditor`.
- **Cross-tab open-state signalling**: `BroadcastChannel('spm-one:viewer-tabs')` with `localStorage` `storage`-event fallback; viewer tab broadcasts JOIN on mount, LEAVE on `pagehide`, heartbeat every 5s. Equipment Home Page derives `externalOpenTabCounts` from these signals and renders an indicator on each dashboard tab/card.
- **Routing strategy:** Workspace, Full-Screen Viewer, Share-link, Comms **Notifications**, and the **main shell** (Home, Assets, Tools) are URL-driven via App Router. Zustand `currentView` / `currentPath` stay the working navigation state and are hydrated from the URL on main-shell routes. Unauthenticated access to the main shell is blocked (redirect to `/login`).
- **Workspace module rail submenu** (UI: **Dashboard** module): cleaned to a single-level list — "All Dashboards", "Shared with me", "Recent", "Trash". No nested submenu permitted. Replaces previous "Favorite" / "Share with me" stubs.
- **Workspace in-page menu unification** (shown inside **Dashboard**): Workspace must render a single in-module navigation panel (no duplicate white + blue menus). The unified panel uses the dark-blue submenu visual style used across modules, while retaining all functional behavior currently provided by the white Workspace menu (locations, folder tree interactions, and badges/counters).
- **Canonical dashboard data source**: **`WorkspaceDashboard`** is the single source of truth for dashboard metadata. For authenticated sessions the authoritative rows live in **PostgreSQL** and are synced into `useWorkspaceStore`; unauthenticated clients use the same shapes from **`WORKSPACE_SEED`**. `lib/workspace-data.ts` provides the `EquipmentHomeDashCard` adapter type and bridge functions (`getPublishedDashboardsForEquipment`, `getDashboardById`, `getWorkspaceDashboardIdForTag`) that Asset and Home modules consume. The legacy `dashboardCards` static array is deprecated. Cross-tab presence and Site/Plant one-shot auto-open use `WorkspaceDashboard.id`. What-If result **View Data** navigates to Equipment Home only (no auto-open popup); `whatIfDashboardAutoSelectRunId` still primes Viewed Data when the user opens a dashboard.

## Known Tech Debt
Prioritized from audit:

1) High
- ~~URL-less navigation for Home / Site / Plant / Equipment Home / Tools~~ — **addressed** with `/home`, `/assets/*`, `/tools/*` + `MainRouteSync`. **Exception (resolved for editing):** dashboard authoring uses real URLs under `/dashboard/*` (Option A: single editor).
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

## What Needs Backend (initiative: cloud state + accounts)

This section is scoped to **(a)** server-persisted app state so any device sees the same data, **(b)** real sign-in (email/password + future OAuth), and **(c)** seed users aligned with `lib/workspace/identity.ts` `ORG_USERS`. It **does not** require replacing free-text mock strings in change log / activity / What-If display (explicitly deferred).

### Audit — backend capabilities required (only for this scope)

| Area | Today | Required |
|------|--------|----------|
| **Identity** | **Delivered:** Auth.js session + User table; production clients cannot spoof workspace user via localStorage; dev may use legacy storage when `NODE_ENV !== 'production'`. | OAuth providers optional later |
| **Workspace** | **Delivered (phase 1):** REST `/api/workspace/*` + client hydration; **seed** promotes **`WORKSPACE_SEED`** + asset hierarchy into Postgres via **`pnpm db:seed`**. Persist v2 excludes server-backed collections from localStorage. **Remaining:** some Comms/notifications flows may still read mock slices until fully wired (see initiative tasks). | CRUD API for **folders**, **dashboards** (incl. `widgets` JSON, `dashboardContext`, `knowledgePackVersion`), **shares**, **share links**, **comments**, **permission requests**, **notifications**; app-layer checks by `ownerUserId` / share grants |
| **Comms** | In-store notifications | Persist **Notification**; optional SSE/polling for unread; keep category semantics from `lib/workspace/types.ts` |
| **AuthZ** | Client-side permission helpers | Replicate **view < comment < edit** on the server for every mutating route; `product_team` gate for **ParameterRequest** queue |
| **Account lifecycle** | N/A (mock) | Sign-in, sign-out, **optional:** email verify, password reset, session expiry, **optional:** rate limits on auth routes |
| **Infra** | Vercel static+SSR | **PostgreSQL** (Vercel Postgres, Neon, Supabase, RDS, …), `DATABASE_URL`, migrations (`prisma migrate`), secrets in Vercel project settings |
| **Asset hierarchy** | **`lib/data.ts` + DB sync** — `pnpm db:seed` upserts `Site` / `Unit` / `Equipment` from the same tree (ids **equipment-a** / **equipment-b** / **equipment-c** for the three primary units). Placeholder equipment rows remain in JSON for UI density; functional surfaces use primary ids. | **Optional later:** CMS or multi-tenant admin if product needs editable hierarchy |
| **Recents / favorites (Home)** | In-memory / non-persisted in `useAppStore` | **User**-scoped recents + favorites in DB or user-preferences JSON column (post-MVP if timeboxed) |
| **What-If, Documents, Data sync, Change log UI text** | Mock / free-text | **Out of scope** for “first real login + workspace sync” unless explicitly added; no requirement to backfill free-text from `lib/data.ts` in this initiative |

### Manual setup (owner — you) — do when implementation starts

1. **Create a PostgreSQL database on Supabase** (product default for this initiative):  
   - Open [https://supabase.com](https://supabase.com) and sign up or log in.  
   - Click **New project**. Pick an **organization**, a **project name** (e.g. `spm-one-dev`), a **database password** (save it in a password manager — you cannot see it again in plain text easily). Choose a **region** close to you. Create the project and wait until the dashboard says the database is ready (usually 1–2 minutes).  
   - In the left sidebar: **Project Settings** (gear) → **Database**. Scroll to **Connection string**.  
   - For **`DATABASE_URL` in `.env`**, use the **Session pooler** URI (Supabase often labels it “Session mode” / pooler host such as `*.pooler.supabase.com`). **Do not** use the **Direct connection** host `db.<ref>.supabase.co:5432` for local dev or Vercel: it is often **IPv6-only**, which causes Prisma **P1001** (“Can’t reach database”) and breaks **login** on typical IPv4 networks. If the dashboard shows “Not IPv4 compatible”, that is the same issue.  
   - Paste the pooler URI into a text editor. Replace the placeholder password with your **database password**. The string must start with `postgresql://` or `postgres://`.  
   - Put that line in **`.env`** as `DATABASE_URL="..."` (see **`.env.example`**). The app validates this at startup and will error if a direct `db.*.supabase.co` URL is detected (override only with `SPM_ALLOW_SUPABASE_DIRECT=1` if you truly need it).  
   - When you deploy to Vercel (later): add the same variable name **`DATABASE_URL`** under **Project → Settings → Environment Variables** for **Production** (and **Preview** if you want preview deployments to hit a DB). Never commit `.env` to git.
2. **Apply migrations to Supabase:** The repo includes a **PostgreSQL** baseline migration (`prisma/migrations/*_postgresql_baseline/`). With **`DATABASE_URL`** set in `.env`, run **`pnpm exec prisma migrate deploy`** (or `pnpm db:deploy` if added to `package.json`) against your Supabase database. Use the same command in CI/Vercel after deploy. On a **fresh** empty database this creates all tables; if you ever need to wipe and recreate (dev only), use Supabase SQL or dashboard to drop the `public` schema objects — **never** do that on production without a backup.
3. **Auth secret:** set **`AUTH_SECRET`** (or provider-specific secrets) in Vercel for Auth.js — generate with `openssl rand -base64 32`.
4. **Seeded passwords + workspace data:** set **`SEED_DEFAULT_PASSWORD`** (and optionally per-user **`SEED_PASSWORD_*`** — see `.env.example`) in `.env`, then run **`pnpm db:seed`**. This loads **users**, **Site/Unit/Equipment** from **`lib/data.ts`**, and the full **Workspace** bundle (**folders, dashboards, shares**, plus seed rows for share links, comments, permission requests, notifications) from **`WORKSPACE_SEED`** via **`prisma/seed-workspace.ts`**. Re-run after schema changes or when you need to refresh demo data (upserts by deterministic ids). Plain passwords never go in git; `prisma/seed.ts` hashes with **bcryptjs** (same as Auth.js). **If dashboards are empty or “Equipment not found” appears when creating a dashboard,** the DB likely has no seed data — run **`pnpm db:seed`** against the same **`DATABASE_URL`** the app uses.
5. **CORS / cookies:** ensure session cookies are **Secure**, **HttpOnly**, **SameSite** appropriate to your domain (Vercel custom domain vs `*.vercel.app`). Set **`AUTH_URL`** to the canonical HTTPS origin in production. Optional tuning: **`AUTH_RATE_LIMIT_MAX`** / **`AUTH_RATE_LIMIT_WINDOW_SEC`** (defaults documented in `.env.example`) throttle POST **`/api/auth/*`** in Edge middleware; **`AUTH_REQUIRE_EMAIL_VERIFICATION=true`** only if you populate **`User.emailVerified`** (no outbound verification email is shipped yet).

### What stays mock for now (per product direction)

- **Change log, recent activity, What-If run display labels,** and similar **free-text** in `lib/data.ts` and fixtures: **do not change** in the first delivery; they remain UI mock until a later “audit / activity hardening” epic.
- **Cross-tab** “open elsewhere” can remain **BroadcastChannel**-based until server presence is prioritized.

## Cloud backend & auth (initiative) — requirements analysis & phased plan

**Goal:** production-quality **SaaS-style** auth and **one global source of truth** for Workspace data so **any device** signed in as the same user sees the same dashboards, folders, and sharing.

**Phases (recommended):**

1. **Foundation** — Prisma + PostgreSQL wired; `User` + `Session` + `Account` (Auth.js adapter); email/password **Credentials** provider; protected route layout; sign-in / sign-out pages; **seed** the nine `ORG_USERS`-aligned accounts (hashed passwords from env). **Manual:** create DB, set env vars, run migrate + seed. **Out:** no Zustand replacement yet (can dual-read in dev).
2. **Workspace API** — REST or **Server Actions** for folders + dashboards + widget JSON; migrate off `localStorage` workspace store for authenticated users; conflict strategy (last-write-wins or version column). **Manual:** data backfill from existing `localStorage` is optional; most users re-seed.
3. **Sharing & comms** — server persistence for `DashboardShare`, `ShareLink`, `PermissionRequest`, `Notification`; enforce permissions on every API. Link `/share/[token]` to real token lookup.
4. **Hardening** — rate limits (Upstash or Edge middleware), `emailVerified` policy, optional **OAuth** providers (Google) via `Account` table, audit logging for security-sensitive actions.
5. **Deferred** — asset hierarchy in DB, file uploads to S3, What-If + documents backends, replacing mock free-text — separate epics.

**Layer-by-layer implementation order (for engineers):**  
**DB** → **Prisma client** → **auth middleware** (Edge or Node) → **API / server actions** → **replace `useWorkspaceStore` hydration** (SSR + client invalidation) → **remove or gate mock user switcher** → **E2E tests** on auth + one dashboard save.  
Spaces for **you** are in **Manual setup** above and at the start of each phase (provision services, set secrets, run migrations).

`domain.ontology.yaml` and `prisma/schema.prisma` are the **structural** contract for this initiative; application code is updated only in follow-up tasks, not in the same commit as this documentation pass.

---

**Legacy / superseded (pre-initiative) bullet list** — the following are rolled into the table + phases above: generic “Dashboard CRUD,” “Auth,” and “Workspace module backend (Apr 27 2026 spec)” are **one program of work** with PostgreSQL as system of record; cross-tab presence and mock UI strings remain as previously documented in **What stays mock**.
