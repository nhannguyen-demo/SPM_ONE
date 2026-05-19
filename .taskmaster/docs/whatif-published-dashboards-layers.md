# What-If — published result dashboards (Taskmaster reference)

**Tag:** `whatif-published-dashboards-may2026` · Product rules: `domain.ontology.yaml` (May 2026), `PROJECT.md`, bridge: `lib/workspace-data.ts`.

## Product intent

| Today (mock) | Target |
|--------------|--------|
| Overview **Available Result Dashboards** renders `whatIfScenarios[].availableDashboards` (static display names). | Same section lists **published** `WorkspaceDashboard` records for `scenario.equipmentId` — identical filter/sort as **Equipment Home** (`getPublishedDashboardsForEquipment`). |
| Chips are non-interactive labels. | Each row/card is **active**: open dashboard on Equipment Home (popup) or Full-Screen Viewer; empty state when none published. |
| **Dashboards Available** count uses `availableDashboards.length`. | Count uses live published dashboard list length. |
| `ConfigureRunPanel` sets `selectedDashboards: scenario.availableDashboards` (names). | Snapshot `selectedDashboardIds` (workspace dashboard ids) for all published dashboards on that equipment at run time (or explicit multi-select if product adds it later). |

**Out of scope (this epic):** server-side What-If compute, new Prisma fields beyond documenting `selectedDashboardIds`, replacing mock run history free-text.

## Layers (ordered)

1. **Domain / product docs** — `WhatIfScenario` has no static dashboard catalog; `WhatIfRunSession.selectedDashboardIds`; business rules for Overview binding. ✅ Spec in `domain.ontology.yaml`, `PROJECT.md`, this file.
2. **Mock data cleanup** — Deprecate then remove `availableDashboards` from `WhatIfScenarioDefinition` and `whatIfScenarios[]` in `lib/data.ts`; update `AUDIT.md` WhatIfScenarioDefinition table.
3. **Workspace bridge** — Reuse `getPublishedDashboardsForEquipment(equipmentId, useWorkspaceStore.dashboards)`; optional thin helper `getWhatIfResultDashboardsForScenario(scenarioId)` in `lib/workspace-data.ts` or `components/views/whatif-tool/shared.tsx`.
4. **Overview UI** — `ScenarioMainPanel` Overview tab: replace chip list with `EquipmentHomeDashCard`-style rows or compact cards; wire `router.push` + `setCurrentPath` + open popup pattern from Equipment Home; empty + loading states.
5. **Run session model** — Extend `WhatIfRunSession` in `lib/store.ts`: `selectedDashboardIds: string[]` (keep `selectedDashboards` as derived display names during migration, or rename in one pass); `ConfigureRunPanel.handleRun` snapshots published ids; align `mockWhatIfRunSessions` in `lib/data.ts`.
6. **Legacy modal + equipment entry** — `components/modals/what-if-scenario.tsx` and Equipment Home What-If tile: resolve dashboard by published list, not `availableDashboards[0]`.
7. **QA / docs** — Manual matrix: Coker 01 vs HCU 01; publish/unpublish dashboard in Workspace → What-If Overview updates; Compare Data / Viewed Data still works with workspace ids.

## Taskmaster sequencing

**2 → 3 → 4 → 5 → 6 → 7** (layer 1 done with spec PR).

## Acceptance criteria

- Selecting **Coker 01** scenario shows the same dashboard **names** (and count) as Equipment Home for `equipment-a` when workspace seed is loaded.
- Unpublishing a dashboard in Workspace removes it from What-If Overview without code deploy.
- Clicking a dashboard in Overview opens that dashboard in Asset context (Equipment Home popup or documented alternative).
- No user-visible string contains a static `availableDashboards` list after layer 2–4 ship.
