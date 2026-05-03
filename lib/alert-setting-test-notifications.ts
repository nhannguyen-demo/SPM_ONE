import { mainRoutes, findEquipmentSiteUnit } from "@/lib/main-routes"
import { useWorkspaceStore } from "@/lib/workspace/store"

/** Demo-only: enqueue `operational_alert` for the rule owner and each assignee (deduped). */
export function pushOperationalAlertDemo(input: {
  ruleName: string
  equipmentId: string
  ownerUserId: string
  assigneeUserIds: string[]
}): void {
  const loc = findEquipmentSiteUnit(input.equipmentId)
  const actionHref = loc
    ? mainRoutes.equipment(loc.siteId, loc.unitId, input.equipmentId)
    : null
  const push = useWorkspaceStore.getState().pushNotification
  const unique = [...new Set([input.ownerUserId, ...input.assigneeUserIds])]
  for (const userId of unique) {
    push({
      userId,
      category: "operational_alert",
      dashboardId: null,
      relatedShareId: null,
      relatedRequestId: null,
      actorUserId: input.ownerUserId,
      title: `Equipment alert: ${input.ruleName}`,
      body: "Preview — threshold crossing is not evaluated automatically.",
      actionHref,
    })
  }
}
