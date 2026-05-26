"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getCokerTemplateDef } from "@/lib/equipment-packs/coker-v1"
import { COKER_WIDGET_IMAGE } from "@/lib/equipment-packs/coker-widget-images"
import {
  mockBulgeRows,
  mockCrackRows,
  mockDamageByCycle,
  mockDisplacementPolar,
  mockElevationBars,
  mockEquipmentDataRows,
  mockFadLine,
  mockFlowRateSeries,
  mockOvalityData,
  mockPressureSeries,
  mockPslfKpi,
  mockRemainingLifeGauge,
  mockSeriesLastCycle,
  mockSeriesMulti,
  mockSeriesSelectedCycle,
  mockSteamRateSeries,
  mockTemperatureSeries,
  mockTopDamageRows,
  PRESSURE_SENSOR_LABELS,
  TEMPERATURE_SENSOR_LABELS,
} from "@/lib/equipment-packs/coker-mock"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type DashboardTimeContext = {
  cycleId?: string
  fromIso?: string
  toIso?: string
  durationKey?: string
}

// ---------------------------------------------------------------------------
// Main entry point — dual-routing: new parameter-driven or legacy templateKey
// ---------------------------------------------------------------------------

export function CokerTemplateView({
  templateKey,
  parameterId,
  visualTypeId,
  config,
  referenceWidgetId,
  equipmentId: _equipmentId,
  context,
}: {
  /** Legacy: templateKey-based routing */
  templateKey?: string
  /** New parameter-driven routing */
  parameterId?: string
  visualTypeId?: string
  config?: Record<string, unknown>
  /** Reference/tool widget key */
  referenceWidgetId?: string
  equipmentId?: string
  context?: DashboardTimeContext
}) {
  const ctxNote = context?.cycleId ? ` · Cycle ${context.cycleId}` : ""

  // 1. New parameter-driven path
  if (parameterId && visualTypeId) {
    return (
      <div className="coker-theme h-full w-full min-h-0 flex flex-col text-[13px] text-[hsl(var(--coker-fg))]">
        {renderByParameter(parameterId, visualTypeId, config ?? {})}
      </div>
    )
  }

  // 2. Reference / tool widget path
  if (referenceWidgetId) {
    return (
      <div className="coker-theme h-full w-full min-h-0 flex flex-col text-[13px] text-[hsl(var(--coker-fg))]">
        {renderReferenceWidget(referenceWidgetId, ctxNote)}
      </div>
    )
  }

  // 3. Legacy templateKey path
  if (!templateKey) {
    return <div className="text-xs text-muted-foreground p-2">Widget is missing routing information.</div>
  }
  const def = getCokerTemplateDef(templateKey)
  if (!def) {
    return <div className="text-xs text-destructive p-2">Unknown template: {templateKey}</div>
  }
  return (
    <div className="coker-theme h-full w-full min-h-0 flex flex-col text-[13px] text-[hsl(var(--coker-fg))]">
      {renderByKey(templateKey, ctxNote)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Parameter-driven renderer
// ---------------------------------------------------------------------------

function renderByParameter(parameterId: string, visualTypeId: string, _config: Record<string, unknown>): React.ReactNode {
  switch (parameterId) {
    case "temperature":
      return renderSensorTimeSeries(visualTypeId, mockTemperatureSeries, TEMPERATURE_SENSOR_LABELS, "°C", 43.28)
    case "pressure":
      return renderSensorTimeSeries(visualTypeId, mockPressureSeries, PRESSURE_SENSOR_LABELS, "Barg", 0.13)
    case "coke_level":
      return renderCokeLevel(visualTypeId)
    case "steam_rate":
      return renderSingleValueTimeSeries(visualTypeId, mockSteamRateSeries, "Steam Rate", "t/h", 1.42)
    case "flow_rate":
      return renderSingleValueTimeSeries(visualTypeId, mockFlowRateSeries, "Flow Rate", "m³/h", 8.7)
    case "bulging":
      return renderBulging(visualTypeId)
    case "fatigue_damage":
      return renderFatigueDamage(visualTypeId)
    case "stress":
      return renderStress(visualTypeId)
    case "remaining_life":
      return renderRemainingLife(visualTypeId)
    case "pslf":
      return <SingleKpi label="Max PSLF" value="142.35" sub="Inspection: TB 2023" />
    case "ovality":
      return <OvalityChart />
    case "displacement":
      return renderDisplacement(visualTypeId)
    case "crack":
      return renderCrack(visualTypeId)
    default:
      return <div className="text-xs text-muted-foreground p-2">Unknown parameter: {parameterId}</div>
  }
}

function renderSensorTimeSeries(
  visualTypeId: string,
  data: { t: string; s1: number; s2: number; s3: number }[],
  labels: string[],
  unit: string,
  maxValue: number
): React.ReactNode {
  const chartData = data.map((d) => ({ t: d.t, a: d.s1, b: d.s2, c: d.s3 }))
  switch (visualTypeId) {
    case "kpi_card":
      return <SingleKpi label={`Max ${labels[0]}`} value={`${maxValue} ${unit}`} />
    case "bar_chart":
      return (
        <div className="h-full min-h-[100px]">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="t" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} width={36} unit={` ${unit}`} />
              <Tooltip formatter={(v: number) => [`${v} ${unit}`]} />
              <Bar dataKey="a" fill="hsl(var(--coker-accent))" name={labels[0]} />
              <Bar dataKey="b" fill="#059669" name={labels[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
    default: // time_series
      return (
        <MultiLine
          title={`${labels[0]} (${unit})`}
          series={labels.slice(0, 3)}
          data={chartData}
        />
      )
  }
}

function renderSingleValueTimeSeries(
  visualTypeId: string,
  data: { t: string; v: number }[],
  label: string,
  unit: string,
  maxValue: number
): React.ReactNode {
  switch (visualTypeId) {
    case "kpi_card":
      return <SingleKpi label={`Latest ${label}`} value={`${maxValue} ${unit}`} />
    default: // time_series
      return (
        <div className="flex flex-col h-full min-h-[140px] gap-1">
          <div className="text-[10px] text-muted-foreground truncate">{label} ({unit})</div>
          <div className="flex-1 min-h-[100px]">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="t" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} width={36} unit={` ${unit}`} />
                <Tooltip formatter={(v: number) => [`${v} ${unit}`, label]} />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--coker-accent))" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
  }
}

function renderCokeLevel(visualTypeId: string): React.ReactNode {
  const { value, unit, warnAt, critAt } = { value: 24.06, unit: "%", warnAt: 75, critAt: 90 }
  switch (visualTypeId) {
    case "gauge":
      return <GaugeWidget value={value} unit={unit} max={100} warnAt={warnAt} critAt={critAt} label="Coke Level" />
    case "time_series": {
      const sparkData = [
        { t: "12/04", v: 23.1 }, { t: "13/04", v: 23.8 }, { t: "14/04", v: 24.2 },
        { t: "15/04", v: 24.0 }, { t: "16/04", v: 23.9 }, { t: "17/04", v: 24.1 }, { t: "18/04", v: 24.06 },
      ]
      return renderSingleValueTimeSeries("time_series", sparkData, "Coke Level", unit, value)
    }
    default: // kpi_card
      return <SingleKpi label="Coke Level" value={`${value} ${unit}`} />
  }
}

function renderBulging(visualTypeId: string): React.ReactNode {
  switch (visualTypeId) {
    case "severity_table":
      return <BulgingSeverityTable />
    case "kpi_card":
      return <SingleKpi label="Max Bulge" value="0.100 mm" sub="Zone: Cone · TB 2023" />
    default: // heatmap_2d
      return (
        <CokerWidgetRaster
          src={COKER_WIDGET_IMAGE.bulgingInspection}
          alt="Bulging inspection PSLF and ovality heatmap"
          footnote="Bulging / PSLF / Ovality"
        />
      )
  }
}

function renderFatigueDamage(visualTypeId: string): React.ReactNode {
  switch (visualTypeId) {
    case "kpi_card":
      return <SingleKpi label="Max Fatigue Damage" value="86.91%" sub="Shell C7 · NNE · 30.2 m" />
    case "bar_chart":
      return <ElevationBarsChart />
    case "damage_table":
      return <DamageTable />
    case "heatmap_2d":
      return (
        <CokerWidgetRaster
          src={COKER_WIDGET_IMAGE.totalFatigueDamage}
          alt="Total fatigue damage shell heatmap"
        />
      )
    default: // area_chart
      return <AreaMock />
  }
}

function renderStress(visualTypeId: string): React.ReactNode {
  switch (visualTypeId) {
    case "heatmap_2d":
      return (
        <div className="flex h-full min-h-[100px] items-center justify-center text-xs text-muted-foreground border border-dashed rounded-md">
          Stress heatmap (FEA output — image reference)
        </div>
      )
    case "time_series":
      return renderSingleValueTimeSeries(
        "time_series",
        Array.from({ length: 7 }, (_, i) => ({ t: `D${i + 1}`, v: 0.0 + i * 0.001 })),
        "Von Mises Stress",
        "MPa",
        0.006
      )
    default: // kpi_card
      return <SingleKpi label="Max Von Mises Stress" value="0.0 MPa" sub="Elev. 0.1 m" />
  }
}

function renderRemainingLife(visualTypeId: string): React.ReactNode {
  if (visualTypeId === "kpi_card") {
    return <SingleKpi label="Remaining Life" value="2.7 years" />
  }
  // gauge
  return (
    <GaugeWidget
      value={2.7}
      unit="years"
      max={35}
      warnAt={5}
      critAt={2}
      label="Remaining Life"
      zones={mockRemainingLifeGauge.zones}
    />
  )
}

function renderDisplacement(visualTypeId: string): React.ReactNode {
  if (visualTypeId === "kpi_card") {
    return <SingleKpi label="Max Displacement" value="0.17 mm" sub="Direction: North" />
  }
  // polar_plot
  return (
    <div className="h-full w-full min-h-[140px]">
      <ResponsiveContainer>
        <RadarChart data={mockDisplacementPolar}>
          <PolarGrid />
          <PolarAngleAxis dataKey="direction" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis tick={{ fontSize: 9 }} />
          <Radar dataKey="v" stroke="hsl(var(--coker-accent))" fill="hsl(var(--coker-accent))" fillOpacity={0.2} name="Displacement (mm)" />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

function renderCrack(visualTypeId: string): React.ReactNode {
  switch (visualTypeId) {
    case "fad_chart":
      return <FadMock />
    case "unwrapped_map":
      return (
        <CokerWidgetRaster
          src={COKER_WIDGET_IMAGE.crackInspection}
          alt="Crack inspection unwrapped shell map"
          footnote="C1–C11 · shell"
        />
      )
    default: // crack_table
      return <CrackTable />
  }
}

// ---------------------------------------------------------------------------
// Reference / tool widget renderer
// ---------------------------------------------------------------------------

function renderReferenceWidget(key: string, ctxNote: string): React.ReactNode {
  switch (key) {
    case "equipment_data":
      return <TableZebra rows={mockEquipmentDataRows} />
    case "model_3d":
      return (
        <CokerWidgetRaster
          src={COKER_WIDGET_IMAGE.model3d}
          alt="Coker 3D shell model and legend"
        />
      )
    case "sensor_location":
      return <PlaceholderSchematic label="Vessel schematic + sensor callouts" />
    case "time_range":
      return (
        <div className="space-y-2 p-1 text-xs">
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-medium">Last 7 days</span>
          </div>
          <div className="flex justify-between">
            <span>From / To</span>
            <span>12/04 – 19/04/2026</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--coker-track))] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[hsl(var(--coker-accent))]" />
          </div>
        </div>
      )
    case "cycle_selector":
      return (
        <div className="text-xs space-y-1 p-1">
          <div className="flex justify-between">
            <span>Cycle</span>
            <span className="font-mono">2751</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            11/04/2026 02:18 – 12/04/2026 14:42
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nominal{ctxNote}</span>
          </div>
        </div>
      )
    default:
      return <div className="text-xs text-muted-foreground p-2">Reference widget: {key}</div>
  }
}

// ---------------------------------------------------------------------------
// Legacy templateKey renderer (backward-compat)
// ---------------------------------------------------------------------------

function renderByKey(key: string, ctxNote: string) {
  switch (key) {
    case "coker_equipment_data_table":
      return <TableZebra rows={mockEquipmentDataRows} />
    case "coker_model_3d":
      return (
        <CokerWidgetRaster src={COKER_WIDGET_IMAGE.model3d} alt="Coker 3D shell model and legend" />
      )
    case "coker_kpi_max_strip":
      return (
        <KpiStrip
          items={[
            { label: "Max. Temperature", value: "43.28 °C", sub: "Temperature Sensor 1", accent: "emerald" },
            { label: "Max. Pressure", value: "0.12 Barg", sub: "Pressure Sensor 1", accent: "slate" },
            { label: "Coke Level", value: "24.06 %", sub: "—", accent: "slate" },
            { label: "Steam", value: "1.4 t/h", sub: "—", accent: "slate" },
          ]}
        />
      )
    case "coker_time_series_multi":
      return (
        <MultiLine
          title={`Temperature Sensors${ctxNote}`}
          series={TEMPERATURE_SENSOR_LABELS}
          data={mockSeriesMulti}
        />
      )
    case "coker_quenching_empty":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm p-4">
          <span className="text-2xl mb-2 opacity-40">⊘</span>
          Flow rate and Steam rate data are not available.
        </div>
      )
    case "coker_time_information":
      return (
        <div className="space-y-2 p-1 text-xs">
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="font-medium">Last 7 days</span>
          </div>
          <div className="flex justify-between">
            <span>From / To</span>
            <span>12/04 – 19/04/2026</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--coker-track))] relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2/3 bg-[hsl(var(--coker-accent))]" />
          </div>
        </div>
      )
    case "coker_sensor_location":
      return <PlaceholderSchematic label="Vessel schematic + sensor callouts" />
    case "coker_fatigue_kpi_strip":
      return (
        <KpiStrip
          items={[
            { label: "Total damage", value: "86.91%", accent: "slate" },
            { label: "Remaining life", value: "2.7 years", accent: "emerald" },
            { label: "Last assessment", value: "14/04/2026", accent: "slate" },
            { label: "Last cycle", value: "2751", accent: "slate" },
          ]}
        />
      )
    case "coker_sensor_last_cycle":
      return (
        <MultiLine
          title="Temperature Sensors — last cycle"
          series={TEMPERATURE_SENSOR_LABELS.slice(0, 2)}
          data={mockSeriesLastCycle}
        />
      )
    case "coker_remaining_life_gauge":
      return (
        <GaugeWidget
          value={2.7}
          unit="years"
          max={35}
          warnAt={5}
          critAt={2}
          label="Remaining Life"
          zones={mockRemainingLifeGauge.zones}
        />
      )
    case "coker_accumulated_damage_area":
      return <AreaMock />
    case "coker_top_damage_table":
      return <DamageTable />
    case "coker_fatigue_vessel_heatmap":
      return (
        <CokerWidgetRaster src={COKER_WIDGET_IMAGE.totalFatigueDamage} alt="Total fatigue damage shell heatmap" />
      )
    case "coker_pslf_card":
      return <SingleKpi label="Max PSLF" value={`${mockPslfKpi.value}`} sub={`Inspection: ${mockPslfKpi.inspection}`} />
    case "coker_inspection_campaign_card":
      return <SingleKpi label="Inspection Campaign" value="TB 2023" />
    case "coker_bulging_severity_table":
      return <BulgingSeverityTable />
    case "coker_bulging_heatmap":
      return (
        <CokerWidgetRaster
          src={COKER_WIDGET_IMAGE.bulgingInspection}
          alt="Bulging inspection PSLF and ovality heatmap"
          footnote="Bulging / PSLF / Ovality"
        />
      )
    case "coker_crack_details_table":
      return <CrackTable />
    case "coker_fad_chart":
      return <FadMock />
    case "coker_crack_unwrapped_map":
      return (
        <CokerWidgetRaster src={COKER_WIDGET_IMAGE.crackInspection} alt="Crack inspection unwrapped shell map" footnote="C1–C11 · shell" />
      )
    case "coker_cycles_info_block":
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] p-1">
          <InfoCell label="Max. Temperature" value="401.2 °C" sub="Temperature Sensor 1" />
          <InfoCell label="Max. Pressure" value="3.22 Barg" sub="Pressure Sensor 1" />
          <InfoCell label="Max. Von Mises" value="0 MPa" sub="Elev. 0.1 m" />
          <InfoCell label="Max. single damage" value="0.0106 %" sub="Elev. 0 m" />
        </div>
      )
    case "coker_cycle_selector":
      return (
        <div className="text-xs space-y-1 p-1">
          <div className="flex justify-between">
            <span>Cycle</span>
            <span className="font-mono">2751</span>
          </div>
          <div className="text-[10px] text-muted-foreground">11/04/2026 02:18 – 12/04/2026 14:42</div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Nominal</span>
          </div>
        </div>
      )
    case "coker_sensor_selected_cycle":
      return (
        <MultiLine
          title="Temperature — selected cycle"
          series={[TEMPERATURE_SENSOR_LABELS[0]!]}
          single
          data={mockSeriesSelectedCycle}
        />
      )
    case "coker_displacement_polar":
      return renderDisplacement("polar_plot")
    case "coker_damage_by_elevation_bars":
      return <ElevationBarsChart />
    case "coker_temp_stress_tab_panel":
      return (
        <div className="flex flex-col h-full text-xs">
          <div className="flex border-b border-border">
            {["Temperature", "Displacement", "Stress"].map((t, i) => (
              <button
                key={t}
                type="button"
                className={cn(
                  "px-2 py-1 text-[10px] rounded-t",
                  i === 0 ? "bg-[hsl(var(--coker-accent))] text-white" : "text-muted-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Image not available
          </div>
        </div>
      )
    default:
      return <div className="text-xs text-muted-foreground p-2">Template {key} (placeholder)</div>
  }
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function TableZebra({ rows }: { rows: { item: string; value: string }[] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-[12px]">
        <tbody>
          {rows.map((r) => (
            <tr key={r.item} className="border-b border-border/40 odd:bg-[hsl(var(--coker-row))]">
              <td className="p-1.5 text-muted-foreground">{r.item}</td>
              <td className="p-1.5 text-right font-medium">{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KpiStrip({
  items,
}: {
  items: { label: string; value: string; sub?: string; accent?: string }[]
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-full p-1">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-lg border border-[hsl(var(--coker-border))] bg-[hsl(var(--coker-card))] p-2 relative overflow-hidden"
        >
          <div
            className={cn(
              "absolute left-0 top-0 bottom-0 w-1",
              it.accent === "emerald" && "bg-emerald-500",
              (!it.accent || it.accent === "slate") && "bg-slate-400"
            )}
          />
          <div className="pl-2">
            <div className="text-[10px] text-muted-foreground font-medium leading-tight">{it.label}</div>
            <div className="text-lg font-bold tabular-nums">{it.value}</div>
            {it.sub && <div className="text-[9px] text-muted-foreground truncate">{it.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}

function MultiLine({
  title,
  series = ["A", "B", "C"],
  single = false,
  data = mockSeriesMulti,
}: {
  title: string
  series?: string[]
  single?: boolean
  data?: { t: string; a: number; b: number; c: number }[]
}) {
  const colors = ["#1d4ed8", "#059669", "#d97706"]
  return (
    <div className="flex flex-col h-full min-h-[140px] gap-1">
      <div className="text-[10px] text-muted-foreground truncate">{title}</div>
      <div className="flex flex-wrap gap-2 text-[9px]">
        {series.map((s, i) => (
          <span key={s} className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
            {s}
          </span>
        ))}
      </div>
      <div className="flex-1 min-h-[100px]">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis dataKey="t" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} width={36} />
            <Tooltip />
            {single ? (
              <Line type="monotone" dataKey="a" stroke={colors[0]} dot={false} strokeWidth={1.5} name={series[0]} />
            ) : (
              <>
                <Line type="monotone" dataKey="a" stroke={colors[0]} dot={false} strokeWidth={1.2} />
                <Line type="monotone" dataKey="b" stroke={colors[1]} dot={false} strokeWidth={1.2} />
                <Line type="monotone" dataKey="c" stroke={colors[2]} dot={false} strokeWidth={1.2} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function AreaMock() {
  return (
    <div className="h-full min-h-[100px]">
      <ResponsiveContainer>
        <AreaChart data={mockDamageByCycle} margin={{ left: 0, right: 2, top: 2, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="cycle" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} width={28} unit="%" />
          <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, "Damage"]} />
          <Area type="monotone" dataKey="damage" stroke="hsl(217,91%,40%)" fill="hsl(217 91% 50% / 0.2)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function ElevationBarsChart() {
  return (
    <div className="h-full min-h-[100px]">
      <ResponsiveContainer>
        <BarChart data={mockElevationBars} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="el" tick={{ fontSize: 9 }} label={{ value: "Elev. m", fontSize: 9, position: "bottom" }} />
          <YAxis tick={{ fontSize: 9 }} width={32} label={{ value: "Damage %", fontSize: 9, angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Bar dataKey="v" fill="hsl(var(--coker-accent))" name="Damage %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function DamageTable() {
  return (
    <div className="overflow-auto text-[11px]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="p-1">No</th>
            <th className="p-1">Damage %</th>
            <th className="p-1">Azimuth</th>
            <th className="p-1">Elev.</th>
            <th className="p-1">Dir</th>
            <th className="p-1">Group</th>
          </tr>
        </thead>
        <tbody>
          {mockTopDamageRows.map((r) => (
            <tr key={r.no} className="border-b border-border/50 odd:bg-muted/20">
              <td className="p-1">{r.no}</td>
              <td className="p-1">{r.damage}</td>
              <td className="p-1">{r.az}°</td>
              <td className="p-1">{r.el} m</td>
              <td className="p-1">{r.dir}</td>
              <td className="p-1">{r.group}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BulgingSeverityTable() {
  return (
    <div className="overflow-auto text-[10px]">
      <table className="w-full">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="p-0.5">#</th>
            <th className="p-0.5">PSLF</th>
            <th className="p-0.5">Likelihood</th>
            <th className="p-0.5">Azimuth</th>
            <th className="p-0.5">Elev.</th>
            <th className="p-0.5">Zone</th>
          </tr>
        </thead>
        <tbody>
          {mockBulgeRows.map((r) => (
            <tr key={r.r} className="border-b border-border/40">
              <td className="p-0.5">{r.r}</td>
              <td className="p-0.5">{r.pslf}</td>
              <td className="p-0.5">
                <span
                  className={cn(
                    "px-1 rounded",
                    r.like === "LIKELY" && "bg-rose-500/20 text-rose-700",
                    r.like === "POSSIBLE" && "bg-amber-500/20 text-amber-800",
                    r.like === "UNLIKELY" && "bg-slate-500/15"
                  )}
                >
                  {r.like}
                </span>
              </td>
              <td className="p-0.5">{r.az}°</td>
              <td className="p-0.5">{r.el} m</td>
              <td className="p-0.5">{r.zone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CrackTable() {
  return (
    <div className="overflow-auto text-[10px]">
      <table className="w-full">
        <thead>
          <tr className="text-left border-b text-muted-foreground">
            <th className="p-0.5">Loc</th>
            <th className="p-0.5">Cycle</th>
            <th className="p-0.5">Zone</th>
            <th className="p-0.5">Elev.</th>
            <th className="p-0.5">Lr</th>
            <th className="p-0.5">Kr</th>
          </tr>
        </thead>
        <tbody>
          {mockCrackRows.map((r) => (
            <tr key={r.loc} className="border-b border-border/30">
              <td className="p-0.5">{r.loc}</td>
              <td className="p-0.5">{r.cycle}</td>
              <td className="p-0.5">{r.zone}</td>
              <td className="p-0.5">{r.el} m</td>
              <td className="p-0.5">{r.lr}</td>
              <td className="p-0.5">{r.kr}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FadMock() {
  const assessmentPoints = mockCrackRows.map((r) => ({ lr: r.lr, kr: r.kr }))
  return (
    <div className="h-full min-h-[120px]">
      <ResponsiveContainer>
        <LineChart margin={{ left: 0, right: 2, top: 4, bottom: 0 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="lr" name="Lr" tick={{ fontSize: 9 }} domain={[0, 1.7]} label={{ value: "Lr", position: "insideBottomRight", offset: -5, fontSize: 9 }} />
          <YAxis type="number" dataKey="kr" name="Kr" tick={{ fontSize: 9 }} domain={[0, 1]} label={{ value: "Kr", angle: -90, position: "insideLeft", fontSize: 9 }} />
          <Tooltip />
          <Line
            data={mockFadLine}
            type="monotone"
            dataKey="kr"
            stroke="hsl(221,83%,40%)"
            dot={false}
            name="FAD Envelope"
          />
          <Line
            data={assessmentPoints}
            type="linear"
            dataKey="kr"
            stroke="#ef4444"
            dot={{ r: 4, fill: "#ef4444" }}
            name="Assessment Points"
            strokeWidth={0}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Gauge widget — semi-circle style using a simple stacked bar approach. */
function GaugeWidget({
  value,
  unit,
  max,
  warnAt,
  critAt,
  label,
  zones,
}: {
  value: number
  unit: string
  max: number
  warnAt: number
  critAt: number
  label: string
  zones?: { min: number; max: number; label: string; color: string }[]
}) {
  const pct = Math.min(100, (value / max) * 100)
  const color = value <= critAt ? "#ef4444" : value <= warnAt ? "#f59e0b" : "#22c55e"
  const zoneList = zones ?? [
    { min: 0, max: critAt, label: "Critical", color: "#ef4444" },
    { min: critAt, max: warnAt, label: "Caution", color: "#f59e0b" },
    { min: warnAt, max: max, label: "Good", color: "#22c55e" },
  ]
  const barData = zoneList.map((z) => ({
    name: z.label,
    v: ((z.max - z.min) / max) * 100,
    color: z.color,
  }))
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>
        {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden flex">
        {barData.map((b) => (
          <div key={b.name} className="h-full" style={{ width: `${b.v}%`, background: b.color }} />
        ))}
      </div>
      <div className="relative w-full h-1">
        <div className="absolute h-3 w-0.5 bg-foreground/60 top-0" style={{ left: `${pct}%` }} />
      </div>
      <div className="flex justify-between w-full text-[9px] text-muted-foreground">
        <span>0</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

/** Ovality cross-section chart. Renders measured vs nominal as two area series. */
function OvalityChart() {
  // Transform polar data to cartesian for visualization as a "radar-like" plot
  return (
    <div className="flex flex-col h-full min-h-[140px] gap-1">
      <div className="text-[10px] text-muted-foreground">Ovality — Elev. 9.5 m</div>
      <div className="flex-1 min-h-[100px]">
        <ResponsiveContainer>
          <RadarChart data={mockOvalityData} outerRadius="80%">
            <PolarGrid gridType="circle" />
            <PolarAngleAxis dataKey="angle" tick={{ fontSize: 8 }} tickFormatter={(v: number) => `${v}°`} />
            <PolarRadiusAxis tick={{ fontSize: 7 }} domain={[4520, 4590]} />
            <Radar
              name="Nominal"
              dataKey="nominal"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.1}
              strokeDasharray="4 2"
            />
            <Radar
              name="Measured"
              dataKey="measured"
              stroke="hsl(var(--coker-accent))"
              fill="hsl(var(--coker-accent))"
              fillOpacity={0.2}
            />
            <Tooltip formatter={(v: number) => [`${v.toFixed(0)} mm`]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3 text-[9px]">
        <span className="flex items-center gap-1">
          <span className="w-3 border border-dashed border-slate-400 inline-block" /> Nominal
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 border border-[hsl(var(--coker-accent))] inline-block" /> Measured
        </span>
      </div>
    </div>
  )
}

function CokerWidgetRaster({
  src,
  alt,
  footnote,
}: {
  src: string
  alt: string
  footnote?: string
}) {
  const [failed, setFailed] = React.useState(false)
  if (failed) {
    return (
      <div className="flex h-full min-h-[100px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3 text-center">
        <p className="text-[11px] text-muted-foreground">Could not load image</p>
        <p className="max-w-full break-all font-mono text-[9px] text-muted-foreground">{src}</p>
        <p className="text-[9px] text-muted-foreground">
          Add the file under <code className="font-mono">public/coker/widgets/</code> (see README).
        </p>
      </div>
    )
  }
  return (
    <div className="relative h-full w-full min-h-[100px]">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        onError={() => setFailed(true)}
        sizes="(max-width: 1400px) 90vw, 1000px"
        unoptimized
      />
      {footnote ? (
        <span className="pointer-events-none absolute bottom-0.5 right-0.5 text-[8px] text-muted-foreground/90">
          {footnote}
        </span>
      ) : null}
    </div>
  )
}

function PlaceholderSchematic({ label }: { label: string }) {
  return (
    <div className="flex-1 min-h-[120px] rounded-md border border-dashed border-border flex items-center justify-center text-center text-xs text-muted-foreground px-2">
      {label}
    </div>
  )
}

function SingleKpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="h-full flex flex-col justify-center p-2 rounded-lg bg-[hsl(var(--coker-card))] border border-[hsl(var(--coker-border))]">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function InfoCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-r border-border/40 pr-2 last:border-0">
      <div className="text-[10px] text-muted-foreground leading-tight">{label}</div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[9px] text-muted-foreground">{sub}</div>
    </div>
  )
}
