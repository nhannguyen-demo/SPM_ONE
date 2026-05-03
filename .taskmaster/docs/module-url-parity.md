# Module URL parity — canonical routes (May 2026)

This document is the **path map** for Taskmaster tag `module-url-parity`. All listed routes use the main shell (`Sidebar` + `Header` + `MainRouteSync`) under `app/(main)/`.

## Routes

| Path | View / component | Notes |
|------|------------------|--------|
| `/` | — | Server redirect → `/home` |
| `/home` | `HomeView` | Default landing after redirect |
| `/assets/site/[siteId]` | `SiteOverview` | `siteId` = e.g. `site-x` |
| `/assets/plant/[siteId]/[unitId]` | `PlantOverview` | `unitId` = process unit id |
| `/assets/equipment/[siteId]/[unitId]/[equipmentId]` | `EquipmentHomeView` | Optional query: `tab`, `openDashboard` (WorkspaceDashboard id for popup) |
| `/tools/data-sync` | `DataSyncView` (**Data & Jobs** in UI; code name unchanged) | Optional query: `equipment` = equipment id (pre-filter) |
| `/tools/what-if` | `WhatIfToolView` | — |
| `/tools/documents` | `DocumentsView` | Optional query: `equipment` |
| `/tools/alert-setting` | `AlertSettingView` (`components/views/alert-setting-view.tsx`) | Optional query: `equipment`; **Alert Setting** tool mock |
| `/settings` | `SettingsAppView` | In-app application settings (**mock**; no persistence) |

Existing URL-first modules (unchanged contract):

- `/dashboard/*` — Dashboard (Workspace) module  
- `/comms/alerts` — Notifications (in-app feed; URL label may stay `alerts`)
- `/dashboards/[dashboardId]/full` — Full-screen viewer  
- `/share/[token]` — Share link  

## Acceptance

- **No intentional visual or interaction redesign** — same components as before; routing and `router.push` / `MainRouteSync` bridge URLs to existing Zustand `currentView` + `currentPath`.
- **Browser history**: Back/forward between main-shell routes updates the address bar and restores the same screen (store synced from URL on load).
- **Deep links**: Reload on any main-shell URL above rehydrates navigation state via `parseMainShellRoute` + `applyParsedRoute`.

## Implementation pointers

- `lib/main-routes.ts` — builders + `parseMainShellRoute` + `fallbackMainRouteForModule` (module rail from `/dashboard` or `/comms`).
- `components/main-shell-with-sync.tsx` — chrome + What-If modals + `AISparkButton` (parity with former `app/page.tsx`).
- `components/main-route-sync.tsx` — `usePathname` + `useSearchParams` → store.
