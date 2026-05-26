"use client"

import { useMemo, useState } from "react"
import {
  Search,
  Plus,
  BarChart3,
  Table,
  LineChart,
  Gauge,
  Layers,
  MapPin,
  Clock,
  Box,
  Thermometer,
  Waves,
  Droplets,
  Activity,
  AlertTriangle,
  Zap,
  Timer,
  CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SPM_WIDGET_DRAG_TYPE, type LibraryModule } from "@/components/module-library"
import {
  COKER_PARAMETERS,
  COKER_REFERENCE_WIDGETS,
  COKER_V1_VERSION,
} from "@/lib/equipment-packs"
import type { CokerParameterDef, CokerReferenceWidgetDef } from "@/lib/equipment-packs/types"

// ---------------------------------------------------------------------------
// Drag payloads
// ---------------------------------------------------------------------------

/** Drag payload for a parameter (triggers the 3-step creation popup). */
export type ParameterDragPayload = LibraryModule & {
  mode: "parameter"
  parameterId: string
  packVersion: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

/** Drag payload for a reference/tool widget (placed directly). */
export type ReferenceDragPayload = LibraryModule & {
  mode: "reference"
  referenceWidgetId: string
  packVersion: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

/** Drag payload for a legacy catalog template (backward compat). */
export type CatalogDragPayload = LibraryModule & {
  mode: "catalog"
  templateKey: string
  packVersion: string
  defaultW: number
  defaultH: number
  minW: number
  minH: number
}

export type AnyDragPayload = ParameterDragPayload | ReferenceDragPayload | CatalogDragPayload

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const PARAMETER_ICONS: Record<string, React.ReactNode> = {
  temperature: <Thermometer className="w-4 h-4" />,
  pressure: <Gauge className="w-4 h-4" />,
  coke_level: <Layers className="w-4 h-4" />,
  steam_rate: <Waves className="w-4 h-4" />,
  flow_rate: <Droplets className="w-4 h-4" />,
  bulging: <AlertTriangle className="w-4 h-4" />,
  fatigue_damage: <Activity className="w-4 h-4" />,
  stress: <Zap className="w-4 h-4" />,
  remaining_life: <Timer className="w-4 h-4" />,
  pslf: <AlertTriangle className="w-4 h-4" />,
  ovality: <CircleDot className="w-4 h-4" />,
  displacement: <BarChart3 className="w-4 h-4" />,
  crack: <AlertTriangle className="w-4 h-4" />,
}

const REFERENCE_ICONS: Record<string, React.ReactNode> = {
  equipment_data: <Table className="w-4 h-4" />,
  model_3d: <Box className="w-4 h-4" />,
  sensor_location: <MapPin className="w-4 h-4" />,
  time_range: <Clock className="w-4 h-4" />,
  cycle_selector: <LineChart className="w-4 h-4" />,
}

// ---------------------------------------------------------------------------
// Section labels
// ---------------------------------------------------------------------------

const SECTION_LABELS = {
  operational_input: "Operational Inputs",
  inspection: "Inspection",
  analysis_output: "Analysis Outputs",
} as const

type LibrarySection = "parameters" | "reference"

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogModuleLibrary({
  equipmentId: _equipmentId,
  onClose: _onClose,
  onAddModule,
  onWidgetDragStart,
  onWidgetDragEnd,
}: {
  equipmentId: string
  onClose?: () => void
  onAddModule?: (mod: AnyDragPayload) => void
  onWidgetDragStart?: (mod: AnyDragPayload) => void
  onWidgetDragEnd?: () => void
}) {
  const [section, setSection] = useState<LibrarySection>("parameters")
  const [q, setQ] = useState("")

  const filteredParams = useMemo(() => {
    if (!q.trim()) return COKER_PARAMETERS
    const m = q.toLowerCase()
    return COKER_PARAMETERS.filter(
      (p) =>
        p.displayName.toLowerCase().includes(m) ||
        p.key.toLowerCase().includes(m) ||
        (p.unit ?? "").toLowerCase().includes(m)
    )
  }, [q])

  const filteredRefs = useMemo(() => {
    if (!q.trim()) return COKER_REFERENCE_WIDGETS
    const m = q.toLowerCase()
    return COKER_REFERENCE_WIDGETS.filter(
      (r) => r.displayName.toLowerCase().includes(m) || r.key.toLowerCase().includes(m)
    )
  }, [q])

  const toParamPayload = (p: CokerParameterDef): ParameterDragPayload => ({
    id: p.key,
    name: p.displayName,
    icon: "activity",
    mode: "parameter",
    parameterId: p.key,
    packVersion: COKER_V1_VERSION,
    defaultW: p.defaultVisualTypeKey === "kpi_card" ? 2 : 6,
    defaultH: p.defaultVisualTypeKey === "kpi_card" ? 2 : 4,
    minW: p.defaultVisualTypeKey === "kpi_card" ? 2 : 4,
    minH: p.defaultVisualTypeKey === "kpi_card" ? 2 : 3,
  })

  const toRefPayload = (r: CokerReferenceWidgetDef): ReferenceDragPayload => ({
    id: r.key,
    name: r.displayName,
    icon: "grid",
    mode: "reference",
    referenceWidgetId: r.key,
    packVersion: COKER_V1_VERSION,
    defaultW: r.defaultW,
    defaultH: r.defaultH,
    minW: r.minW,
    minH: r.minH,
  })

  // Group parameters by library section
  const grouped = useMemo(() => {
    const sections: Record<string, CokerParameterDef[]> = {}
    for (const p of filteredParams) {
      const s = p.librarySection
      if (!sections[s]) sections[s] = []
      sections[s]!.push(p)
    }
    return sections
  }, [filteredParams])

  return (
    <div className="w-full bg-card flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="font-semibold text-foreground text-sm">Widget Library</h3>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search parameters…"
            className="w-full h-8 pl-9 pr-3 bg-secondary rounded-md text-xs"
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border">
        {(["parameters", "reference"] as LibrarySection[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={cn(
              "flex-1 py-2 text-xs font-medium border-b-2 transition-colors",
              section === s
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {s === "parameters" ? "Parameters" : "Reference & Tools"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {section === "parameters" ? (
          <>
            {Object.keys(grouped).length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">No parameters found.</p>
            )}
            {(["operational_input", "inspection", "analysis_output"] as const).map((grp) => {
              const params = grouped[grp]
              if (!params?.length) return null
              return (
                <div key={grp}>
                  <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {SECTION_LABELS[grp]}
                  </div>
                  {params.map((p) => {
                    const payload = toParamPayload(p)
                    return (
                      <DraggableItem
                        key={p.key}
                        icon={PARAMETER_ICONS[p.key] ?? <BarChart3 className="w-4 h-4" />}
                        name={p.displayName}
                        sub={p.unit ? `${p.validVisualTypeKeys.length} visual types · ${p.unit}` : `${p.validVisualTypeKeys.length} visual types`}
                        badge={p.parameterType === "input" ? "INPUT" : "OUTPUT"}
                        badgeColor={p.parameterType === "input" ? "bg-sky-500/10 text-sky-700" : "bg-violet-500/10 text-violet-700"}
                        payload={payload}
                        onDragStart={onWidgetDragStart}
                        onDragEnd={onWidgetDragEnd}
                        onClick={onAddModule}
                      />
                    )
                  })}
                </div>
              )
            })}
            <div className="px-3 pt-4 pb-2 text-[9px] text-muted-foreground text-center">
              Drag a parameter to the dashboard to choose a visual type.
            </div>
          </>
        ) : (
          <>
            {filteredRefs.length === 0 && (
              <p className="text-xs text-muted-foreground px-3 py-4 text-center">No reference widgets found.</p>
            )}
            <div className="pt-1">
              {filteredRefs.map((r) => {
                const payload = toRefPayload(r)
                return (
                  <DraggableItem
                    key={r.key}
                    icon={REFERENCE_ICONS[r.key] ?? <Box className="w-4 h-4" />}
                    name={r.displayName}
                    sub={r.description}
                    payload={payload}
                    onDragStart={onWidgetDragStart}
                    onDragEnd={onWidgetDragEnd}
                    onClick={onAddModule}
                  />
                )
              })}
            </div>
            <div className="px-3 pt-4 pb-2 text-[9px] text-muted-foreground text-center">
              Reference widgets are placed directly — no popup.
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Draggable list item
// ---------------------------------------------------------------------------

function DraggableItem({
  icon,
  name,
  sub,
  badge,
  badgeColor,
  payload,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  icon: React.ReactNode
  name: string
  sub?: string
  badge?: string
  badgeColor?: string
  payload: AnyDragPayload
  onDragStart?: (mod: AnyDragPayload) => void
  onDragEnd?: () => void
  onClick?: (mod: AnyDragPayload) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(SPM_WIDGET_DRAG_TYPE, JSON.stringify(payload))
        e.dataTransfer.effectAllowed = "copy"
        onDragStart?.(payload)
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onClick?.(payload)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.(payload)
        }
      }}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary text-left cursor-grab active:cursor-grabbing select-none"
    >
      <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate">{name}</span>
          {badge && (
            <span className={cn("text-[9px] px-1 py-0.5 rounded font-medium flex-shrink-0", badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        {sub && <div className="text-[10px] text-muted-foreground truncate">{sub}</div>}
      </div>
      <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 opacity-60" />
    </div>
  )
}
