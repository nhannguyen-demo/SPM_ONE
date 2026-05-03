"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { parseMainShellRoute, type MainRouteApply } from "@/lib/main-routes"

function applyParsedRoute(apply: MainRouteApply) {
  const store = useAppStore.getState()
  switch (apply.view) {
    case "home":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setCurrentView("home")
      break
    case "site":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setCurrentPath({ site: apply.siteId })
      store.setCurrentView("site")
      break
    case "plant":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setCurrentPath({ site: apply.siteId, plant: apply.unitId })
      store.setCurrentView("plant")
      break
    case "equipment-home":
      store.setCurrentPath(apply.path)
      store.setCurrentView("equipment-home")
      store.setEquipmentHomeAutoOpenTab(apply.openDashboard)
      break
    case "data-sync":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setPreFilterEquipmentId(apply.equipmentId)
      store.setCurrentView("data-sync")
      break
    case "whatIfTool":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setPreFilterEquipmentId(null)
      store.setCurrentView("whatIfTool")
      break
    case "documents-tool":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setPreFilterEquipmentId(apply.equipmentId)
      store.setCurrentView("documents-tool")
      break
    case "settings":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setPreFilterEquipmentId(null)
      store.setCurrentView("settings")
      break
    case "alertSettingTool":
      store.setEquipmentHomeAutoOpenTab(null)
      store.setPreFilterEquipmentId(apply.equipmentId)
      store.setCurrentView("alertSettingTool")
      break
  }
}

/**
 * Keeps Zustand navigation slices aligned with URL for main-shell routes
 * (`/home`, `/assets/*`, `/tools/*`, `/settings`, `/tools/alert-setting`).
 */
export function MainRouteSync() {
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()

  useEffect(() => {
    const parsed = parseMainShellRoute(pathname, searchParams)
    if (parsed) applyParsedRoute(parsed)
  }, [pathname, searchParams.toString()])

  return null
}
