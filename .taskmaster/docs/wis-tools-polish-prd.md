# PRD: Tools Module Polish — Labels, Breadcrumbs, WIS Default Entry

## Background

Follow-up to the Jun 2026 WIS layout alignment. Four refinements:

1. **What-If default entry:** Users navigating to `/tools/what-if` from the module rail saw Coker 01 scenario detail instead of the all-equipment scenario card grid. Root cause: Insights panel set `whatIfSelectedScenarioId("scenario-coke-drum")` on every What-If click; stale Zustand scenario selection was not cleared on generic entry.

2. **Filter bar copy:** Rename **Equipment scope** → **Equipment** and **Active scope** → **Active equipment** on all tool filter bars.

3. **Alert Setting title:** Remove the Siren `titleAdornment` from `ToolPageHeader`.

4. **Breadcrumb parity:** What-If already showed a third breadcrumb segment for equipment; other tools did not. All four tools SHALL show **Tools → {Tool} → {Equipment}** when a specific equipment is active in the filter.

## Requirements

### R1 — WIS generic entry = all equipment browse
- Insights `handleWhatIfClick`: `setWhatIfSelectedScenarioId(null)` (do not set `scenario-coke-drum`).
- `WhatIfToolView` mount: if `preFilterEquipmentId` is set, apply equipment filter and consume it; **else** reset `whatIfSelectedScenarioId` and `whatIfEquipmentFilter` to null.
- `MainRouteSync` for `whatIfTool`: do **not** clear `preFilterEquipmentId` before the view consumes it.
- Equipment Home What-If tile and popup “Run history”: set `preFilterEquipmentId(equipment.id)` alongside scenario selection.

### R2 — Filter bar labels (all tools)
- Left label: **Equipment**
- Right summary: **Active equipment:** {name | All equipment}

### R3 — Alert Setting header
- Remove `titleAdornment={<Siren ... />}` from `ToolPageHeader`.

### R4 — Breadcrumb equipment segment
| Tool | Third segment when |
|------|-------------------|
| Data & Jobs | `filterAsset !== "all"` |
| What-If | equipment filter set OR scenario open (equipment name) |
| Documents | `assetFilter` is `equip-{id}` |
| Alert Setting | always (single equipment always selected) |

## Layers

| Layer | Files | Change |
|-------|-------|--------|
| Navigation / shell | `components/sidebar.tsx`, `components/main-route-sync.tsx` | Clear scenario on rail click; preserve preFilter for WIS route |
| Equipment Home | `components/views/equipment-home.tsx` | preFilter on What-If navigation |
| Views | `whatif-tool-view.tsx`, `data-sync.tsx`, `alert-setting-view.tsx`, `documents-view.tsx` | Labels, breadcrumbs, mount reset |
| State | `lib/store.ts` | (no change required if mount reset suffices) |
| Domain docs | `domain.ontology.yaml`, `PROJECT.md` | Rules + build state |

## Out of scope
- URL query `?equipment=` for What-If (future)
- Extracting shared `ToolEquipmentFilterBar` component (optional later)
