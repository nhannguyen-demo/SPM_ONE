# PRD: What-If Tool — Published Result Dashboards (live from Asset module)

## Problem

The What-If Scenario tool Overview tab shows **Available Result Dashboards** as static text chips from `lib/data.ts` (`availableDashboards: string[]`). This diverges from the Asset module, where dashboards come from **published `WorkspaceDashboard`** records on Equipment Home. Engineers cannot open real dashboards from What-If Overview, and counts/labels drift when workspace data changes.

## Goal

Make **Available Result Dashboards** an active, equipment-scoped list of **published** dashboards — the same source and sort order as Equipment Home — with navigation into the Asset module to view each dashboard.

## Users

Integrity engineers using **Tools → What-If Scenario** for Coker 01 and HCU 01 scenarios.

## Requirements

### R1 — Data source

- For the selected `WhatIfScenario`, resolve dashboards via `getPublishedDashboardsForEquipment(scenario.equipmentId, workspaceDashboards)`.
- Filter: `lifecycleStatus === "published"`, `!deletedAt`, matching `equipmentId`.
- Sort: newest `publishedAt` (fallback `createdAt`) first — match `lib/workspace-data.ts`.

### R2 — Overview UI

- Replace non-interactive chips with a list/grid of published dashboards (name + optional metrics thumbnail pattern from Equipment Home if low-cost).
- **Dashboards Available** KPI uses live count.
- Empty state: "No published dashboards for this equipment" with link to Workspace / Equipment Home edit dashboards CTA (copy TBD).
- Each item opens the dashboard in Asset context (preferred: Equipment Home + dashboard popup via `setCurrentPath` + navigation; acceptable: full-screen viewer route).

### R3 — Run configuration

- On **Configure & Run**, `WhatIfRunSession` stores `selectedDashboardIds` for all published dashboards on that equipment at run time (unless product adds explicit picker later).
- Deprecate `scenario.availableDashboards` in mock data and UI.

### R4 — Scenarios in scope

- **Coker 01** (`equipment-a`, `scenario-coke-drum`)
- **HCU 01** (`equipment-b`, `scenario-hcu`)

### R5 — Non-goals

- No backend What-If API changes.
- No new Prisma migration required for v1 (client-only + ontology documentation).
- Do not change run progress animation, results table layout, or Viewed Data overlay logic beyond id/name alignment.

## Technical notes

- Primary files: `components/views/whatif-tool-view.tsx`, `lib/data.ts`, `lib/store.ts`, `lib/workspace-data.ts`, `components/modals/what-if-scenario.tsx`, `components/views/equipment-home.tsx` (reference only).
- Ontology: `WhatIfScenario` has no `availableDashboards` field; `WhatIfRunSession.selectedDashboardIds` added.

## Success metrics

- Overview dashboard list matches Equipment Home for same equipment after publish/unpublish in Workspace.
- Zero references to `availableDashboards` in What-If UI after implementation.

## Dependencies

- `useWorkspaceStore` dashboards hydrated (seed or API) — same as Equipment Home today.
