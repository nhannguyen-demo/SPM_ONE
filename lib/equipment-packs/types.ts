/**
 * Equipment knowledge pack types (see domain.ontology.yaml & scripts/prd.txt).
 * Packs are code-as-config until a backend exists.
 */

export type EquipmentTypeKey = "coker" | "hcu" | "smr" | "other"

export type ParameterCategory =
  | "asset_information"
  | "asset_efficiency"
  | "event_visualization"
  | "other"

export type CatalogTemplateKind =
  | "kpi_card"
  | "time_series"
  | "gauge"
  | "area_chart"
  | "data_table"
  | "heatmap_2d"
  | "schematic_3d"
  | "polar_plot"
  | "bar_chart"
  | "fad_chart"
  | "unwrapped_map"
  | "control_time_range"
  | "multi_tab_panel"
  | "empty_state"
  | "composite_kpi_strip"
  /** Full-widget static image from app `public/` (Coker reference art, etc.) */
  | "raster_image"

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
  /** When false, dashboard time/cycle context does not apply (e.g. last-cycle-only). */
  followsDashboardContext: boolean
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  /** Reference screen id for QA (R1–R6). */
  referenceScreenId?: string
  /** Lucide icon name for library list. */
  icon: string
}

export interface EquipmentKnowledgePackDef {
  equipmentTypeKey: EquipmentTypeKey
  version: string
  parameterFamilies: CatalogParameterFamily[]
  templates: CatalogWidgetTemplateDef[]
}
