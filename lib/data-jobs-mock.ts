/**
 * Static fixtures for the Tools module **Data & Jobs** → **Data Status** mock UI.
 * No persistence; safe to reset on navigation.
 */

export const DATA_JOBS_PRIMARY_ASSETS = ["Coker 01", "HCU 01", "SMR Pigtails"] as const

export type DataJobsPrimaryAsset = (typeof DATA_JOBS_PRIMARY_ASSETS)[number]

export function isDataJobsPrimaryAsset(name: string): name is DataJobsPrimaryAsset {
  return (DATA_JOBS_PRIMARY_ASSETS as readonly string[]).includes(name)
}

/** Client-facing console URL (mock only). */
export const COKER_SENSOR_DB_CONSOLE_URL =
  "https://example.timescale.com/projects/site-2000-dcu/coker-01-sensors"

export const cokerDatabaseSources = [
  {
    id: "db-primary",
    label: "Client historian — Unit 2006 DCU",
    engine: "TimescaleDB",
    role: "Read-only replica",
    connectionSummary: "pooler.site-2000.client.example:35729 / schema coker_feed",
    externalUrl: COKER_SENSOR_DB_CONSOLE_URL,
  },
] as const

/** Ingest cadence class for UI grouping (mock semantics). */
export type SensorCadenceClass = "process_fast" | "laser_campaign"

export interface CokerSensorChannelRow {
  tag: string
  type: string
  cadenceClass: SensorCadenceClass
  /** Human copy for expected spacing (e.g. ~5 min vs ~3 months). */
  cadenceLabel: string
  /** Last time the client DB recorded a meaningful sample for this channel (mock). */
  lastClientSampleLabel: string
  /** Last time SPM pulled this channel successfully. */
  lastSuccessfulPullLabel: string
  /** Observed mean spacing between successful pulls (mock). */
  avgPullIntervalLabel: string
  health: "ok" | "warn" | "stale"
  lastErrorLabel: string | null
  /** Optional footnote (e.g. campaign name). */
  note?: string
}

/** Process-side channels: thermocouple, pressure, coke level, steam, flow — ~5 min cadence (mock). */
export const cokerSensorChannels: readonly CokerSensorChannelRow[] = [
  {
    tag: "TI6001",
    type: "Thermocouple",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "4 min ago",
    lastSuccessfulPullLabel: "3 min ago",
    avgPullIntervalLabel: "~5.1 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "TI6002",
    type: "Thermocouple",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "5 min ago",
    lastSuccessfulPullLabel: "4 min ago",
    avgPullIntervalLabel: "~5.4 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "TI6003",
    type: "Thermocouple",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "3 min ago",
    lastSuccessfulPullLabel: "3 min ago",
    avgPullIntervalLabel: "~4.9 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "TI6004",
    type: "Thermocouple",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "6 min ago",
    lastSuccessfulPullLabel: "5 min ago",
    avgPullIntervalLabel: "~5.2 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "PI6001",
    type: "Pressure Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "4 min ago",
    lastSuccessfulPullLabel: "4 min ago",
    avgPullIntervalLabel: "~5.0 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "PI6002",
    type: "Pressure Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "5 min ago",
    lastSuccessfulPullLabel: "4 min ago",
    avgPullIntervalLabel: "~5.3 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "PI6003",
    type: "Pressure Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "4 min ago",
    lastSuccessfulPullLabel: "3 min ago",
    avgPullIntervalLabel: "~5.1 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "CI6001",
    type: "Coke level Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "5 min ago",
    lastSuccessfulPullLabel: "5 min ago",
    avgPullIntervalLabel: "~4.8 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "SI6001",
    type: "Steam Rate Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "3 min ago",
    lastSuccessfulPullLabel: "3 min ago",
    avgPullIntervalLabel: "~5.0 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "FI6001",
    type: "Flow Rate Sensor",
    cadenceClass: "process_fast",
    cadenceLabel: "~5 min",
    lastClientSampleLabel: "4 min ago",
    lastSuccessfulPullLabel: "4 min ago",
    avgPullIntervalLabel: "~5.2 min",
    health: "ok",
    lastErrorLabel: null,
  },
  {
    tag: "ZI6001",
    type: "Laser Scan Sensor",
    cadenceClass: "laser_campaign",
    cadenceLabel: "~3 months (campaign)",
    lastClientSampleLabel: "Feb 8, 2026 — scan posted",
    lastSuccessfulPullLabel: "Feb 9, 2026 — mesh ingested",
    avgPullIntervalLabel: "~88 days (last 2 campaigns)",
    health: "ok",
    lastErrorLabel: null,
    note: "Next campaign window: est. late May 2026",
  },
] as const

/** Optional DB-level footnote (not a per-sensor aggregate "stream" card). */
export const cokerPipelineFootnote =
  "Pull worker batches process channels on a short timer; laser geometry is pulled on campaign completion only."

export const cokerOutputDescriptors = [
  "Fatigue Damage",
  "Stress",
  "Remaining Life",
  "PSLF",
  "Bulging",
  "Ovality",
  "FAD",
  "Displacement",
  "Crack",
] as const

export type TransferDirection = "pull" | "push"

export interface DataTransferLogRow {
  at: string
  direction: TransferDirection
  status: "ok" | "warn" | "fail"
  message: string
}

export const cokerTransferLog: DataTransferLogRow[] = [
  { at: "2026-05-02 14:21", direction: "pull", status: "ok", message: "Ingest batch #4821 — process channels TI6001–FI6001" },
  { at: "2026-05-02 14:20", direction: "pull", status: "ok", message: "Watermark advance (historian replica lag 12s)" },
  { at: "2026-05-02 14:18", direction: "pull", status: "ok", message: "Ingest batch #4820 — process channels" },
  { at: "2026-05-02 14:05", direction: "push", status: "warn", message: "Output bundle staging retry (transient); succeeded on retry" },
  { at: "2026-05-02 13:59", direction: "pull", status: "ok", message: "Schema drift check — no migration required" },
]

export type ExportFormat = "csv" | "xml" | "json"

export function buildCokerExportSample(format: ExportFormat): string {
  const payload = {
    equipment: "Coker 01",
    generatedAt: "2026-05-02T14:22:00Z",
    outputs: [...cokerOutputDescriptors],
    note: "Sample export bundle for offline review.",
  }
  if (format === "json") {
    return `${JSON.stringify(payload, null, 2)}\n`
  }
  if (format === "xml") {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<export equipment="Coker 01">\n  <outputs>\n${payload.outputs
      .map((o) => `    <item>${o}</item>`)
      .join("\n")}\n  </outputs>\n</export>\n`
  }
  return `equipment,generatedAt,output\n${payload.outputs.map((o) => `"Coker 01","${payload.generatedAt}","${o}"`).join("\n")}\n`
}
