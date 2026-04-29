import type { EquipmentTypeKey, ParameterCategory } from "./types"
import { COKER_V1_PACK, getCokerTemplateDef } from "./coker-v1"
import type { CatalogWidgetTemplateDef } from "./types"

export * from "./types"
export { COKER_V1_PACK, COKER_V1_VERSION, getCokerTemplateDef } from "./coker-v1"

/** UI category labels (Module Library tabs). */
export const CATEGORY_LABEL: Record<ParameterCategory, string> = {
  asset_information: "Asset Information",
  asset_efficiency: "Asset Efficiency",
  event_visualization: "Event Visualization",
  other: "Other",
}

const ORDER: ParameterCategory[] = [
  "asset_information",
  "asset_efficiency",
  "event_visualization",
  "other",
]

export function listCategoryOrder(): ParameterCategory[] {
  return ORDER
}

export function getPackForEquipmentType(key: EquipmentTypeKey) {
  if (key === "coker") return COKER_V1_PACK
  return null
}

export function getCatalogTemplatesForType(
  key: EquipmentTypeKey,
  _addonKeys: string[] = []
): CatalogWidgetTemplateDef[] {
  const pack = getPackForEquipmentType(key)
  if (!pack) return []
  // Add-ons: in v1, reserved — append when product publishes extra template keys.
  return pack.templates
}

export function findTemplateInPack(
  equipmentTypeKey: EquipmentTypeKey,
  templateKey: string
): CatalogWidgetTemplateDef | undefined {
  if (equipmentTypeKey === "coker") return getCokerTemplateDef(templateKey)
  return undefined
}

export const LEGACY_COKER_VIEW = "coker-template"
