# PRD: Unit Overview — Full P&ID Dashboard & Collapsible Context Panel

**Date:** June 2026  
**Tag:** `unit-overview-full-pid-jun2026`  
**Domain:** `domain.ontology.yaml` (`UnitOverviewView`), `PROJECT.md`  
**Primary UI:** `components/views/plant-overview.tsx`  
**Static asset:** `public/images/pid-diagram.jpg`

## Problem

On the Asset module **Unit** level screen (e.g. Unit 2006 - DCU), the **Overview Dashboard** card splits the body into a left column of placeholder charts/gauges and a right P&ID image. Product wants the overview to be **P&ID-first**: the diagram occupies the **entire** dashboard card body. Separately, the fixed right column (AI Health Summary, unit information, unit documents) always consumes horizontal space; engineers need it **collapsible** so the P&ID and dashboard stacks can use full width when desired.

## Goals

1. **Full-panel P&ID:** Remove the left mock-stats column inside the overview dashboard card. The card body is only the P&ID image (`/images/pid-diagram.jpg`), edge-to-edge within the card, with existing “On” indicator and Feature 5 anomaly overlay preserved.
2. **Collapsible Unit Context Panel:** The right sidebar (`w-72`, AI summary + Plant/Unit Information + documents) can be collapsed and reopened without route change.
3. **Consistent collapse UX:** Use the same control pattern as the module **contextual sidebar** — `PanelLeftClose` in the panel header to collapse; when collapsed, show a reopen control on the right edge (visually aligned with module panel behavior).
4. **All Units:** Behavior is identical for every Unit route (`unit-2006-dcu`, `unit-2007-hcu`, `unit-2008-hydrogen`, etc.) — no DCU-only fork.
5. **Preserve existing flows:** Dashboard tab stacks, expand/maximize overview card, navigation to Equipment Home + popup auto-open, and `getPublishedDashboardsForEquipment` wiring remain unchanged.

## Non-goals

- Replacing the static JPEG with unit-specific P&ID assets per Unit (future CMS/assets epic).
- Collapsible **Site** Overview right panel (unless follow-up epic).
- Equipment Home Page layout changes (no unit context panel there).
- Backend persistence of `contextPanelOpen` (client session only for v1).
- Changing P&ID image file content (still `pid-diagram.jpg`).

## User stories

- As an **integrity engineer** on Unit 2006 - DCU, I see the P&ID diagram filling the overview dashboard so I can read the process flow without distraction from placeholder charts.
- As a user on any Unit overview, I collapse the AI/info/docs panel to give the main column more width, then reopen it when I need documents or the health summary.
- As a user who maximizes the overview dashboard, the bottom dashboard stack behavior stays the same as today.

## Acceptance criteria

- [ ] Overview dashboard card body has **no** left `w-1/3` chart column (`MiniPieChart`, `MiniBarChart`, placeholder bars).
- [ ] P&ID `<img src="/images/pid-diagram.jpg" />` fills the card content area (`object-contain`, relative container).
- [ ] `PIDAnomalyOverlay` still renders when Feature 5 is enabled.
- [ ] Right **Unit Context Panel** collapses via header control matching module sidebar (`PanelLeftClose`, accessible label).
- [ ] Collapsed state shows a reopen control; clicking restores panel at `w-72` (or equivalent).
- [ ] Collapse works on **HCU** and **Hydrogen** unit URLs, not only DCU.
- [ ] `dashboardExpanded` / maximize still hides context panel per current behavior; exiting expand does not break reopen.
- [ ] No regression: dashboard tab stack click → Equipment Home + popup; equipment name → Equipment Home without popup.

## Technical notes

- Ontology: non-persisted `UnitOverviewView` with `contextPanelOpen` (default true).
- Prefer local `useState` in `plant-overview.tsx` for v1; optional Zustand slice if Site parity later.
- Consider extracting `UnitContextPanel` subcomponent + shared `CollapsibleContextPanel` shell if Site Overview follows.
- Remove unused imports (`MiniPieChart`, `MiniBarChart`) from `plant-overview.tsx` after layout change.
- Update `components/ai/feature3-health-summary.tsx` file comment if panel structure changes.

## Test matrix

| Unit | URL segment | P&ID full width | Panel collapse/reopen | Tab stack → EHP popup |
|------|-------------|-----------------|-------------------------|------------------------|
| DCU | `unit-2006-dcu` | ✓ | ✓ | ✓ |
| HCU | `unit-2007-hcu` | ✓ | ✓ | ✓ |
| Hydrogen | `unit-2008-hydrogen` | ✓ | ✓ | ✓ |
