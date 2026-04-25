"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useAppStore, type WhatIfRunSession } from "@/lib/store"
import { mockWhatIfRunSessions, sites } from "@/lib/data"

export const RUN_STEPS = [
  "Ingesting parameter files and typed values",
  "Validating parameter inputs",
  "Running scenario engine",
  "Computing dashboard-quality datasets",
  "Finalising results",
]

export function findAssetPathForEquipment(equipmentId: string): { site: string; plant: string; tab: string } {
  for (const site of sites) {
    for (const plant of site.plants) {
      const eq = plant.equipment.find((e) => e.id === equipmentId)
      if (eq) return { site: site.id, plant: plant.id, tab: eq.tabs?.[0] ?? "Overview" }
    }
  }
  return { site: "site-x", plant: "plant-1", tab: "Overview" }
}

export function useSeedMockHistory() {
  const { whatIfRunSessions, addWhatIfRunSession } = useAppStore()
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || whatIfRunSessions.length > 0) return
    seeded.current = true
    ;[...mockWhatIfRunSessions].reverse().forEach((s) => addWhatIfRunSession(s as unknown as WhatIfRunSession))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

export function StatusBadge({ status }: { status: WhatIfRunSession["status"] }) {
  const map = {
    success: { label: "Success", cls: "bg-emerald-500/10 text-emerald-600" },
    failed: { label: "Failed", cls: "bg-rose-500/10 text-rose-600" },
    running: { label: "Running", cls: "bg-blue-500/10 text-blue-600 animate-pulse" },
    queued: { label: "Queued", cls: "bg-amber-500/10 text-amber-600" },
  }
  const { label, cls } = map[status]
  return <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", cls)}>{label}</span>
}
