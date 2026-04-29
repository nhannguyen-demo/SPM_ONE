"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { getCokerTemplateDef } from "@/lib/equipment-packs/coker-v1"
import {
  mockBulgeRows,
  mockCrackRows,
  mockDamageByCycle,
  mockElevationBars,
  mockEquipmentDataRows,
  mockFadLine,
  mockSeriesLastCycle,
  mockSeriesMulti,
  mockSeriesSelectedCycle,
  mockTopDamageRows,
} from "@/lib/equipment-packs/coker-mock"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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

/**
 * Renders a Coker v1 catalog template. Set `viewType` to `coker-template` when `templateKey` is set.
 */
export function CokerTemplateView({
  templateKey,
  equipmentId: _equipmentId,
  context,
}: {
  templateKey: string
  equipmentId?: string
  context?: DashboardTimeContext
}) {
  const def = getCokerTemplateDef(templateKey)
  const ctxNote = context?.cycleId ? ` · Cycle ${context.cycleId}` : ""

  if (!def) {
    return (
      <div className="text-xs text-destructive p-2">Unknown template: {templateKey}</div>
    )
  }

  return (
    <div
      className={cn(
        "coker-theme h-full w-full min-h-0 flex flex-col text-[13px]",
        "text-[hsl(var(--coker-fg))]"
      )}
    >
      {renderByKey(templateKey, ctxNote)}
    </div>
  )
}

function renderByKey(key: string, ctxNote: string) {
  switch (key) {
    case "coker_equipment_data_table":
      return <TableZebra rows={mockEquipmentDataRows} />
    case "coker_model_3d":
      return <PlaceholderSchematic label="3D shell segments (C1–C11) + legend + top-down" />
    case "coker_kpi_max_strip":
      return (
        <KpiStrip
          items={[
            { label: "Max.Temperature", value: "43.28 °C", sub: "118TI5421A.PV", accent: "emerald" },
            { label: "Max.Pressure", value: "0.12 Barg", sub: "118PI5420B.PV", accent: "slate" },
            { label: "Coke level", value: "24.06 %", sub: "—", accent: "slate" },
            { label: "Steam", value: "1.4 t/h", sub: "—", accent: "slate" },
          ]}
        />
      )
    case "coker_time_series_multi":
      return (
        <MultiLine
          title={`Series${ctxNote}`}
          series={["118PI5420A.PV", "118PI5420B.PV", "118PI5420C.PV"]}
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
          title="Sensor data — last cycle"
          series={["118PI5420A.PV", "118PI5420C.PV"]}
          data={mockSeriesLastCycle}
        />
      )
    case "coker_remaining_life_gauge":
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-2xl font-bold text-[hsl(var(--coker-fg))]">2.7 year(s)</div>
          <div className="text-[10px] text-muted-foreground">Gauge (0–5 / 5–25 / 25–35 yrs)</div>
        </div>
      )
    case "coker_accumulated_damage_area":
      return <AreaMock />
    case "coker_top_damage_table":
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
    case "coker_fatigue_vessel_heatmap":
      return (
        <div className="flex flex-col h-full gap-1">
          <div className="text-[10px] flex justify-between">
            <span>Facings</span>
            <select className="text-[10px] bg-card border rounded px-1" defaultValue="North">
              <option>North</option>
              <option>East</option>
            </select>
          </div>
          <div className="flex-1 rounded border border-border bg-gradient-to-b from-blue-900/30 via-amber-500/20 to-rose-700/40 min-h-[120px]" />
          <div className="h-2 w-full rounded bg-gradient-to-r from-blue-800 to-rose-700" />
        </div>
      )
    case "coker_pslf_card":
      return <SingleKpi label="Max PSLF" value="142.35" />
    case "coker_inspection_campaign_card":
      return <SingleKpi label="Inspection" value="TB 2023" />
    case "coker_bulging_severity_table":
      return (
        <div className="overflow-auto text-[10px]">
          <table className="w-full">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="p-0.5">#</th>
                <th className="p-0.5">PSLF</th>
                <th className="p-0.5">Likelihood</th>
                <th className="p-0.5">Zone</th>
              </tr>
            </thead>
            <tbody>
              {mockBulgeRows.map((r) => (
                <tr key={r.r} className="border-b border-border/40">
                  <td className="p-0.5">{r.r}</td>
                  <td className="p-0.5">{r.pslf}%</td>
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
                  <td className="p-0.5">{r.zone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "coker_bulging_heatmap":
      return (
        <div className="h-full min-h-[140px] rounded bg-gradient-to-br from-slate-200/30 via-rose-200/20 to-amber-100/30 border border-border relative">
          <span className="absolute bottom-1 right-1 text-[9px] text-muted-foreground">Bulging / PSLF / Ovality</span>
        </div>
      )
    case "coker_crack_details_table":
      return (
        <div className="overflow-auto text-[10px]">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b text-muted-foreground">
                <th className="p-0.5">Loc</th>
                <th className="p-0.5">Cycle</th>
                <th className="p-0.5">Zone</th>
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
                  <td className="p-0.5">{r.lr}</td>
                  <td className="p-0.5">{r.kr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case "coker_fad_chart":
      return <FadMock />
    case "coker_crack_unwrapped_map":
      return (
        <div className="h-full min-h-[160px] rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
          Unwrapped shell — sections C1–C11 (select crack R4)
        </div>
      )
    case "coker_cycles_info_block":
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] p-1">
          <InfoCell label="Max. Temperature" value="401.2 °C" sub="118TI5421E.PV" />
          <InfoCell label="Max. Pressure" value="3.22 Barg" sub="118PI5419A.PV" />
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
          title="Sensor — selected cycle"
          series={["118PI5420A.PV"]}
          single
          data={mockSeriesSelectedCycle}
        />
      )
    case "coker_displacement_polar":
      return (
        <div className="h-full w-full min-h-[140px]">
          <ResponsiveContainer>
            <RadarChart
              data={[
                { a: "N", v: 0.17 },
                { a: "E", v: 0.12 },
                { a: "S", v: 0.06 },
                { a: "W", v: 0.11 },
              ]}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="a" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Radar dataKey="v" stroke="hsl(var(--coker-accent))" fill="hsl(var(--coker-accent))" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )
    case "coker_damage_by_elevation_bars":
      return (
        <div className="h-full min-h-[100px]">
          <ResponsiveContainer>
            <BarChart data={mockElevationBars} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="el" tick={{ fontSize: 9 }} label={{ value: "Elev. m", fontSize: 9, position: "bottom" }} />
              <YAxis tick={{ fontSize: 9 }} width={32} label={{ value: "Damage %", fontSize: 9, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="v" fill="hsl(var(--coker-accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )
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
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Image not available</div>
        </div>
      )
    default:
      return <div className="text-xs text-muted-foreground p-2">Template {key} (placeholder)</div>
  }
}

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
        {!single && (
          <span className="ml-auto text-primary text-[9px]">
            All · Inv · 1/1
          </span>
        )}
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
          <YAxis tick={{ fontSize: 9 }} width={28} />
          <Tooltip />
          <Area type="monotone" dataKey="damage" stroke="hsl(217,91%,40%)" fill="hsl(217,91%,50% / 0.2)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function FadMock() {
  return (
    <div className="h-full min-h-[120px]">
      <ResponsiveContainer>
        <LineChart data={mockFadLine} margin={{ left: 0, right: 2, top: 4, bottom: 0 }}>
          <CartesianGrid />
          <XAxis type="number" dataKey="lr" name="Lr" tick={{ fontSize: 9 }} domain={[0, 1.7]} />
          <YAxis type="number" dataKey="kr" name="Kr" tick={{ fontSize: 9 }} domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="kr" stroke="hsl(221,83%,40%)" dot={false} name="FAD" />
        </LineChart>
      </ResponsiveContainer>
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

function SingleKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="h-full flex flex-col justify-center p-2 rounded-lg bg-[hsl(var(--coker-card))] border border-[hsl(var(--coker-border))]">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
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
