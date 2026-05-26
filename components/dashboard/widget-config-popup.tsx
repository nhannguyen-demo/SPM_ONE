"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ChevronRight, Check } from "lucide-react"
import { getCokerParameter, VISUAL_TYPE_DISPLAY } from "@/lib/equipment-packs/coker-v1"
import type { GridWidget } from "@/components/dashboard/layouts"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WidgetCreationResult = {
  parameterId: string
  visualTypeId: string
  title: string
  config: Record<string, unknown>
  layout: { w: number; h: number; minW: number; minH: number }
}

type Step = 1 | 2 | 3

// ---------------------------------------------------------------------------
// Visual type descriptions
// ---------------------------------------------------------------------------

const VISUAL_TYPE_DESCRIPTIONS: Record<string, string> = {
  kpi_card: "Single value card — compact, shows latest/max/min/avg with optional RAG.",
  time_series: "Line chart over time — shows trends across sensors.",
  bar_chart: "Bar chart — compare values by elevation, cycle, or time bucket.",
  area_chart: "Area chart — shows cumulative trend with filled region.",
  gauge: "Gauge bar — shows current value against zone thresholds.",
  heatmap_2d: "2D heatmap — spatial distribution on vessel shell.",
  damage_table: "Table — top damage locations with azimuth and elevation.",
  severity_table: "Table — severity list with PSLF and likelihood ranking.",
  crack_table: "Table — crack details with Lr / Kr FAD values.",
  fad_chart: "FAD Chart — Failure Assessment Diagram (Lr vs Kr).",
  polar_plot: "Polar / radar plot — directional values (N/S/E/W).",
  ovality_chart: "Polar cross-section — measured vs nominal bore.",
  unwrapped_map: "Unwrapped shell map — crack / flaw location reference image.",
}

// Default sizes per visual type
const VISUAL_TYPE_SIZES: Record<string, { w: number; h: number; minW: number; minH: number }> = {
  kpi_card:       { w: 2, h: 2, minW: 2, minH: 2 },
  time_series:    { w: 6, h: 4, minW: 4, minH: 3 },
  bar_chart:      { w: 5, h: 3, minW: 4, minH: 2 },
  area_chart:     { w: 6, h: 3, minW: 4, minH: 2 },
  gauge:          { w: 4, h: 4, minW: 3, minH: 3 },
  heatmap_2d:     { w: 7, h: 5, minW: 5, minH: 4 },
  damage_table:   { w: 6, h: 3, minW: 4, minH: 2 },
  severity_table: { w: 5, h: 4, minW: 4, minH: 3 },
  crack_table:    { w: 5, h: 4, minW: 4, minH: 3 },
  fad_chart:      { w: 5, h: 4, minW: 4, minH: 3 },
  polar_plot:     { w: 4, h: 4, minW: 3, minH: 3 },
  ovality_chart:  { w: 5, h: 5, minW: 4, minH: 4 },
  unwrapped_map:  { w: 5, h: 6, minW: 4, minH: 4 },
  data_table:     { w: 4, h: 5, minW: 3, minH: 3 },
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WidgetConfigPopup({
  parameterId,
  open,
  onClose,
  onConfirm,
}: {
  parameterId: string
  open: boolean
  onClose: () => void
  onConfirm: (result: WidgetCreationResult) => void
}) {
  const param = getCokerParameter(parameterId)
  const [step, setStep] = useState<Step>(1)
  const [selectedVisualType, setSelectedVisualType] = useState<string>(
    param?.defaultVisualTypeKey ?? param?.validVisualTypeKeys[0] ?? "kpi_card"
  )
  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [title, setTitle] = useState(param?.displayName ?? "")

  if (!param) return null

  const handleClose = () => {
    setStep(1)
    setConfig({})
    setTitle(param.displayName)
    setSelectedVisualType(param.defaultVisualTypeKey ?? param.validVisualTypeKeys[0] ?? "kpi_card")
    onClose()
  }

  const handleConfirm = () => {
    const sizes = VISUAL_TYPE_SIZES[selectedVisualType] ?? { w: 6, h: 4, minW: 4, minH: 3 }
    onConfirm({
      parameterId,
      visualTypeId: selectedVisualType,
      title: title.trim() || param.displayName,
      config,
      layout: sizes,
    })
    handleClose()
  }

  const handleOpenChange = (o: boolean) => {
    if (!o) handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {([1, 2, 3] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : step > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s ? <Check className="w-3 h-3" /> : s}
                </div>
              </div>
            ))}
          </div>
          <DialogTitle>
            {step === 1 && `Choose visual type — ${param.displayName}`}
            {step === 2 && `Configure — ${VISUAL_TYPE_DISPLAY[selectedVisualType] ?? selectedVisualType}`}
            {step === 3 && "Name your widget"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2">
          {step === 1 && (
            <StepVisualType
              param={param}
              selected={selectedVisualType}
              onSelect={setSelectedVisualType}
            />
          )}
          {step === 2 && (
            <StepConfig
              parameterId={parameterId}
              visualTypeId={selectedVisualType}
              config={config}
              onChange={setConfig}
            />
          )}
          {step === 3 && (
            <StepName
              value={title}
              onChange={setTitle}
              paramName={param.displayName}
              visualTypeName={VISUAL_TYPE_DISPLAY[selectedVisualType] ?? selectedVisualType}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}>
              Back
            </Button>
          )}
          {step < 3 && (
            <Button onClick={() => setStep((s) => Math.min(3, s + 1) as Step)}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleConfirm}>
              Add Widget
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — Choose visual type
// ---------------------------------------------------------------------------

function StepVisualType({
  param,
  selected,
  onSelect,
}: {
  param: ReturnType<typeof getCokerParameter>
  selected: string
  onSelect: (key: string) => void
}) {
  if (!param) return null
  return (
    <div className="grid grid-cols-2 gap-2">
      {param.validVisualTypeKeys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className={cn(
            "flex flex-col gap-1 p-3 rounded-lg border text-left transition-colors",
            selected === key
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/30 hover:bg-secondary/60"
          )}
        >
          <div className="flex items-center gap-1.5">
            {selected === key && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
            <span className="text-sm font-medium">
              {VISUAL_TYPE_DISPLAY[key] ?? key}
            </span>
            {key === param.defaultVisualTypeKey && (
              <span className="text-[9px] bg-primary/10 text-primary px-1 rounded ml-auto">
                Default
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            {VISUAL_TYPE_DESCRIPTIONS[key] ?? "Visual representation."}
          </p>
        </button>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Configure
// ---------------------------------------------------------------------------

function StepConfig({
  parameterId,
  visualTypeId,
  config,
  onChange,
}: {
  parameterId: string
  visualTypeId: string
  config: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })

  // KPI card config — shared across many parameters
  if (visualTypeId === "kpi_card") {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Aggregation</Label>
          <div className="flex gap-2 mt-1">
            {(["latest", "max", "min", "avg"] as const).map((agg) => (
              <button
                key={agg}
                type="button"
                onClick={() => set("aggregation", agg)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border",
                  (config.aggregation ?? "latest") === agg
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary"
                )}
              >
                {agg.charAt(0).toUpperCase() + agg.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Time series / area chart config
  if (visualTypeId === "time_series" || visualTypeId === "area_chart") {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Time Range</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {(["7d", "30d", "last_cycle"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set("timeRange", r)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border",
                  (config.timeRange ?? "7d") === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary"
                )}
              >
                {r === "7d" ? "Last 7 days" : r === "30d" ? "Last 30 days" : "Last cycle"}
              </button>
            ))}
          </div>
        </div>
        {(parameterId === "temperature" || parameterId === "pressure") && (
          <div>
            <Label className="text-xs">Show all sensors</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Up to 3 sensor traces will be shown on the same chart.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Bar chart config
  if (visualTypeId === "bar_chart") {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Group by</Label>
          <div className="flex gap-2 mt-1">
            {(["elevation", "cycle"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => set("groupBy", g)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border",
                  (config.groupBy ?? "elevation") === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary"
                )}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Damage table config
  if (visualTypeId === "damage_table") {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Show top N locations</Label>
          <div className="flex gap-2 mt-1">
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("topN", n)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border",
                  (config.topN ?? 5) === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary"
                )}
              >
                Top {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Severity table config
  if (visualTypeId === "severity_table") {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-xs">Likelihood filter</Label>
          <div className="flex gap-2 mt-1">
            {(["all", "LIKELY", "POSSIBLE"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => set("likelihoodFilter", f)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded border",
                  (config.likelihoodFilter ?? "all") === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-secondary"
                )}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Gauge config
  if (visualTypeId === "gauge") {
    return (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>The gauge uses standard zone thresholds for this parameter. No additional configuration needed.</p>
      </div>
    )
  }

  // Default — no config required
  return (
    <div className="text-xs text-muted-foreground py-2">
      No additional configuration required for this visual type.
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Name
// ---------------------------------------------------------------------------

function StepName({
  value,
  onChange,
  paramName,
  visualTypeName,
}: {
  value: string
  onChange: (v: string) => void
  paramName: string
  visualTypeName: string
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="widget-title" className="text-xs">Widget title</Label>
        <Input
          id="widget-title"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${paramName} — ${visualTypeName}`}
          className="mt-1"
          autoFocus
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Shown in the widget header on the dashboard.
        </p>
      </div>
      <div className="rounded-md bg-muted/30 p-3 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Parameter</span>
          <span className="font-medium">{paramName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Visual type</span>
          <span className="font-medium">{visualTypeName}</span>
        </div>
      </div>
    </div>
  )
}
