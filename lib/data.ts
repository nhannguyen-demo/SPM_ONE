// Mock data for SPM ONE prototype

export const sites = [
  {
    id: "site-x",
    name: "Site X",
    plants: [
      {
        id: "plant-1",
        name: "Unit CFR.101",
        equipment: [
          {
            id: "equipment-a",
            name: "Coke Drum",
            tabs: ["Demo Engineer Team's Dashboard", "Monitoring", "Process", "Fatigue", "Bulging", "Cracking"],
          },
          {
            id: "equipment-b",
            name: "HCU",
            tabs: ["Overview", "Reactor Health", "Process Control", "Maintenance"],
          },
          {
            id: "equipment-c",
            name: "SMR Unit A",
            tabs: ["SMR Pigtail Integrity"],
          },
        ],
      },
      {
        id: "plant-2",
        name: "Unit TFR.40",
        equipment: [],
      },
    ],
  },
  {
    id: "site-y",
    name: "Site Y",
    plants: [],
  },
]

export const siteDocuments = [
  { name: "how to be an engineer", type: "link" },
  { name: "how to fly", type: "link" },
  { name: "Coker maintenance 101.docx", type: "doc" },
  { name: "internal_manual_doc", type: "link" },
  { name: "_from Simon", type: "link" },
]

export const plantDocuments = [
  { name: "how to manage 3 equipments at the same time", type: "link" },
  { name: "how to drive a car", type: "link" },
  { name: "Coker maintenance 101.docx", type: "doc" },
  { name: "newcomer instruction", type: "link" },
  { name: "Ben's secrets", type: "link" },
]

/**
 * Hero thumbnails for dashboard tab cards, keyed by equipment id.
 * Add your files under public/images/thumbnails/ using these filenames (or edit paths below).
 */
export const equipmentDashboardThumbnails: Record<string, string> = {
  "equipment-a": "/images/thumbnails/coke-drum.jpg",
  "equipment-b": "/images/thumbnails/hcu.png",
  "equipment-c": "/images/thumbnails/smr.png",
}

export function getEquipmentDashboardThumbnail(equipId: string | undefined): string | undefined {
  if (!equipId) return undefined
  return equipmentDashboardThumbnails[equipId]
}

/**
 * @deprecated Use `useWorkspaceStore().dashboards` (lib/workspace/store) via the
 * adapters in lib/workspace-data.ts instead. This static array remains here as
 * a fallback only and will be removed once all consumers are migrated.
 */
export const dashboardCards = [
  {
    id: "dash-1",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Demo Engineer Team's Dashboard",
    metrics: { value1: "80%", value2: "0.005%" },
  },
  {
    id: "dash-2",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Monitoring",
    metrics: { value1: "95%", value2: "0.002%" },
  },
  {
    id: "dash-3",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Process",
    metrics: { value1: "92%", value2: "0.001%" },
  },
  {
    id: "dash-4",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Fatigue",
    // Keep 90% and 0.001% as it originally was on #process to not break expectations
    metrics: { value1: "90%", value2: "0.001%" },
  },
  {
    id: "dash-5",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Bulging",
    metrics: { value1: "201%", value2: "0.04%" },
  },
  {
    id: "dash-6",
    equipment: "Coke Drum",
    equipId: "equipment-a",
    tag: "Cracking",
    metrics: { value1: "76%", value2: "0.01%" },
  },
  {
    id: "dash-hcu-1",
    equipment: "HCU",
    equipId: "equipment-b",
    tag: "Overview",
    metrics: { value1: "95%", value2: "0.003%" },
  },
  {
    id: "dash-hcu-2",
    equipment: "HCU",
    equipId: "equipment-b",
    tag: "Reactor Health",
    metrics: { value1: "88%", value2: "0.010%" },
  },
  {
    id: "dash-hcu-3",
    equipment: "HCU",
    equipId: "equipment-b",
    tag: "Process Control",
    metrics: { value1: "92%", value2: "0.005%" },
  },
  {
    id: "dash-hcu-4",
    equipment: "HCU",
    equipId: "equipment-b",
    tag: "Maintenance",
    metrics: { value1: "78%", value2: "0.020%" },
  },
  {
    id: "dash-smr-1",
    equipment: "SMR Unit A",
    equipId: "equipment-c",
    tag: "SMR Pigtail Integrity",
    metrics: { value1: "99%", value2: "0.001%" },
  },
]

export const equipmentKPIs = {
  dmg: "201%",
  reLife: "40 yrs",
  date: "10/02/2026",
  id: "260020",
}

export const monitoringItems = [
  { id: "home", name: "Home" },
  { id: "monitoring", name: "Monitoring" },
  { id: "process", name: "Process" },
  { id: "fatigue", name: "Fatigue" },
  { id: "bulging", name: "Bulging" },
  { id: "cracking", name: "Cracking" },
]

export const moduleLibrary = [
  { id: "column-chart", name: "Column Chart", icon: "bar-chart", category: "Asset Efficiency" },
  { id: "data-grid", name: "Data Grid", icon: "table", category: "Asset Efficiency" },
  { id: "line-chart", name: "Line Chart", icon: "line-chart", category: "Asset Efficiency" },
  { id: "pie-chart", name: "Pie Chart", icon: "pie-chart", category: "Asset Efficiency" },
  { id: "status-board", name: "Status Board", icon: "list", category: "Asset Information" },
  { id: "summary-chart", name: "Summary Chart", icon: "chart", category: "Asset Information" },
  { id: "tree-map", name: "Tree Map", icon: "grid", category: "Event Visualization" },
]

export const dataStatusItems = [
  { asset: "Coke Drum", files: 10, loadStatus: "10/10", lastUpdate: "11/04/2026", error: "0/10" },
  { asset: "HCU", files: 7, loadStatus: "7/7", lastUpdate: "11/04/2026", error: "0/7" },
  { asset: "SMR Unit A", files: 6, loadStatus: "5/6", lastUpdate: "09/04/2026", error: "0/5" },
  { asset: "Pipe a", files: 3, loadStatus: "3/3", lastUpdate: "10/04/2026", error: "1/3" },
]

export const syncJobs = [
  { asset: "Coke Drum", description: "fix pressure", state: "Success", startTime: "05/04/2026", elapsed: "4m 52s", user: "Ben - process en", tokens: 0 },
  { asset: "HCU", description: "what-if scenario", state: "Success", startTime: "28/03/2026", elapsed: "3m 50s", user: "Alex - process en", tokens: 0 },
  { asset: "SMR Unit A", description: "pigtail thermal scan", state: "Success", startTime: "09/03/2026", elapsed: "2s", user: "Alex - process en", tokens: 0 },
  { asset: "Pipe a", description: "fea solve", state: "Failed", startTime: "10/01/2026", elapsed: "58m 41s", user: "Simon - integrit...", tokens: 192 },
]

export const whatIfResults = [
  { checked: true, col1: "Parameter 1", col2: "150.5", col3: "Pass" },
  { checked: true, col1: "Parameter 2", col2: "89.2", col3: "Pass" },
  { checked: true, col1: "Parameter 3", col2: "201.0", col3: "Warning" },
  { checked: true, col1: "Parameter 4", col2: "45.8", col3: "Pass" },
  { checked: true, col1: "Parameter 5", col2: "120.3", col3: "Pass" },
  { checked: true, col1: "Parameter 6", col2: "78.9", col3: "Pass" },
  { checked: true, col1: "Parameter 7", col2: "95.1", col3: "Pass" },
  { checked: true, col1: "Parameter 8", col2: "110.7", col3: "Pass" },
]

/* ─────────────────────────────────────────────────────────────────────────────
   HOME PAGE MOCK DATA
───────────────────────────────────────────────────────────────────────────── */

export type ChangeLogType = "dashboard" | "operation"

export interface ChangeLogEntry {
  id: string
  timestamp: string
  user: string
  action: string
  location: string
  type: ChangeLogType
}

export const changeLogEntries: ChangeLogEntry[] = [
  {
    id: "cl-1",
    timestamp: "2026-04-19 19:42",
    user: "Nhan N.",
    action: "Added Fatigue Trend widget to Coke Drum — Fatigue dashboard",
    location: "Site X › Plant 1 › Coke Drum › Fatigue",
    type: "dashboard",
  },
  {
    id: "cl-2",
    timestamp: "2026-04-19 17:10",
    user: "Ben T.",
    action: "Updated operating pressure set-point from 2.1 bar to 2.3 bar",
    location: "Site X › Plant 1 › Coke Drum",
    type: "operation",
  },
  {
    id: "cl-3",
    timestamp: "2026-04-19 14:55",
    user: "Alex P.",
    action: "Ran What-If Scenario: 'Fix Pressure' on HCU",
    location: "Site X › Plant 1 › HCU",
    type: "operation",
  },
  {
    id: "cl-4",
    timestamp: "2026-04-18 22:30",
    user: "Nhan N.",
    action: "Rearranged widgets on HCU — Reactor Health dashboard",
    location: "Site X › Plant 1 › HCU › Reactor Health",
    type: "dashboard",
  },
  {
    id: "cl-5",
    timestamp: "2026-04-18 16:15",
    user: "Simon K.",
    action: "Uploaded new P&ID diagram for Plant 1",
    location: "Site X › Plant 1",
    type: "operation",
  },
  {
    id: "cl-6",
    timestamp: "2026-04-17 09:05",
    user: "Ben T.",
    action: "Removed Summary KPIs widget from Monitoring dashboard",
    location: "Site X › Plant 1 › Coke Drum › Monitoring",
    type: "dashboard",
  },
  {
    id: "cl-7",
    timestamp: "2026-04-16 11:00",
    user: "Alex P.",
    action: "Flagged high pigtail tube-skin temperature on SMR Unit A for review",
    location: "Site X › Plant 1 › SMR Unit A",
    type: "operation",
  },
  {
    id: "cl-8",
    timestamp: "2026-04-15 08:45",
    user: "Nhan N.",
    action: "Pinned Cracking dashboard to favourites",
    location: "Site X › Plant 1 › Coke Drum › Cracking",
    type: "dashboard",
  },
]

export type DocumentCategory = "Uploaded" | "Shared"
export type DocumentFileType = "pdf" | "docx" | "xlsx" | "link"

export interface UserDocument {
  id: string
  name: string
  fileType: DocumentFileType
  category: DocumentCategory
  siteId?: string
  plantId?: string
  equipmentId?: string
  size: string
  date: string
  sharedBy?: string
}

export const userDocuments: UserDocument[] = [
  {
    id: "doc-1",
    name: "Coke Drum Fatigue Assessment 2026.pdf",
    fileType: "pdf",
    category: "Uploaded",
    siteId: "site-x",
    plantId: "plant-1",
    equipmentId: "equipment-a",
    size: "4.2 MB",
    date: "2026-04-10",
  },
  {
    id: "doc-2",
    name: "HCU Reactor Maintenance Procedure.docx",
    fileType: "docx",
    category: "Uploaded",
    siteId: "site-x",
    plantId: "plant-1",
    equipmentId: "equipment-b",
    size: "1.8 MB",
    date: "2026-04-08",
  },
  {
    id: "doc-3",
    name: "Plant 1 — Q1 2026 Inspection Report.xlsx",
    fileType: "xlsx",
    category: "Shared",
    siteId: "site-x",
    plantId: "plant-1",
    size: "890 KB",
    date: "2026-04-05",
    sharedBy: "Simon K.",
  },
  {
    id: "doc-4",
    name: "SMR Unit A Pigtail Tube Temperature Logs Mar-26.xlsx",
    fileType: "xlsx",
    category: "Uploaded",
    siteId: "site-x",
    plantId: "plant-1",
    equipmentId: "equipment-c",
    size: "220 KB",
    date: "2026-04-01",
  },
  {
    id: "doc-5",
    name: "Global Safety Standards Rev. 12.pdf",
    fileType: "pdf",
    category: "Shared",
    siteId: "site-x",
    size: "12.4 MB",
    date: "2026-03-28",
    sharedBy: "Alex P.",
  },
  {
    id: "doc-6",
    name: "Coker Maintenance 101.docx",
    fileType: "docx",
    category: "Shared",
    siteId: "site-x",
    plantId: "plant-1",
    size: "560 KB",
    date: "2026-03-20",
    sharedBy: "Ben T.",
  },
  {
    id: "doc-7",
    name: "Site X Asset Register 2026.xlsx",
    fileType: "xlsx",
    category: "Uploaded",
    siteId: "site-x",
    size: "3.1 MB",
    date: "2026-03-15",
  },
  {
    id: "doc-8",
    name: "HCU Process Control SOP.pdf",
    fileType: "pdf",
    category: "Shared",
    siteId: "site-x",
    plantId: "plant-1",
    equipmentId: "equipment-b",
    size: "2.7 MB",
    date: "2026-03-10",
    sharedBy: "Nhan N.",
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   WHAT-IF SCENARIOS
───────────────────────────────────────────────────────────────────────────── */

export interface WhatIfScenarioDefinition {
  id: string
  equipmentId: string
  equipmentName: string
  name: string
  description: string
  details: string
  availableDashboards: string[]
  defaultParams: Record<string, { value: string; unit: string }>
  plant: string
  site: string
}

export const whatIfScenarios: WhatIfScenarioDefinition[] = [
  {
    id: "scenario-coke-drum",
    equipmentId: "equipment-a",
    equipmentName: "Coke Drum",
    name: "Coke Drum — Future Operating Scenario",
    description: "Models a future operating cycle where inlet temperature and pressure profiles are varied to assess impact on fatigue accumulation, bulging probability, and remaining asset life.",
    details: "Upload a CSV file containing projected temperature and pressure time-series data for the next scheduled operating period. The tool computes updated Damage (DMG%), Remaining Life, and generates scenario-specific equivalents of the Fatigue, Bulging, and Cracking dashboards so engineers can compare future state against current actuals.",
    availableDashboards: ["Demo Engineer Team's Dashboard", "Monitoring", "Process", "Fatigue", "Bulging", "Cracking"],
    defaultParams: {
      "Inlet Pressure":    { value: "150.5", unit: "barg" },
      "Inlet Temp":        { value: "450.2", unit: "°C" },
      "Mass Flow":         { value: "12.4",  unit: "kg/s" },
      "Molecular Wt":      { value: "28.05", unit: "g/mol" },
      "Cp/Cv":             { value: "1.32",  unit: "-" },
      "Z Factor":          { value: "0.98",  unit: "-" },
      "Pipe Diameter":     { value: "250",   unit: "mm" },
      "Wall Thickness":    { value: "12.5",  unit: "mm" },
    },
    plant: "Plant 1",
    site: "Site X",
  },
  {
    id: "scenario-hcu",
    equipmentId: "equipment-b",
    equipmentName: "HCU",
    name: "HCU — Reactor Load Variation Scenario",
    description: "Simulates the effect of varying hydrogen partial pressure and feed rate on reactor health indicators, catalyst deactivation rates, and predicted maintenance intervals.",
    details: "Upload a CSV containing projected feed compositions, reactor inlet conditions, and recycle gas compositions for a specified future period. The tool produces scenario-adapted Reactor Health, Process Control, and Maintenance dashboards for direct comparison with current live data.",
    availableDashboards: ["Overview", "Reactor Health", "Process Control", "Maintenance"],
    defaultParams: {
      "H₂ Partial Pressure": { value: "38.2",  unit: "bar" },
      "Feed Rate":            { value: "95.0",  unit: "t/h" },
      "Reactor Inlet T":      { value: "372.0", unit: "°C" },
      "LHSV":                 { value: "1.25",  unit: "h⁻¹" },
      "H₂/HC Ratio":          { value: "650",   unit: "Nm³/m³" },
      "Pressure Drop ΔP":     { value: "1.8",   unit: "bar" },
      "Catalyst Age":         { value: "18",    unit: "months" },
    },
    plant: "Plant 1",
    site: "Site X",
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK WHAT-IF RUN HISTORY  (pre-populated so tool is not empty on first load)
───────────────────────────────────────────────────────────────────────────── */

export const mockWhatIfRunSessions = [
  {
    id: "wir-001",
    scenarioId: "scenario-coke-drum",
    equipmentId: "equipment-a",
    equipmentName: "Coke Drum",
    runName: "Q2 Extended Cycle Projection",
    startedAt: "2026-04-18T14:22:00Z",
    duration: "4m 52s",
    status: "success" as const,
    user: "Ben T.",
    selectedDashboards: ["Fatigue", "Bulging"],
    results: [
      { checked: true, col1: "DMG Accumulation",   col2: "218.4%", col3: "Warning" },
      { checked: true, col1: "Remaining Life",      col2: "36.2 yrs", col3: "Pass" },
      { checked: true, col1: "Fatigue Index",       col2: "0.74",   col3: "Pass" },
      { checked: true, col1: "Bulge Probability",   col2: "12.3%",  col3: "Pass" },
      { checked: true, col1: "Crack Growth Rate",   col2: "0.018 mm/cycle", col3: "Pass" },
      { checked: true, col1: "Peak Temperature",    col2: "492.1°C", col3: "Warning" },
      { checked: true, col1: "Pressure Ratio",      col2: "0.96",   col3: "Pass" },
      { checked: true, col1: "Cycle Count Delta",   col2: "+14",    col3: "Pass" },
    ],
    progressStep: 5,
    params: { "Inlet Pressure": "155.0", "Inlet Temp": "462.5", "Mass Flow": "13.1", "Molecular Wt": "28.05", "Cp/Cv": "1.32", "Z Factor": "0.97", "Pipe Diameter": "250", "Wall Thickness": "12.5" },
    source: "tool" as const,
    parameterInputMode: "full-csv" as const,
  },
  {
    id: "wir-002",
    scenarioId: "scenario-coke-drum",
    equipmentId: "equipment-a",
    equipmentName: "Coke Drum",
    runName: "Reduced Pressure Test Run",
    startedAt: "2026-04-03T09:10:00Z",
    duration: "3m 28s",
    status: "success" as const,
    user: "Nhan N.",
    selectedDashboards: ["Process", "Cracking"],
    results: [
      { checked: true, col1: "DMG Accumulation",   col2: "195.2%", col3: "Pass" },
      { checked: true, col1: "Remaining Life",      col2: "41.0 yrs", col3: "Pass" },
      { checked: true, col1: "Fatigue Index",       col2: "0.61",   col3: "Pass" },
      { checked: true, col1: "Bulge Probability",   col2: "8.9%",   col3: "Pass" },
      { checked: true, col1: "Crack Growth Rate",   col2: "0.012 mm/cycle", col3: "Pass" },
      { checked: true, col1: "Peak Temperature",    col2: "441.0°C", col3: "Pass" },
      { checked: true, col1: "Pressure Ratio",      col2: "0.91",   col3: "Pass" },
      { checked: true, col1: "Cycle Count Delta",   col2: "+8",     col3: "Pass" },
    ],
    progressStep: 5,
    params: { "Inlet Pressure": "140.0", "Inlet Temp": "438.0", "Mass Flow": "11.8", "Molecular Wt": "28.05", "Cp/Cv": "1.32", "Z Factor": "0.99", "Pipe Diameter": "250", "Wall Thickness": "12.5" },
    source: "dashboard" as const,
    parameterInputMode: "mixed" as const,
  },
  {
    id: "wir-003",
    scenarioId: "scenario-hcu",
    equipmentId: "equipment-b",
    equipmentName: "HCU",
    runName: "High Feed Rate Stress Test",
    startedAt: "2026-04-15T11:05:00Z",
    duration: "5m 14s",
    status: "success" as const,
    user: "Alex P.",
    selectedDashboards: ["Reactor Health", "Maintenance"],
    results: [
      { checked: true, col1: "Catalyst Activity",   col2: "74.2%",  col3: "Warning" },
      { checked: true, col1: "Reactor ΔT",           col2: "28.5°C", col3: "Pass" },
      { checked: true, col1: "H₂ Consumption",      col2: "102.4 Nm³/h", col3: "Pass" },
      { checked: true, col1: "Run Length Est.",      col2: "8.2 months", col3: "Pass" },
      { checked: true, col1: "Pressure Drop",        col2: "2.4 bar", col3: "Warning" },
      { checked: true, col1: "Coke Deposition",      col2: "0.08%/hr", col3: "Pass" },
    ],
    progressStep: 5,
    params: { "H₂ Partial Pressure": "40.0", "Feed Rate": "108.0", "Reactor Inlet T": "378.0", "LHSV": "1.45", "H₂/HC Ratio": "680", "Pressure Drop ΔP": "2.1", "Catalyst Age": "18" },
    source: "tool" as const,
  },
  {
    id: "wir-004",
    scenarioId: "scenario-hcu",
    equipmentId: "equipment-b",
    equipmentName: "HCU",
    runName: "Nominal Q2 Projection",
    startedAt: "2026-03-28T08:30:00Z",
    duration: "4m 02s",
    status: "failed" as const,
    user: "Simon K.",
    selectedDashboards: ["Overview"],
    results: [],
    progressStep: 2,
    params: { "H₂ Partial Pressure": "38.2", "Feed Rate": "95.0", "Reactor Inlet T": "372.0", "LHSV": "1.25", "H₂/HC Ratio": "650", "Pressure Drop ΔP": "1.8", "Catalyst Age": "20" },
    source: "dashboard" as const,
  },
]

/** Layout templates for What-If result exploration (widget / dashboard mock). */
export interface WhatIfExploreTemplateWidget {
  id: string
  viewType: string
  title?: string
  layout: { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }
}

export interface WhatIfExploreDashboardTemplate {
  id: string
  name: string
  description: string
  widgets: WhatIfExploreTemplateWidget[]
}

export const whatIfExploreDashboardTemplates: WhatIfExploreDashboardTemplate[] = [
  {
    id: "tpl-monitoring",
    name: "Monitoring template",
    description: "KPIs plus sensor trends, similar to the Monitoring dashboard.",
    widgets: [
      { id: "tex-1", viewType: "kpi-dmg", title: "Damage KPI", layout: { i: "tex-1", x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 } },
      { id: "tex-2", viewType: "kpi-relife", title: "Re-Life KPI", layout: { i: "tex-2", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 } },
      { id: "tex-3", viewType: "mon-sensor-1", title: "Sensor Channel 1", layout: { i: "tex-3", x: 0, y: 2, w: 6, h: 4, minW: 2, minH: 2 } },
      { id: "tex-4", viewType: "mon-sensor-2", title: "Sensor Channel 2", layout: { i: "tex-4", x: 6, y: 2, w: 6, h: 4, minW: 2, minH: 2 } },
    ],
  },
  {
    id: "tpl-process",
    name: "Process template",
    description: "Composed process view with stream strip.",
    widgets: [
      { id: "tex-p1", viewType: "proc-composed", title: "Process Overview", layout: { i: "tex-p1", x: 0, y: 0, w: 8, h: 5, minW: 2, minH: 2 } },
      { id: "tex-p2", viewType: "proc-stream", title: "Process Stream", layout: { i: "tex-p2", x: 8, y: 0, w: 4, h: 5, minW: 2, minH: 2 } },
    ],
  },
  {
    id: "tpl-blank",
    name: "Blank canvas",
    description: "Start empty and add widgets from the library.",
    widgets: [],
  },
]

