import type { GridWidget } from "@/components/dashboard/layouts"
import { getEquipmentTypeKey } from "@/lib/data"
import { COKER_V1_VERSION } from "@/lib/equipment-packs/coker-v1"

/** Mirrors client `saveDashboardWidgets` pack-version rule (no client imports). */
export function nextKnowledgePackVersion(
  equipmentId: string,
  widgets: GridWidget[],
  previous: string | null | undefined
): string | null {
  const hasCatalog = widgets.some((w) => w.templateKey)
  const kType = getEquipmentTypeKey(equipmentId)
  if (hasCatalog && kType === "coker") return COKER_V1_VERSION
  return previous ?? null
}
