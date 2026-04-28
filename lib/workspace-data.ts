/**
 * lib/workspace-data.ts
 *
 * Canonical bridge between the Workspace store (WorkspaceDashboard records)
 * and every module that needs to render dashboard cards:
 *   - Equipment Home Page (DashboardSection, DashboardPopup)
 *   - Home Page (RecentDashboardsModule, FavoriteDashboardsModule)
 *   - Site Overview / Plant Overview (DashboardTabStack)
 *   - What-If tool (Compare Data → Equipment Home auto-open)
 *
 * No React imports. Pure utility — safe to call from hooks, selectors, and
 * plain callbacks alike.
 */

import { sites } from "@/lib/data"
import type { WorkspaceDashboard } from "@/lib/workspace/types"

/* ─── Adapter type ──────────────────────────────────────────────────────────── */

/**
 * Drop-in structural replacement for the legacy `dashboardCards[0]` shape.
 * Consumed by DashboardCard, DashboardTabStack, and DashboardCardRow without
 * any rendering changes.
 */
export interface EquipmentHomeDashCard {
  /** WorkspaceDashboard.id — canonical key across all modules. */
  id: string
  /** Equipment display name (e.g. "Coke Drum"). */
  equipment: string
  /** Equipment id (e.g. "equipment-a"). */
  equipId: string
  /** Dashboard display name — rendered as the card title. */
  tag: string
  /** Deterministic mock metrics derived from the dashboard id. */
  metrics: { value1: string; value2: string }
}

/* ─── Equipment name lookup ─────────────────────────────────────────────────── */

const EQUIPMENT_NAME_CACHE = new Map<string, string>()

function getEquipmentName(equipmentId: string): string {
  if (EQUIPMENT_NAME_CACHE.has(equipmentId)) {
    return EQUIPMENT_NAME_CACHE.get(equipmentId)!
  }
  for (const site of sites) {
    for (const plant of site.plants) {
      const eq = plant.equipment.find((e) => e.id === equipmentId)
      if (eq) {
        EQUIPMENT_NAME_CACHE.set(equipmentId, eq.name)
        return eq.name
      }
    }
  }
  return equipmentId
}

/* ─── Deterministic mock metrics ────────────────────────────────────────────── */

/** djb2 hash — deterministic, collision-resistant enough for mock display. */
function djb2(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i)
  }
  return h >>> 0
}

function mockMetrics(dashboardId: string): { value1: string; value2: string } {
  const h = djb2(dashboardId)
  const pct = 70 + (h % 30) // 70–99
  const decimals = ((h >> 8) % 90) / 1000 // 0.000–0.089
  return {
    value1: `${pct}%`,
    value2: `${decimals.toFixed(3)}%`,
  }
}

/* ─── Primary adapter ───────────────────────────────────────────────────────── */

/**
 * Returns EquipmentHomeDashCard entries for all published, non-deleted
 * dashboards belonging to the given equipment, sorted newest-published first.
 */
export function getPublishedDashboardsForEquipment(
  equipmentId: string,
  dashboards: WorkspaceDashboard[],
): EquipmentHomeDashCard[] {
  const equipmentName = getEquipmentName(equipmentId)
  return dashboards
    .filter(
      (d) =>
        d.equipmentId === equipmentId &&
        d.lifecycleStatus === "published" &&
        !d.deletedAt,
    )
    .sort((a, b) => {
      const ta = a.publishedAt ?? a.createdAt
      const tb = b.publishedAt ?? b.createdAt
      return tb > ta ? 1 : -1
    })
    .map((d) => ({
      id: d.id,
      equipment: equipmentName,
      equipId: d.equipmentId,
      tag: d.name,
      metrics: mockMetrics(d.id),
    }))
}

/* ─── Single-dashboard lookup ───────────────────────────────────────────────── */

export function getDashboardById(
  id: string,
  dashboards: WorkspaceDashboard[],
): WorkspaceDashboard | undefined {
  return dashboards.find((d) => d.id === id)
}

/* ─── Legacy tag → workspace ID mapping ─────────────────────────────────────── */

/**
 * Maps "equipmentId:legacyTabName" to the stable WorkspaceDashboard.id from
 * the seed. This is the authoritative bridge for modules that still navigate
 * using legacy tab name strings (What-If, Site/Plant overview click handlers).
 *
 * Seed IDs are deterministic; they do not change across reloads.
 */
export const LEGACY_TAG_TO_WORKSPACE_ID: Record<string, string> = {
  // Coke Drum (equipment-a)
  "equipment-a:Demo Engineer Team's Dashboard": "dash-legacy-coker-demo",
  "equipment-a:Monitoring": "dash-nhan-coker-mon",
  "equipment-a:Process": "dash-legacy-coker-proc",
  "equipment-a:Fatigue": "dash-legacy-coker-fat",
  "equipment-a:Bulging": "dash-legacy-coker-bul",
  "equipment-a:Cracking": "dash-nhan-coker-cra",
  // HCU (equipment-b)
  "equipment-b:Overview": "dash-ben-hcu-over",
  "equipment-b:Reactor Health": "dash-legacy-hcu-rea",
  "equipment-b:Process Control": "dash-legacy-hcu-proc",
  "equipment-b:Maintenance": "dash-legacy-hcu-maint",
  // SMR Unit A (equipment-c)
  "equipment-c:SMR Pigtail Integrity": "dash-nhan-smr-pig",
}

/**
 * Resolves a WorkspaceDashboard.id from a legacy (equipmentId, tabName) pair.
 *
 * Resolution order:
 *  1. Hard-coded LEGACY_TAG_TO_WORKSPACE_ID map (seed-stable IDs)
 *  2. Store lookup by exact name match among published dashboards
 *  3. First published dashboard for the equipment (final fallback)
 */
export function getWorkspaceDashboardIdForTag(
  equipmentId: string,
  tag: string,
  dashboards: WorkspaceDashboard[],
): string | undefined {
  // 1. Canonical map
  const mapped = LEGACY_TAG_TO_WORKSPACE_ID[`${equipmentId}:${tag}`]
  if (mapped) return mapped

  // 2. Name match in store
  const byName = dashboards.find(
    (d) =>
      d.equipmentId === equipmentId &&
      d.name === tag &&
      d.lifecycleStatus === "published" &&
      !d.deletedAt,
  )
  if (byName) return byName.id

  // 3. Any published dashboard for this equipment
  return dashboards.find(
    (d) =>
      d.equipmentId === equipmentId &&
      d.lifecycleStatus === "published" &&
      !d.deletedAt,
  )?.id
}
