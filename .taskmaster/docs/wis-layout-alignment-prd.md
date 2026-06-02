# PRD: What-If Tool Layout Redesign & Tools UI Alignment

## Background

The What-If Scenario Tool (`/tools/what-if`, `components/views/whatif-tool-view.tsx`) currently uses a
custom left-hand sidebar panel (`ScenarioSidebarList`) to let users choose an equipment/scenario. This
pattern is bulky, consumes ~288px of horizontal space, and is **inconsistent** with every other tool page
in the system (Data & Jobs, Alert Setting, Documents), all of which use `ToolPageShell` + `ToolPageHeader`
with equipment selection via a filter bar or inline select.

Additionally, a cross-tool UI audit revealed that equipment selection is placed inconsistently:
- **Data & Jobs**: dedicated Equipment scope filter bar below `ToolPageHeader` (gold standard)
- **Alert Setting**: equipment `Select` in the `trailing` prop of `ToolPageHeader` (different placement)
- **Documents**: asset `<select>` inline in a filter bar below `ToolPageHeader` (close to gold standard)
- **What-If**: bulky left sidebar (completely different pattern)

This PRD defines the changes required to:
1. Remove the What-If left sidebar and replace equipment/scenario selection with the Data & Jobs filter bar pattern.
2. Align Alert Setting's equipment selector to the filter bar below the header.
3. Ensure all four tool pages use `ToolPageShell` + `ToolPageHeader` with consistent equipment scope filter bars.

## Domain Rules (from domain.ontology.yaml)

- `WhatIfScenario` is equipment-scoped (`equipmentId` FK). Multiple scenarios can exist per equipment.
- `preFilterEquipmentId` Zustand state (already used by Data & Jobs, Documents, Alert Setting) is consumed
  on mount to pre-apply the equipment filter when navigating from Equipment Home Page.
- All tool pages MUST use `ToolPageShell` > `ToolPageHeader` > equipment scope filter bar > content.
- The Equipment scope filter bar pattern: labeled dropdown (shadcn `Select` or native `<select>`),
  `All equipment` default, per-equipment options, optional Reset button when filtered.

## Layers Needing Updates

### Task 1 — WIS Layout: Remove sidebar, add equipment scope filter bar
**Priority: High**

Files:
- `components/views/whatif-tool-view.tsx` — primary change
- `lib/store.ts` — add `whatIfEquipmentFilter: string | null` + setter

Changes:
1. **Remove `ScenarioSidebarList`** component entirely (the `w-72 shrink-0 flex-col border-r border-border bg-card/40` panel).
2. **Add `whatIfEquipmentFilter` Zustand state** (`string | null`, default `null`). Add `setWhatIfEquipmentFilter` action.
3. **On mount**, consume `preFilterEquipmentId` to set `whatIfEquipmentFilter` (then clear it), matching the Data & Jobs pattern.
4. **Add Equipment scope filter bar** below `ToolPageHeader`, above scenario content:
   - Same visual style as Data & Jobs: card-like row with `Filter` icon, label "Equipment scope", a `<select>` or shadcn `Select` dropdown
   - Options: `All equipment` (value = `null`/`"all"`) + one entry per unique equipment in `whatIfScenarios`
   - When filtered: show `X Reset filter` inline button
   - Active scope summary: "Active scope: [equipment name]" or "Active scope: All equipment"
5. **Replace scenario list from sidebar → scenario cards/list in main content**:
   - Below the filter bar, display `WhatIfScenario` cards filtered by `whatIfEquipmentFilter`
   - If `whatIfEquipmentFilter` is set, show only scenarios for that equipment
   - If `"all"`, show all scenarios grouped or flat
   - Each scenario card: equipment name + site/plant breadcrumb + scenario name + last run status badge + run count
   - Card click sets `whatIfSelectedScenarioId` and switches to scenario detail view
6. **Scenario detail view**: rendered below/after scenario cards when `whatIfSelectedScenarioId` is set
   - Keep Back button / breadcrumb to return to scenario card list
   - Preserve all existing tabs: Overview, Configure & Run, History, Run Progress, Results
7. **Wrap root `WhatIfToolView` in `ToolPageShell`** with `ToolPageHeader` (title "What-If Scenario", breadcrumb Tools → What-If Scenario).
8. Remove the WhatIfToolView custom header/breadcrumb block that was inside the flex container.

Acceptance criteria:
- No left sidebar; the full page width is used for content.
- Equipment scope filter bar visually matches Data & Jobs filter bar.
- `preFilterEquipmentId` pre-selects equipment on navigation from Equipment Home.
- All scenario detail panels (Overview, Configure & Run, History, Results, Run Progress) work correctly.
- Breadcrumb shows "Tools > What-If Scenario > [Equipment Name]" when a scenario is active.

### Task 2 — Alert Setting: Move equipment selector to filter bar
**Priority: Medium**

Files:
- `components/views/alert-setting-view.tsx`

Changes:
1. Remove the `trailing` prop equipment `Select` from `ToolPageHeader`.
2. Add an Equipment scope filter bar below `ToolPageHeader` (same pattern as Data & Jobs and post-Task-1 What-If):
   - `Filter` icon + "Equipment scope" label + shadcn `Select` dropdown
   - Options: All equipment + individual equipment options (already exists as `equipOptions`)
   - When an equipment is selected: show active scope summary
   - Remove `trailing` from `ToolPageHeader` call
3. The `ToolPageHeader` `description` may reference the selected equipment name instead of hard-coding "Coker 01".

Acceptance criteria:
- Equipment selector appears below the `ToolPageHeader` heading block, not in the header trailing area.
- Same visual styling as the Data & Jobs equipment scope filter bar.
- Pre-filter from `preFilterEquipmentId` still works.
- "Coming soon" and "Equipment not supported" states still function for non-Coker equipment.

### Task 3 — Documents: Minor filter bar visual alignment (optional / low priority)
**Priority: Low**

Files:
- `components/views/documents-view.tsx`

Changes:
- The existing filter bar already uses the same card-like row as Data & Jobs. Confirm the asset `<select>` filter is labeled with a `Filter` icon and "Asset" or "Equipment scope" label, consistent with Data & Jobs terminology.
- Minor: If the label is absent, add a `Filter` icon + label before the asset `<select>`.

Acceptance criteria:
- Documents filter bar visually similar to Data & Jobs filter bar (icon + label + select).

### Task 4 — Domain docs + PROJECT.md (already done in pre-task update)
**Priority: Done** — Captured in domain.ontology.yaml and PROJECT.md.

## Technical Notes

- `whatIfScenarios` in `lib/data.ts` already has `equipmentId` and `equipmentName` fields.
- Use `equipmentName` for display and `equipmentId` for filter matching (consistent with `whatIfScenarios` shape).
- The scenario card back-button/navigation state: use a local component state `selectedScenarioId | null` rather than relying solely on the Zustand slice for "in-list vs in-detail" mode — this gives cleaner back-navigation without affecting external navigation.
- `whatIfSelectedScenarioId` Zustand slice is preserved for cross-module navigation (from Equipment Home "Run WIS" tiles).
- The `ScenarioSidebarList` component can be deleted; its `search` state is optionally relocated to the main content area as a search input above the scenario cards.
- The `WhatIfToolView` root layout changes from `flex min-h-0 min-w-0 flex-1 overflow-hidden` (side-by-side) to the standard `ToolPageShell` single-column layout.

## Out of Scope
- Adding new scenarios or changing `whatIfScenarios` data.
- Changing the scenario detail panel content (Configure & Run, History, Results).
- Backend persistence for WIS.
- Changing the breadcrumb navigation behavior for other modules.
