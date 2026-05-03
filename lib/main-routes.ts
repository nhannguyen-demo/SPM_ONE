import { sites } from "@/lib/data"
import type { NavigationPath } from "@/lib/store"

/** True for URL-backed main app shell routes (Home, Assets, Tools, Settings). */
export function isMainShellPath(pathname: string): boolean {
  return (
    pathname === "/home" ||
    pathname === "/settings" ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/tools/")
  )
}

/** True when the user is on Dashboard or Comms App Router pages (not main shell). */
export function isWorkspaceOrCommsPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/comms")
}

export function findEquipmentSiteUnit(equipmentId: string): {
  siteId: string
  unitId: string
} | null {
  for (const site of sites) {
    for (const unit of site.units) {
      if (unit.equipment.some((e) => e.id === equipmentId)) {
        return { siteId: site.id, unitId: unit.id }
      }
    }
  }
  return null
}

export const mainRoutes = {
  home: () => "/home" as const,
  site: (siteId: string) => `/assets/site/${encodeURIComponent(siteId)}` as const,
  plant: (siteId: string, unitId: string) =>
    `/assets/plant/${encodeURIComponent(siteId)}/${encodeURIComponent(unitId)}` as const,
  equipment: (siteId: string, unitId: string, equipmentId: string) =>
    `/assets/equipment/${encodeURIComponent(siteId)}/${encodeURIComponent(unitId)}/${encodeURIComponent(equipmentId)}` as const,
  /** Equipment Home with optional tab + dashboard popup (WorkspaceDashboard id). */
  equipmentHome: (
    siteId: string,
    unitId: string,
    equipmentId: string,
    opts?: { tab?: string; openDashboard?: string }
  ) => {
    const base = mainRoutes.equipment(siteId, unitId, equipmentId)
    const sp = new URLSearchParams()
    if (opts?.tab) sp.set("tab", opts.tab)
    if (opts?.openDashboard) sp.set("openDashboard", opts.openDashboard)
    const q = sp.toString()
    return (q ? `${base}?${q}` : base)
  },
  equipmentByEquipmentId: (equipmentId: string) => {
    const loc = findEquipmentSiteUnit(equipmentId)
    if (!loc) return null
    return mainRoutes.equipment(loc.siteId, loc.unitId, equipmentId)
  },
  dataSync: (equipmentId?: string | null) => {
    const q = equipmentId ? `?equipment=${encodeURIComponent(equipmentId)}` : ""
    return `/tools/data-sync${q}` as const
  },
  whatIf: () => "/tools/what-if" as const,
  documents: (equipmentId?: string | null) => {
    const q = equipmentId ? `?equipment=${encodeURIComponent(equipmentId)}` : ""
    return `/tools/documents${q}` as const
  },
  settings: () => "/settings" as const,
  alertSetting: (equipmentId?: string | null) => {
    const q = equipmentId ? `?equipment=${encodeURIComponent(equipmentId)}` : ""
    return `/tools/alert-setting${q}` as const
  },
}

export type MainRouteApply =
  | { view: "home" }
  | { view: "site"; siteId: string }
  | { view: "plant"; siteId: string; unitId: string }
  | { view: "equipment-home"; path: NavigationPath; openDashboard: string | null }
  | { view: "data-sync"; equipmentId: string | null }
  | { view: "whatIfTool" }
  | { view: "documents-tool"; equipmentId: string | null }
  | { view: "settings" }
  | { view: "alertSettingTool"; equipmentId: string | null }

/** Parse pathname + search into a store sync instruction. Returns null if not a main route. */
export function parseMainShellRoute(pathname: string, searchParams: URLSearchParams): MainRouteApply | null {
  if (pathname === "/home") return { view: "home" }

  const siteMatch = /^\/assets\/site\/([^/]+)$/.exec(pathname)
  if (siteMatch) return { view: "site", siteId: decodeURIComponent(siteMatch[1]) }

  const plantMatch = /^\/assets\/plant\/([^/]+)\/([^/]+)$/.exec(pathname)
  if (plantMatch) {
    return {
      view: "plant",
      siteId: decodeURIComponent(plantMatch[1]),
      unitId: decodeURIComponent(plantMatch[2]),
    }
  }

  const equipMatch = /^\/assets\/equipment\/([^/]+)\/([^/]+)\/([^/]+)$/.exec(pathname)
  if (equipMatch) {
    const siteId = decodeURIComponent(equipMatch[1])
    const unitId = decodeURIComponent(equipMatch[2])
    const equipmentId = decodeURIComponent(equipMatch[3])
    const site = sites.find((s) => s.id === siteId)
    const unit = site?.units.find((u) => u.id === unitId)
    const equipment = unit?.equipment.find((e) => e.id === equipmentId)
    const firstTab = equipment?.tabs?.[0] ?? "Overview"
    const tab = searchParams.get("tab") ?? firstTab
    const openDashboard = searchParams.get("openDashboard")
    return {
      view: "equipment-home",
      path: { site: siteId, plant: unitId, equipment: equipmentId, tab },
      openDashboard,
    }
  }

  if (pathname === "/tools/data-sync") {
    return { view: "data-sync", equipmentId: searchParams.get("equipment") }
  }
  if (pathname === "/tools/what-if") return { view: "whatIfTool" }
  if (pathname === "/tools/documents") {
    return { view: "documents-tool", equipmentId: searchParams.get("equipment") }
  }

  if (pathname === "/settings") return { view: "settings" }

  if (pathname === "/tools/alert-setting") {
    return { view: "alertSettingTool", equipmentId: searchParams.get("equipment") }
  }

  return null
}

/** Default main-shell URL when switching from /dashboard or /comms to a module rail target. */
export function fallbackMainRouteForModule(
  module: import("@/lib/store").ActiveModule,
  currentPath: NavigationPath
): string {
  switch (module) {
    case "home":
      return mainRoutes.home()
    case "assets": {
      if (currentPath.equipment && currentPath.site && currentPath.plant) {
        return mainRoutes.equipment(currentPath.site, currentPath.plant, currentPath.equipment)
      }
      if (currentPath.plant && currentPath.site) {
        return mainRoutes.plant(currentPath.site, currentPath.plant)
      }
      if (currentPath.site) return mainRoutes.site(currentPath.site)
      return mainRoutes.site("site-x")
    }
    case "insights":
      return mainRoutes.whatIf()
    case "workspace":
    case "comms":
      return mainRoutes.home()
    case "settings":
      return mainRoutes.settings()
    default:
      return mainRoutes.home()
  }
}
