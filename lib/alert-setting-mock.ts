/**
 * Alert Setting tool — Coker 01 parameter catalog aligned with Data & Jobs mock.
 * @see lib/data-jobs-mock.ts
 */

import { cokerOutputDescriptors, cokerSensorChannels } from "@/lib/data-jobs-mock"

/** Primary equipment with full Alert Setting mock UX. */
export const ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID = "equipment-a" as const

/** Equipment ids that show in-tool “coming soon” (fixtures not aligned yet). */
export const ALERT_SETTING_COMING_SOON_EQUIPMENT_IDS = ["equipment-b", "equipment-c"] as const

export function isAlertSettingFullMockEquipment(equipmentId: string | null | undefined): boolean {
  return equipmentId === ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID
}

export function isAlertSettingComingSoonEquipment(equipmentId: string | null | undefined): boolean {
  if (!equipmentId) return false
  return (ALERT_SETTING_COMING_SOON_EQUIPMENT_IDS as readonly string[]).includes(equipmentId)
}

/** Process / sensor-side parameters (labels match product copy; tags mirror Data Status). */
export const cokerAlertInputParameters = [
  {
    id: "input-temperature",
    label: "Temperature",
    detail: "Thermocouples TI6001–TI6004",
    tags: cokerSensorChannels.filter((c) => c.type === "Thermocouple").map((c) => c.tag),
  },
  {
    id: "input-pressure",
    label: "Pressure",
    detail: "Sensors PI6001–PI6003",
    tags: cokerSensorChannels.filter((c) => c.type === "Pressure Sensor").map((c) => c.tag),
  },
  {
    id: "input-coke-level",
    label: "Coke Level",
    detail: "CI6001",
    tags: cokerSensorChannels.filter((c) => c.type === "Coke level Sensor").map((c) => c.tag),
  },
  {
    id: "input-steam-rate",
    label: "Steam Rate",
    detail: "SI6001",
    tags: cokerSensorChannels.filter((c) => c.type === "Steam Rate Sensor").map((c) => c.tag),
  },
  {
    id: "input-flow-rate",
    label: "Flow Rate",
    detail: "FI6001",
    tags: cokerSensorChannels.filter((c) => c.type === "Flow Rate Sensor").map((c) => c.tag),
  },
  {
    id: "input-laser",
    label: "Laser scan",
    detail: "ZI6001 (campaign cadence)",
    tags: cokerSensorChannels.filter((c) => c.type === "Laser Scan Sensor").map((c) => c.tag),
  },
] as const

export type CokerAlertInputParameterId = (typeof cokerAlertInputParameters)[number]["id"]

/** FEA / analysis outputs (same strings as `cokerOutputDescriptors`). */
export const cokerAlertOutputParameters = cokerOutputDescriptors.map((name) => ({
  id: `output-${name.toLowerCase().replace(/\s+/g, "-")}`,
  label: name,
})) as { id: string; label: string }[]

/** Predicate kinds for mock condition builder (extendable). */
export const ALERT_PREDICATE_KINDS = [
  { id: "lt", label: "<", needs: "one" as const },
  { id: "le", label: "≤", needs: "one" as const },
  { id: "gt", label: ">", needs: "one" as const },
  { id: "ge", label: "≥", needs: "one" as const },
  { id: "between_open", label: "> & <", needs: "two" as const },
  { id: "between_left_closed", label: "≥ & <", needs: "two" as const },
  { id: "between_right_closed", label: "> & ≤", needs: "two" as const },
  { id: "between_closed", label: "≥ & ≤", needs: "two" as const },
  { id: "outside_open", label: "< or >", needs: "two" as const },
  { id: "outside_left", label: "≤ or >", needs: "two" as const },
  { id: "outside_right", label: "< or ≥", needs: "two" as const },
  { id: "outside_closed", label: "≤ or ≥", needs: "two" as const },
  { id: "slope_up", label: "Increase slope", needs: "window" as const },
  { id: "slope_down", label: "Decrease slope", needs: "window" as const },
] as const

export type AlertPredicateKindId = (typeof ALERT_PREDICATE_KINDS)[number]["id"]
