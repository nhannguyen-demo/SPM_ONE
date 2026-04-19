// Mock data for SPM ONE prototype

export const sites = [
  {
    id: "site-x",
    name: "Site X",
    plants: [
      {
        id: "plant-1",
        name: "Plant 1",
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
            name: "Pump ND.1X02",
            tabs: ["Pump Performance"],
          },
        ],
      },
      {
        id: "plant-2",
        name: "Plant 2",
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
  "equipment-c": "/images/thumbnails/pump.jpg",
}

export function getEquipmentDashboardThumbnail(equipId: string | undefined): string | undefined {
  if (!equipId) return undefined
  return equipmentDashboardThumbnails[equipId]
}

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
    id: "dash-pump-1",
    equipment: "Pump ND.1X02",
    equipId: "equipment-c",
    tag: "Pump Performance",
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
  { asset: "Pump ND.1X02", files: 6, loadStatus: "5/6", lastUpdate: "09/04/2026", error: "0/5" },
  { asset: "Pipe a", files: 3, loadStatus: "3/3", lastUpdate: "10/04/2026", error: "1/3" },
]

export const syncJobs = [
  { asset: "Coke Drum", description: "fix pressure", state: "Success", startTime: "05/04/2026", elapsed: "4m 52s", user: "Ben - process en", tokens: 0 },
  { asset: "HCU", description: "what-if scenario", state: "Success", startTime: "28/03/2026", elapsed: "3m 50s", user: "Alex - process en", tokens: 0 },
  { asset: "Pump ND.1X02", description: "virus scan", state: "Success", startTime: "09/03/2026", elapsed: "2s", user: "Alex - process en", tokens: 0 },
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
