"use client"

import type { WhatIfRunSession } from "@/lib/store"
import type { GridWidget } from "@/components/dashboard/layouts"
import { WidgetViewResolver, WidgetErrorBoundary } from "@/components/dashboard/widget-view-resolver"
import { CokerTemplateView } from "@/components/dashboard/coker-template-view"
import { LEGACY_COKER_VIEW } from "@/lib/equipment-packs"
import type { DashboardTimeContext } from "@/components/dashboard/coker-template-view"
import { getEquipmentTypeKey } from "@/lib/data"

type Props = {
  widget: GridWidget
  equipmentId: string
  scenarioRuns?: WhatIfRunSession[]
  /** When set, drives What-If overlay series in legacy `WidgetViewResolver` tiles. */
  viewedDataIds?: string[]
  context?: DashboardTimeContext
}

/**
 * Resolves a grid tile: Coker catalog templates vs legacy `WidgetViewResolver`.
 */
export function DashboardWidgetBody({
  widget,
  equipmentId,
  scenarioRuns,
  viewedDataIds,
  context,
}: Props) {
  if (widget.viewType === LEGACY_COKER_VIEW && !widget.templateKey) {
    return (
      <div className="text-xs text-muted-foreground p-2">Catalog widget is missing a template key.</div>
    )
  }
  if (widget.templateKey && getEquipmentTypeKey(equipmentId) === "coker") {
    return (
      <CokerTemplateView
        templateKey={widget.templateKey}
        equipmentId={equipmentId}
        context={context}
      />
    )
  }
  return (
    <WidgetViewResolver
      viewType={widget.viewType}
      equipmentId={equipmentId}
      viewedDataIds={viewedDataIds}
      scenarioRuns={scenarioRuns}
    />
  )
}

export { WidgetErrorBoundary, LEGACY_COKER_VIEW }
