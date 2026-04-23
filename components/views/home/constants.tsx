"use client"

import type { ReactNode } from "react"
import { Activity, File, FileSpreadsheet, FileText, Link } from "lucide-react"
import { sites } from "@/lib/data"

export type SearchResult = {
  id: string
  label: string
  sublabel: string
  kind: "site" | "plant" | "equipment" | "dashboard"
  siteId?: string
  plantId?: string
  equipmentId?: string
  tab?: string
}

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = []
  for (const site of sites) {
    results.push({ id: `site-${site.id}`, label: site.name, sublabel: "Site", kind: "site", siteId: site.id })
    for (const plant of site.plants) {
      results.push({ id: `plant-${plant.id}`, label: plant.name, sublabel: `${site.name}`, kind: "plant", siteId: site.id, plantId: plant.id })
      for (const eq of plant.equipment) {
        results.push({ id: `equip-${eq.id}`, label: eq.name, sublabel: `${site.name} › ${plant.name}`, kind: "equipment", siteId: site.id, plantId: plant.id, equipmentId: eq.id })
        for (const tab of eq.tabs ?? []) {
          results.push({ id: `dash-${eq.id}-${tab}`, label: tab, sublabel: `${eq.name} · ${site.name} › ${plant.name}`, kind: "dashboard", siteId: site.id, plantId: plant.id, equipmentId: eq.id, tab })
        }
      }
    }
  }
  return results
}

export const SEARCH_INDEX = buildSearchIndex()

export const AI_NOTICES = [
  { severity: "warning" as const, title: "Coke Drum thermal cycling variance", body: "Thermal cycling variance is trending 12% above the 3-month rolling average. Review the Fatigue dashboard for detailed cycle count data.", location: "Coke Drum › Fatigue" },
  { severity: "warning" as const, title: "Pump ND.1X02 ΔP anomaly", body: "Differential pressure readings have been intermittently elevated over the past 72 hours. Inspection of the performance trend is recommended.", location: "Pump ND.1X02 › Pump Performance" },
  { severity: "info" as const, title: "HCU Maintenance window approaching", body: "Scheduled maintenance for the HCU is due in approximately 8 days based on last service records in the Maintenance dashboard.", location: "HCU › Maintenance" },
]

export const AI_ACTIONS = [
  { icon: <Activity className="w-4 h-4 text-amber-500" />, action: "Check Coke Drum Fatigue dashboard", reason: "Thermal cycling variance trending above threshold.", dashboardKind: "Coke Drum — Fatigue" },
  { icon: <Activity className="w-4 h-4 text-rose-500" />, action: "Review Pump ND.1X02 performance trends", reason: "Elevated ΔP detected in recent sensor data.", dashboardKind: "Pump ND.1X02 — Pump Performance" },
  { icon: <Activity className="w-4 h-4 text-blue-500" />, action: "Inspect HCU Maintenance schedule", reason: "Service window approaching based on last recorded date.", dashboardKind: "HCU — Maintenance" },
]

export const FILE_ICONS: Record<string, ReactNode> = {
  pdf: <File className="w-8 h-8 text-rose-500" />,
  docx: <FileText className="w-8 h-8 text-blue-500" />,
  xlsx: <FileSpreadsheet className="w-8 h-8 text-emerald-500" />,
  link: <Link className="w-8 h-8 text-purple-500" />,
}

export const FILE_BADGE_COLORS: Record<string, string> = {
  pdf: "bg-rose-500/10 text-rose-600",
  docx: "bg-blue-500/10 text-blue-600",
  xlsx: "bg-emerald-500/10 text-emerald-600",
  link: "bg-purple-500/10 text-purple-600",
}
