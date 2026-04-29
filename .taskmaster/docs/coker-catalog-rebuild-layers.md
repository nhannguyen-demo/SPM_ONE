# Coker catalog rebuild — layers and update order

Companion to `scripts/prd.txt` (req-engine PRD). Use as Taskmaster scope hints and execution order.

## Layers (what must change)

1. **Domain & types** — `lib/workspace/types.ts`, `Equipment` mock shape: `equipmentTypeKey`, `parameterAddonKeys`; `WorkspaceDashboard.widgets[]` → `templateKey`, `options`, `displayTitle`, `packVersion`; Zod or TS types for `CatalogWidgetInstance`.
2. **Pack data (code-as-config)** — `lib/equipment-packs/` (or similar): `EquipmentKnowledgePack` metadata, `ParameterFamily` rows, `CatalogWidgetTemplate` registry for Coker v1; reference R1–R6 mapping; semver string.
3. **Mock data binders** — per-template data functions (or one resolver by `templateKey`) feeding charts/tables/heatmaps from static Coker-like fixtures until API exists.
4. **Theming** — `Coker` reference theme: tokens in CSS or Tailwind layer; card/chart/table chrome shared by all Coker templates.
5. **Template renderers** — `components/dashboard/templates/` (suggested): one module per `kind` or per major template; `TemplateRenderer` switch on `templateKey`; engineering visuals (heatmap, unwrapped map, 3D schematic) isolated for QA against images.
6. **Widget library UI** — `ModuleLibrary` / `components/module-library.tsx`: load from pack; four categories; search; thumbnails; "Request new parameter" entry; hide non-matching `equipmentTypeKey`.
7. **Editor** — `dashboard-editor.tsx`: dashboard **context** strip (time/cycle); drag payload from catalog; **properties** panel for options + title; min/max from template; save/load new shape; **duplicate** to same-type equipment only.
8. **Read-only surfaces** — `read-only-grid.tsx`, Equipment Home popup, `/dashboards/[id]/full`: use same renderers; **legacy adapter** from old `viewType` widgets for one release.
9. **Export** — print stylesheet, optional "Export PDF" from viewer; no app chrome; page-break rules for large widgets.
10. **ParameterRequest** — Zustand slice or small store: CRUD; **product_team** / admin list view; submit form; no share-link exposure.
11. **Seeds & migration** — `lib/workspace/seed.ts`: new default widgets for Coker tabs using template keys; migration helper old → new on first open (optional).
12. **QA** — acceptance checklist per R1–R6 screens vs. reference images; PDF spot-check.

## Layer-by-layer order (recommended)

| Phase | Layers | Outcome |
| --- | --- | --- |
| A | 1, 2, 3 | Types + pack JSON/TS + mock binders; Coker v1 template keys addressable with fake data |
| B | 4, 5 | Theme + renderers; one end-to-end template in editor and viewer |
| C | 6, 7 | Library + editor integrated; context bar; save new widget shape |
| D | 8 | Full parity on popup + full page; legacy adapter |
| E | 9 | Print/PDF |
| F | 10 | ParameterRequest |
| G | 11, 12 | Seeds, migration, QA sign-off |

## Taskmaster

Parse PRD with **append** so existing tasks are preserved: `parse_prd` with `input` = project `scripts/prd.txt`, `append: true`, `tag: master`, `numTasks` ≈ 28–32.
