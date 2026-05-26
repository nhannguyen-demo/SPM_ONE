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
  viewedDataIds?: string[]
  context?: DashboardTimeContext
}

/**
 * Routes a grid tile to the correct renderer:
 * 1. Parameter-driven (parameterId + visualTypeId) → CokerTemplateView
 * 2. Reference widget (referenceWidgetId) → CokerTemplateView
 * 3. Legacy Coker templateKey → CokerTemplateView
 * 4. Everything else → WidgetViewResolver (legacy non-Coker widgets)
 */
export function DashboardWidgetBody({
  widget,
  equipmentId,
  scenarioRuns,
  viewedDataIds,
  context,
}: Props) {
  const isCoker = getEquipmentTypeKey(equipmentId) === "coker"

  // 1. New parameter-driven widget
  if (widget.parameterId && widget.visualTypeId) {
    return (
      <CokerTemplateView
        parameterId={widget.parameterId}
        visualTypeId={widget.visualTypeId}
        config={widget.config}
        equipmentId={equipmentId}
        context={context}
      />
    )
  }

  // 2. Reference / tool widget
  if (widget.referenceWidgetId) {
    return (
      <CokerTemplateView
        referenceWidgetId={widget.referenceWidgetId}
        equipmentId={equipmentId}
        context={context}
      />
    )
  }

  // 3. Legacy Coker templateKey widget
  if (isCoker && widget.templateKey) {
    return (
      <CokerTemplateView
        templateKey={widget.templateKey}
        equipmentId={equipmentId}
        context={context}
      />
    )
  }

  // Guard: viewType = "coker-template" but missing all routing keys
  if (widget.viewType === LEGACY_COKER_VIEW) {
    return (
      <div className="text-xs text-muted-foreground p-2">
        Catalog widget is missing routing information (templateKey, parameterId, or referenceWidgetId).
      </div>
    )
  }

  // 4. Legacy non-Coker widget
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
