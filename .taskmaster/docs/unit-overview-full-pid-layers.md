# Unit Overview — full P&ID & collapsible context panel (Taskmaster reference)

**Tag:** `unit-overview-full-pid-jun2026` · Product rules: `domain.ontology.yaml` (`UnitOverviewView`), `PROJECT.md`, PRD: `unit-overview-full-pid-prd.md`.

## Product intent

| Today | Target |
|-------|--------|
| Overview dashboard card = left mock charts + right P&ID (~1/3 + ~2/3). | Overview dashboard card = **P&ID only**, full card body. |
| Right panel always visible (`w-72`) unless `dashboardExpanded`. | Right **Unit Context Panel** user-collapsible + reopen; same `PanelLeftClose` pattern as module sidebar. |
| Image `/images/pid-diagram.jpg` on right portion only. | Same image, full panel. |

**Out of scope:** per-unit P&ID assets, Site Overview panel parity, Equipment Home, server persistence of panel state.

## Layers (ordered)

| # | Layer | Scope | Key files |
|---|--------|--------|-----------|
| 1 | **Domain / product docs** | `UnitOverviewView`, business rules for full P&ID + collapsible panel | `domain.ontology.yaml`, `PROJECT.md`, this file, PRD | ✅ Spec |
| 2 | **View layout — P&ID full bleed** | Remove left stats grid; single flex child for diagram + overlays | `components/views/plant-overview.tsx` |
| 3 | **Collapsible Unit Context Panel** | `contextPanelOpen` state, header close, edge reopen, width transition | `plant-overview.tsx`; optional `components/asset/unit-context-panel.tsx` |
| 4 | **Shared collapse affordance** | Reuse `PanelLeftClose` + button classes from `components/sidebar.tsx` `ContextualPanel` (extract tiny shared control if duplication > ~15 lines) | `plant-overview.tsx` or `components/ui/panel-collapse-trigger.tsx` |
| 5 | **AI / feature overlays** | Confirm `PIDAnomalyOverlay` + `AIHealthSummaryCard` still mount correctly | `feature5-pid-anomaly.tsx`, `feature3-health-summary.tsx` |
| 6 | **Store (optional)** | Only if product wants panel state across Unit navigations: `unitContextPanelOpen` in `lib/store.ts` | `lib/store.ts` — defer unless requested |
| 7 | **Docs / static assets** | `public/images/README.txt` one-line note (P&ID fills unit overview card) | `README.txt` |
| 8 | **QA / regression** | Manual matrix: 3 units, expand mode, tab stack navigation | PRD test matrix |

## Taskmaster sequencing

**1 → 2 → 3 → 4 → 5 → 7 → 8** (layer 6 optional spike).

## Dependencies

- None on backend/Prisma.
- No change to `lib/data.ts` unit list or `WorkspaceDashboard` adapters.

## Acceptance criteria (summary)

- P&ID-only overview card on `/assets/plant/site-x/unit-2006-dcu` (and HCU, Hydrogen).
- Context panel collapses/reopens with module-sidebar-like control.
- Feature 5 overlay and dashboard tab stacks unchanged.
