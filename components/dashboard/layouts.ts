"use client"

import type { LayoutItem } from "react-grid-layout/legacy"

export type WidgetData = {
  id: string
  viewType: string
  title?: string
  /** Catalog template key (Coker v1+). When set, equipment pack renderer is used. */
  templateKey?: string
  packVersion?: string
  options?: Record<string, unknown>
}

export type GridWidget = WidgetData & { layout: LayoutItem }

/** Maps widget library entries to dashboard view types and default grid size (cols × rows). */
export const SPM_WIDGET_LIBRARY_SPECS: Record<string, { viewType: string; w: number; h: number }> = {
  "column-chart": { viewType: "demo-bar", w: 4, h: 4 },
  "data-grid": { viewType: "data-grid", w: 6, h: 5 },
  "line-chart": { viewType: "mon-sensor-1", w: 4, h: 4 },
  "pie-chart": { viewType: "demo-pie", w: 4, h: 4 },
  "status-board": { viewType: "crack-flaws", w: 4, h: 4 },
  "summary-chart": { viewType: "demo-summary", w: 12, h: 3 },
  "tree-map": { viewType: "bulge-scatter", w: 6, h: 4 },
}

export const RGL_DROP_PLACEHOLDER_ID = "__spm-dropping__"

// Generate a default grid layout for a tab's widgets
// Col layout: 12 columns. Each unit = 80px rowHeight
export function buildDefaultGrid(widgets: WidgetData[]): GridWidget[] {
  const result: GridWidget[] = []
  let colCursor = 0
  let rowCursor = 0

  for (const w of widgets) {
    let cols = 4
    let rows = 4

    if (w.viewType.startsWith("kpi-")) {
      cols = 3
      rows = 2
    } else if (w.viewType === "equipment-3d") {
      cols = 6
      rows = 5
    } else if (w.viewType === "demo-summary" || w.viewType === "proc-stream") {
      cols = 12
      rows = 3
    } else if (w.viewType === "crack-flaws" || w.viewType === "fatigue-rem") {
      cols = 6
      rows = 3
    }

    if (colCursor + cols > 12) {
      colCursor = 0
      rowCursor += rows
    }

    result.push({
      ...w,
      layout: { i: w.id, x: colCursor, y: rowCursor, w: cols, h: rows, minW: 2, minH: 2 } satisfies LayoutItem,
    })

    colCursor += cols
    if (colCursor >= 12) {
      colCursor = 0
      rowCursor += rows
    }
  }
  return result
}

export const DEFAULT_WIDGET_SETS: Record<string, WidgetData[]> = {
  "Demo Engineer Team's Dashboard": [
    { id: "w-demo-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-demo-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-demo-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-demo-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-demo-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-demo-1", viewType: "demo-pie", title: "Process Distribution" },
    { id: "w-demo-2", viewType: "demo-bar", title: "Performance Bar" },
    { id: "w-demo-3", viewType: "demo-summary", title: "Summary KPIs" },
  ],
  Monitoring: [
    { id: "w-mon-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-mon-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-mon-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-mon-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-mon-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-mon-1", viewType: "mon-sensor-1", title: "Sensor Channel 1" },
    { id: "w-mon-2", viewType: "mon-sensor-2", title: "Sensor Channel 2" },
    { id: "w-mon-3", viewType: "mon-temp", title: "Temperature" },
  ],
  Process: [
    { id: "w-pro-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-pro-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-pro-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-pro-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-pro-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-pro-1", viewType: "proc-composed", title: "Process Overview" },
    { id: "w-pro-2", viewType: "proc-stream", title: "Process Stream" },
  ],
  Fatigue: [
    { id: "w-fat-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-fat-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-fat-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-fat-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-fat-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-fat-1", viewType: "fatigue-trend", title: "Fatigue Trend" },
    { id: "w-fat-2", viewType: "fatigue-cycle", title: "Cycle Count" },
    { id: "w-fat-3", viewType: "fatigue-rem", title: "Remaining Life" },
  ],
  Bulging: [
    { id: "w-bul-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-bul-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-bul-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-bul-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-bul-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-bul-1", viewType: "bulge-bar", title: "Bulge Profile" },
    { id: "w-bul-2", viewType: "bulge-scatter", title: "Thickness Map" },
  ],
  Cracking: [
    { id: "w-cra-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-cra-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-cra-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-cra-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-cra-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-cra-1", viewType: "crack-line", title: "Crack Growth" },
    { id: "w-cra-2", viewType: "crack-flaws", title: "Flaw Regions" },
  ],
  Overview: [
    { id: "w-hcu-over-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-hcu-over-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-hcu-over-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-hcu-over-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-hcu-over-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-hcu-1", viewType: "demo-summary", title: "Summary" },
    { id: "w-hcu-2", viewType: "demo-pie", title: "Distribution" },
    { id: "w-hcu-3", viewType: "proc-stream", title: "Process Stream" },
  ],
  "Reactor Health": [
    { id: "w-hcu-rea-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-hcu-rea-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-hcu-rea-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-hcu-rea-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-hcu-rea-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-hcu-4", viewType: "mon-temp", title: "Temperature" },
    { id: "w-hcu-5", viewType: "crack-flaws", title: "Flaw Regions" },
  ],
  "Process Control": [
    { id: "w-hcu-proc-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-hcu-proc-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-hcu-proc-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-hcu-proc-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-hcu-proc-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-hcu-6", viewType: "proc-composed", title: "Process Control" },
    { id: "w-hcu-7", viewType: "bulge-scatter", title: "Thickness Map" },
  ],
  Maintenance: [
    { id: "w-hcu-main-kpi-1", viewType: "kpi-dmg", title: "Damage KPI" },
    { id: "w-hcu-main-kpi-2", viewType: "kpi-relife", title: "Re-Life KPI" },
    { id: "w-hcu-main-kpi-3", viewType: "kpi-date", title: "Install Date" },
    { id: "w-hcu-main-kpi-4", viewType: "kpi-id", title: "Equipment ID" },
    { id: "w-hcu-main-3d-1", viewType: "equipment-3d", title: "3D Viewer" },
    { id: "w-hcu-8", viewType: "fatigue-rem", title: "Remaining Life" },
    { id: "w-hcu-9", viewType: "fatigue-cycle", title: "Cycle Count" },
  ],
  "SMR Pigtail Integrity": [
    { id: "w-smr-kpi-1", viewType: "kpi-dmg", title: "Creep Damage KPI" },
    { id: "w-smr-kpi-2", viewType: "kpi-relife", title: "Remaining Life KPI" },
    { id: "w-smr-kpi-3", viewType: "kpi-date", title: "Last Inspection Date" },
    { id: "w-smr-kpi-4", viewType: "kpi-id", title: "Pigtail Circuit ID" },
    { id: "w-smr-3d-1", viewType: "equipment-3d", title: "SMR 3D Viewer" },
    { id: "w-smr-1", viewType: "demo-bar", title: "Tube-Skin Temperature Profile" },
    { id: "w-smr-2", viewType: "mon-sensor-1", title: "Pigtail Stress Trend" },
    { id: "w-smr-3", viewType: "demo-summary", title: "Integrity Summary" },
  ],
}

export const DEFAULT_GRIDS: Record<string, GridWidget[]> = Object.fromEntries(
  Object.entries(DEFAULT_WIDGET_SETS).map(([tab, widgets]) => [tab, buildDefaultGrid(widgets)]),
)
