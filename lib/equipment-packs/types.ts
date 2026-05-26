/**
 * Equipment knowledge pack types (see domain.ontology.yaml).
 * Packs are code-as-config until a backend exists.
 */

export type EquipmentTypeKey = "coker" | "hcu" | "smr" | "other"

// ---------------------------------------------------------------------------
// Legacy category type (kept for CatalogWidgetTemplateDef backward compat)
// ---------------------------------------------------------------------------
export type ParameterCategory =
  | "asset_information"
  | "asset_efficiency"
  | "event_visualization"
  | "other"

// ---------------------------------------------------------------------------
// Visual kind enum — drives renderer selection in CokerTemplateView
// ---------------------------------------------------------------------------
export type CatalogTemplateKind =
  // Single-value
  | "kpi_card"
  | "gauge"
  // Time-series charts
  | "time_series"
  | "area_chart"
  // Distribution / spatial charts
  | "bar_chart"
  | "polar_plot"
  | "fad_chart"
  | "ovality_chart"       // NEW: polar cross-section (Ovality parameter)
  // Tabular
  | "data_table"
  | "damage_table"        // NEW: fatigue damage locations table
  | "severity_table"      // NEW: bulging severity table (PSLF / Likelihood)
  | "crack_table"         // NEW: crack details table (Lr / Kr)
  // Image / schematic
  | "raster_image"
  | "heatmap_2d"
  | "unwrapped_map"
  | "schematic_3d"
  // Dashboard controls (reference widgets)
  | "control_time_range"
  | "control_cycle"       // NEW: cycle selector control
  // DEPRECATED — kept for backward-compat rendering only
  | "composite_kpi_strip"
  | "empty_state"
  | "multi_tab_panel"

// ---------------------------------------------------------------------------
// CokerParameter — new parameter-driven model (May 2026)
// ---------------------------------------------------------------------------

/** 13 canonical Coker parameter keys. */
export type CokerParameterId =
  | "temperature"
  | "pressure"
  | "coke_level"
  | "steam_rate"
  | "flow_rate"
  | "bulging"
  | "fatigue_damage"
  | "stress"
  | "remaining_life"
  | "pslf"
  | "ovality"
  | "displacement"
  | "crack"

/** Groups inside the Widget Library "Parameters" section. */
export type CokerLibrarySection =
  | "operational_input"
  | "inspection"
  | "analysis_output"

/** Definition of a single Coker physical parameter. */
export interface CokerParameterDef {
  key: CokerParameterId
  displayName: string
  /** Engineering unit shown in widget headers and KPI values. Null when dimensionless. */
  unit: string | null
  parameterType: "input" | "output"
  librarySection: CokerLibrarySection
  /** CatalogWidgetTemplate keys that are valid visual types for this parameter.
   *  Shown in Step 1 of the widget-creation popup. */
  validVisualTypeKeys: string[]
  defaultVisualTypeKey: string
  description?: string
}

// ---------------------------------------------------------------------------
// CokerReferenceWidgetDef — non-parameter tool widgets
// ---------------------------------------------------------------------------

/** Reference / tool widget placed directly without a creation popup. */
export interface CokerReferenceWidgetDef {
  key: string
  displayName: string
  kind: CatalogTemplateKind
  description?: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

// ---------------------------------------------------------------------------
// Typed widget configs — one per visual type (used in GridWidget.config)
// ---------------------------------------------------------------------------

export type KpiCardConfig = {
  aggregation: "max" | "min" | "avg" | "latest"
  showUnit: boolean
  ragMin?: number
  ragMax?: number
}

export type TimeSeriesConfig = {
  timeRange: "7d" | "30d" | "last_cycle" | "custom"
  customFrom?: string
  customTo?: string
  sensorKeys: string[]
  showMultiSeries: boolean
  yMin?: number
  yMax?: number
}

export type AreaChartConfig = TimeSeriesConfig

export type BarChartConfig = {
  groupBy: "elevation" | "cycle" | "time_bucket"
  zoneFilter?: string
}

export type GaugeConfig = {
  zoneRed: number
  zoneAmber: number
}

export type DamageTableConfig = {
  columns: Array<"damage_pct" | "azimuth" | "elevation" | "direction" | "group">
  sortBy: "damage_pct" | "azimuth" | "elevation"
  topN: number
}

export type SeverityTableConfig = {
  sortBy: "pslf" | "likelihood"
  likelihoodFilter: "all" | "LIKELY" | "POSSIBLE"
  topN: number
}

export type CrackTableConfig = {
  columns: Array<"location" | "cycle" | "zone" | "lr" | "kr">
}

export type OvalityChartConfig = {
  defaultElevation: number
}

export type FadChartConfig = {
  crackLocationKey?: string
}

export type PolarPlotConfig = Record<string, never>
export type RasterImageConfig = Record<string, never>
export type Heatmap2dConfig = Record<string, never>
export type UnwrappedMapConfig = Record<string, never>

export type WidgetConfig =
  | KpiCardConfig
  | TimeSeriesConfig
  | AreaChartConfig
  | BarChartConfig
  | GaugeConfig
  | DamageTableConfig
  | SeverityTableConfig
  | CrackTableConfig
  | OvalityChartConfig
  | FadChartConfig
  | PolarPlotConfig
  | RasterImageConfig
  | Heatmap2dConfig
  | UnwrappedMapConfig
  | Record<string, unknown>  // fallback for legacy / unknown configs

// ---------------------------------------------------------------------------
// Legacy types — kept for backward compat
// ---------------------------------------------------------------------------

export interface CatalogParameterFamily {
  key: string
  displayName: string
  category: ParameterCategory
}

export interface CatalogWidgetTemplateDef {
  key: string
  displayName: string
  description?: string
  category: ParameterCategory
  kind: CatalogTemplateKind
  followsDashboardContext: boolean
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  referenceScreenId?: string
  icon: string
}

export interface EquipmentKnowledgePackDef {
  equipmentTypeKey: EquipmentTypeKey
  version: string
  /** @deprecated use cokerParameters instead */
  parameterFamilies: CatalogParameterFamily[]
  templates: CatalogWidgetTemplateDef[]
  /** New parameter-driven definitions (May 2026) */
  cokerParameters?: CokerParameterDef[]
  referenceWidgets?: CokerReferenceWidgetDef[]
}
