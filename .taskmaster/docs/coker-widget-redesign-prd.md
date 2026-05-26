# PRD: Coker Widget Redesign — Parameter-Driven Model (May 2026)

## Overview

Redesign the Coker dashboard widget system from a flat template-key catalog into a
structured **Parameter → Visual Type → Widget** model. Users drag a named engineering
parameter onto the dashboard grid, choose a visual type via a multi-step popup, configure
options, and name the widget. Read-only surfaces gain a focus/expand lightbox per tile.
The redesign must preserve backward compatibility with existing `templateKey`-based widget
rows while all new widget creation uses the new `parameterId + visualTypeId + config` shape.

---

## 1. Domain Model Changes

### 1.1 New entity: `CokerParameter`
Defined in `lib/equipment-packs/coker-v1.ts` and typed in `lib/equipment-packs/types.ts`.

**13 Coker parameters:**

| Key | Display Name | Type | Unit | Library Section |
|-----|-------------|------|------|-----------------|
| `temperature` | Temperature | input | °C | Operational Inputs |
| `pressure` | Pressure | input | Barg | Operational Inputs |
| `coke_level` | Coke Level | input | % | Operational Inputs |
| `steam_rate` | Steam Rate | input | t/h | Operational Inputs |
| `flow_rate` | Flow Rate | input | m³/h | Operational Inputs |
| `bulging` | Bulging | input | — | Inspection |
| `fatigue_damage` | Fatigue Damage | output | % | Analysis Outputs |
| `stress` | Stress | output | MPa | Analysis Outputs |
| `remaining_life` | Remaining Life | output | years | Analysis Outputs |
| `pslf` | PSLF | output | — | Analysis Outputs |
| `ovality` | Ovality | output | % | Analysis Outputs |
| `displacement` | Displacement | output | m | Analysis Outputs |
| `crack` | Crack | output | — | Analysis Outputs |

Each parameter declares `validVisualTypeKeys[]` and `defaultVisualTypeKey`.

### 1.2 Valid visual types per parameter

| Parameter | Valid Visual Types | Default |
|-----------|--------------------|---------|
| Temperature | `kpi_card`, `time_series`, `bar_chart` | `time_series` |
| Pressure | `kpi_card`, `time_series`, `bar_chart` | `time_series` |
| Coke Level | `kpi_card`, `gauge`, `time_series` | `kpi_card` |
| Steam Rate | `kpi_card`, `time_series` | `time_series` |
| Flow Rate | `kpi_card`, `time_series` | `time_series` |
| Bulging | `heatmap_2d`, `severity_table`, `kpi_card` | `heatmap_2d` |
| Fatigue Damage | `kpi_card`, `area_chart`, `bar_chart`, `damage_table`, `heatmap_2d` | `area_chart` |
| Stress | `kpi_card`, `heatmap_2d`, `time_series` | `kpi_card` |
| Remaining Life | `kpi_card`, `gauge` | `gauge` |
| PSLF | `kpi_card` | `kpi_card` |
| Ovality | `ovality_chart` | `ovality_chart` |
| Displacement | `polar_plot`, `kpi_card` | `polar_plot` |
| Crack | `crack_table`, `fad_chart`, `unwrapped_map` | `crack_table` |

### 1.3 New `CatalogWidgetTemplate.kind` values (additions)
- `ovality_chart` — polar cross-section (original vs actual inner diameter) + elevation selector + stats panel. Ovality parameter only.
- `damage_table` — fatigue damage location table (Damage%, Azimuth, Elevation, Direction, Group) with configurable columns and top-N filter.
- `severity_table` — bulging severity table (PSLF%, Likelihood, Zone) with sort and likelihood filter.
- `crack_table` — crack details table (Location, Cycle, Zone, Lr, Kr) with column visibility config.

**Deprecated kinds** (keep rendering path for backward compat, do not emit in new code):
- `composite_kpi_strip` → split into individual `kpi_card` tiles
- `empty_state` → replaced by proper `time_series` or `kpi_card` tiles
- `multi_tab_panel` → split into separate parameter widgets

### 1.4 New entity: `CokerReferenceWidgetDef`
Non-parameter widgets placed directly without popup. Defined in `coker-v1.ts`.

| Key | Display Name | Kind |
|-----|-------------|------|
| `equipment_data` | Equipment Data | `data_table` |
| `model_3d` | 3D Model | `raster_image` |
| `sensor_location` | Sensor Location | `schematic_3d` |
| `time_range` | Time Range | `control_time_range` |
| `cycle_selector` | Cycle Selector | `control_cycle` |

### 1.5 `GridWidget` shape evolution
**New fields (written by popup):**
```ts
parameterId: string | null        // CokerParameter.key; null for reference_tool
visualTypeId: string              // CatalogWidgetTemplate.key
config: WidgetConfig              // typed per visual type (see Section 3)
referenceWidgetId: string | null  // CokerReferenceWidgetDef.key; null for parameter widgets
```
**Legacy fields (read-only backward compat):**
```ts
templateKey?: string   // old field — kept for existing widget rows
options?: Record<string, unknown>  // old field — kept for existing widget rows
viewType?: string      // oldest field — kept for WidgetViewResolver legacy path
```

---

## 2. Widget Library UI Redesign (`components/catalog-module-library.tsx`)

### 2.1 Two-section layout
Replace the single flat template list with two distinct sections:

**Section A — Parameters**
Subsections (tabs or accordion):
- Operational Inputs: Temperature, Pressure, Coke Level, Steam Rate, Flow Rate
- Inspection: Bulging
- Analysis Outputs: Fatigue Damage, Stress, Remaining Life, PSLF, Ovality, Displacement, Crack

Each entry shows the parameter name, unit, and type badge (input/output).
Dragging emits `application/x-spm-widget` payload with `mode: "parameter"`, `parameterId`.

**Section B — Reference & Tools**
Flat list of 5 reference widgets. Dragging emits payload with `mode: "reference_tool"`, `referenceWidgetId`.
Placed directly on drop without popup.

### 2.2 Drag payload types
```ts
type ParameterDragPayload = {
  mode: "parameter"
  parameterId: string   // CokerParameter.key
  packVersion: string
}

type ReferenceToolDragPayload = {
  mode: "reference_tool"
  referenceWidgetId: string  // CokerReferenceWidgetDef.key
  packVersion: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}
```

---

## 3. Three-Step Widget Creation Popup (`components/workspace/widget-config-popup.tsx`)

Triggered when user drops a `ParameterDragPayload` on the grid.
After confirmation, the popup calls the editor's `onWidgetConfirmed(GridWidget)` callback.

### Step 1 — Choose Visual Type
- Grid of visual type cards showing: icon, kind label, brief description
- Shows only `CokerParameter.validVisualTypeKeys` for the dropped parameter
- `defaultVisualTypeKey` is pre-selected
- User clicks to select

### Step 2 — Configure
Typed config form per visual type:

**kpi_card:**
```ts
{ aggregation: "max"|"min"|"avg"|"latest"; showUnit: boolean; ragMin?: number; ragMax?: number }
```
**time_series / area_chart:**
```ts
{ timeRange: "7d"|"30d"|"last_cycle"|"custom"; customFrom?: string; customTo?: string;
  sensorKeys: string[]; showMultiSeries: boolean; yMin?: number; yMax?: number }
```
**bar_chart:**
```ts
{ groupBy: "elevation"|"cycle"|"time_bucket"; zoneFilter?: string }
```
**gauge:**
```ts
{ zoneRed: number; zoneAmber: number; unit?: string }
// Defaults for Remaining Life: zoneRed=5, zoneAmber=25
```
**damage_table:**
```ts
{ columns: Array<"damage_pct"|"azimuth"|"elevation"|"direction"|"group">;
  sortBy: "damage_pct"|"azimuth"|"elevation"; topN: number }
```
**severity_table:**
```ts
{ sortBy: "pslf"|"likelihood"; likelihoodFilter: "all"|"LIKELY"|"POSSIBLE"; topN: number }
```
**crack_table:**
```ts
{ columns: Array<"location"|"cycle"|"zone"|"lr"|"kr"> }
```
**ovality_chart:**
```ts
{ defaultElevation: number }
```
**fad_chart:**
```ts
{ crackLocationKey?: string }
```
**polar_plot / raster_image / heatmap_2d / unwrapped_map:**
```ts
{}  // no config; step 2 shows "No additional configuration required"
```

### Step 3 — Name
- Auto-generated: `"{Parameter Display Name} — {Visual Type Label}"` (e.g. "Fatigue Damage — Area Chart")
- Editable text input
- **Confirm** / **Cancel** buttons

On Confirm: emits `GridWidget` with `parameterId`, `visualTypeId`, `config`, `title`, and layout box from drop position.

---

## 4. Renderer Rewrite (`components/dashboard/coker-template-view.tsx`)

### 4.1 New routing logic
```ts
// New path: parameterId + visualTypeId
if (widget.parameterId && widget.visualTypeId) {
  return renderParameterWidget(widget.parameterId, widget.visualTypeId, widget.config, context)
}
// Legacy path: templateKey only (backward compat)
if (widget.templateKey) {
  return renderLegacyTemplate(widget.templateKey, context)
}
```

### 4.2 New/fixed renderers needed

**Currently broken — must be rebuilt:**
- `remaining_life` + `gauge`: Arc gauge with colored zones (0–5 red, 5–25 amber, 25+ green), needle or fill, value label in center.
- `flow_rate` + `time_series`: Line chart with mock flow rate series (m³/h, ~5 min cadence).
- `steam_rate` + `time_series`: Line chart with mock steam rate series (t/h).
- `stress` + `kpi_card`: Max Von Mises stress value with location sub-label (elevation).
- `stress` + `heatmap_2d`: Raster image placeholder (stress distribution shell).
- `ovality` + `ovality_chart`: Polar cross-section chart (two concentric circles: original inner diameter in blue, actual in red/dashed) + elevation dropdown + stats table (Max Inner Diameter, Min Inner Diameter, Ovality %, At Elevation). Reference image: `/assets/image-c2b008cf-e9d6-4431-8696-4cb91f6fde4e.png`.
- `sensor_location` (reference widget): Vessel schematic with labeled sensor callout positions (use placeholder with meaningful labels: T1–T4 for temperature sensors, P1–P3 for pressure, C1 for coke level).
- `temperature` + `time_series` with multi-sensor (3 traces, human-readable names: "Temperature Sensor 1/2/3").
- `pressure` + `time_series` with multi-sensor (3 traces: "Pressure Sensor A/B/C").

**New renderers:**
- `ovality_chart` renderer (see above).
- `damage_table` renderer: sortable table, column visibility driven by `config.columns`, top-N filter.
- `severity_table` renderer: PSLF/Likelihood/Zone table with likelihood badge colouring, filter driven by config.
- `crack_table` renderer: Lr/Kr table with configurable columns.
- `control_cycle` renderer: Cycle id, datetime range, status badge (replaces `coker_cycle_selector`).

**Sensor name cleanup:**
Replace all PI tag codes (`118PI5420A.PV` etc.) with human-readable names in legends and tooltips.

### 4.3 Mock data additions (`lib/equipment-packs/coker-mock.ts`)
- `mockFlowRateSeries`: 5 data points, values ~120–145 m³/h
- `mockSteamRateSeries`: 5 data points, values ~1.2–1.6 t/h
- `mockStressKpi`: `{ value: 287, unit: "MPa", location: "Elev. 0.1 m" }`
- `mockOvalityData`: `{ originalDiameter: 2.734, actualDiameter: 2.821, elevations: [...], maxOvalityPct: 10.101, atElevation: -6.782 }`
- Rename `mockSeriesMulti` traces from `a/b/c` to named sensor fields.

---

## 5. Widget Focus Overlay (`components/workspace/widget-focus-overlay.tsx`)

### 5.1 Behaviour
- Rendered in `ResponsiveDashboardGrid` (read-only surfaces only).
- On widget hover, show a small expand icon (top-right corner, appears on hover).
- Click → mount `WidgetFocusOverlay` as a React portal covering the grid container.
- The overlay renders the same `DashboardWidgetBody` at full width/height.
- For `damage_table`, `severity_table`, `crack_table`: remove `topN` limit in expanded view.
- For `time_series` / `area_chart`: render at full width, time range follows widget config.
- Dismiss: × button (top-right) or click outside the card area.

### 5.2 Props
```ts
interface WidgetFocusOverlayProps {
  widget: GridWidget
  equipmentId: string
  context?: DashboardTimeContext
  scenarioRuns?: WhatIfRunSession[]
  viewedDataIds?: string[]
  onClose: () => void
}
```

### 5.3 Integration in `read-only-grid.tsx`
- Track `focusedWidgetId: string | null` in local state.
- Each grid tile wraps content in a hover group; on hover show expand button.
- Mount `<WidgetFocusOverlay>` portal when `focusedWidgetId` is set.
- Do NOT add hover/focus button in `DashboardEditor`.

---

## 6. Dashboard Editor Integration (`components/workspace/dashboard-editor.tsx`)

### 6.1 Drop handler changes
Replace direct widget creation in `onDropFromLibrary` with:
```
if payload.mode === "parameter":
  → open WidgetConfigPopup(parameterId, dropPosition)
  → on confirm: append GridWidget with parameterId + visualTypeId + config
if payload.mode === "reference_tool":
  → append GridWidget directly (referenceWidgetId, defaultW/H from CokerReferenceWidgetDef)
```

### 6.2 State
Add `pendingDrop: { parameterId, dropPosition } | null` state.
`WidgetConfigPopup` is mounted when `pendingDrop` is non-null.
On cancel: clear `pendingDrop`. On confirm: `appendWidget(widget)`, clear `pendingDrop`.

### 6.3 Backward compat rendering
The editor renders existing widgets using `DashboardWidgetBody` which already has the legacy path. No change needed to the render path — only the creation path changes.

---

## 7. `lib/equipment-packs/types.ts` Updates

Add types:
```ts
export type CokerParameterId = 
  | "temperature" | "pressure" | "coke_level" | "steam_rate" | "flow_rate"
  | "bulging" | "fatigue_damage" | "stress" | "remaining_life" | "pslf"
  | "ovality" | "displacement" | "crack"

export interface CokerParameterDef {
  key: CokerParameterId
  displayName: string
  unit: string | null
  parameterType: "input" | "output"
  librarySection: "operational_input" | "inspection" | "analysis_output"
  validVisualTypeKeys: string[]
  defaultVisualTypeKey: string
  description?: string
}

export interface CokerReferenceWidgetDef {
  key: string
  displayName: string
  kind: CatalogTemplateKind
  description?: string
  defaultW: number; defaultH: number; minW: number; minH: number
}

export type WidgetConfig = Record<string, unknown>  // typed per visual type in popup

// Add to CatalogTemplateKind:
// | "ovality_chart" | "damage_table" | "severity_table" | "crack_table" | "control_cycle"
```

Update `GridWidget` in `components/dashboard/layouts.ts`:
```ts
export type GridWidget = WidgetData & { layout: LayoutItem }
// where WidgetData gains:
//   parameterId?: string | null
//   visualTypeId?: string
//   config?: WidgetConfig
//   referenceWidgetId?: string | null
```

---

## 8. `lib/workspace/seed.ts` Updates

Seed dashboards use `DEFAULT_GRIDS[widgetsKey]` which still uses old `viewType`-based `GridWidget` shapes. These remain valid via the legacy rendering path. No migration required for seed data.

New dashboards created by users via the popup will use the new shape; seed dashboards will use the old shape. Both paths must render correctly.

---

## 9. Layer Execution Order

1. **Layer 1 — Types & domain definitions**
   - `lib/equipment-packs/types.ts`: add `CokerParameterDef`, `CokerReferenceWidgetDef`, `WidgetConfig`; update `CatalogTemplateKind`
   - `components/dashboard/layouts.ts`: add `parameterId`, `visualTypeId`, `config`, `referenceWidgetId` to `WidgetData`

2. **Layer 2 — Pack content (coker-v1.ts)**
   - Rewrite `lib/equipment-packs/coker-v1.ts`: export `COKER_PARAMETERS` (13 entries), `COKER_REFERENCE_WIDGETS` (5 entries), updated `COKER_V1_PACK`

3. **Layer 3 — Mock data**
   - `lib/equipment-packs/coker-mock.ts`: add flow rate, steam rate, stress, ovality mock data; rename sensor labels

4. **Layer 4 — Renderers**
   - Rewrite `components/dashboard/coker-template-view.tsx`: dual routing (new parameterId path + legacy templateKey path); new renderers (gauge, ovality chart, sensor schematic, fixed KPI values, cleaned sensor names)

5. **Layer 5 — Widget Library UI**
   - Rewrite `components/catalog-module-library.tsx`: two-section layout, new drag payload types

6. **Layer 6 — Widget creation popup**
   - New `components/workspace/widget-config-popup.tsx`: three-step flow
   - Update `components/workspace/dashboard-editor.tsx`: wire popup on parameter drop

7. **Layer 7 — Focus overlay**
   - New `components/workspace/widget-focus-overlay.tsx`: lightbox portal
   - Update `components/workspace/read-only-grid.tsx`: hover trigger + portal mount

8. **Layer 8 — Dashboard widget body routing**
   - Update `components/dashboard/dashboard-widget-body.tsx`: check `parameterId` first, then `templateKey`, then `viewType`

---

## 10. Out of Scope

- Live data API connections (all data remains mock)
- HCU and SMR widget redesign (Coker only in this iteration)
- PDF/print export layout
- Backend persistence of new widget shape (uses existing `saveDashboardWidgets` via Zustand/API)
- ParameterRequest queue UI changes
