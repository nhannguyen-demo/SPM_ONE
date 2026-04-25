"use client"

import type { WhatIfRunSession } from "@/lib/store"
import { equipmentKPIs } from "@/lib/data"
import { Equipment3DViewer } from "@/components/equipment-3d"
import { cn } from "@/lib/utils"
import { Component, type ErrorInfo, type ReactNode } from "react"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  BarChart, Bar, LineChart, Line, ComposedChart, Legend, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell,
} from "recharts"
import { AIKPIBadgeWrapper, AILineChartMarkers, AIBarChartThreshold } from "@/components/ai/feature6-ai-insight-overlay"

export class WidgetErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Avoid crashing the whole dashboard when a widget fails.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full rounded-lg border border-rose-300/40 bg-rose-500/5 text-rose-700 dark:text-rose-300 flex items-center justify-center text-xs px-3 text-center">
          This widget failed to render. Switch tabs or recreate this widget.
        </div>
      )
    }
    return this.props.children
  }
}

function KPIPill({ label, value }: { label?: string; value: string }) {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full">
      {label && <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>}
      <span className="text-2xl font-bold text-foreground">{value}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOCKUP DASHBOARD VIEWS - Dynamic Resolver
   ═══════════════════════════════════════════════════════════════════════════ */

const mockLineData = [
  { name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 }, { name: 'May', value: 600 }, { name: 'Jun', value: 700 },
]

const mockProcessData = [
  { time: '08:00', pressure: 120, throughput: 800 }, { time: '10:00', pressure: 130, throughput: 850 },
  { time: '12:00', pressure: 150, throughput: 900 }, { time: '14:00', pressure: 125, throughput: 870 },
  { time: '16:00', pressure: 140, throughput: 920 }, { time: '18:00', pressure: 110, throughput: 810 },
]

const mockScatterData = [
  { x: 10, y: 30, z: 200 }, { x: 20, y: 50, z: 260 }, { x: 30, y: 40, z: 400 },
  { x: 40, y: 60, z: 280 }, { x: 50, y: 30, z: 500 }, { x: 60, y: 80, z: 200 },
]

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const pieData = [
  { name: 'Process A', value: 400 },
  { name: 'Process B', value: 300 },
  { name: 'Process C', value: 300 },
  { name: 'Process D', value: 200 },
];

export function WidgetViewResolver({
  viewType,
  equipmentId,
  viewedDataIds = ["live"],
  scenarioRuns = [],
}: {
  viewType: string
  equipmentId?: string
  viewedDataIds?: string[]
  scenarioRuns?: WhatIfRunSession[]
}) {
  const selectedIds = viewedDataIds.length > 0 ? viewedDataIds : ["live"]
  const selectedScenarioRuns = selectedIds
    .filter((id) => id !== "live")
    .map((id) => scenarioRuns.find((run) => run.id === id))
    .filter((run): run is WhatIfRunSession => Boolean(run))

  const primaryRun = selectedScenarioRuns[0]
  const hasScenarioSelection = selectedScenarioRuns.length > 0
  const skew = hasScenarioSelection ? 1.12 : 1
  const dmgVal = `${Math.round(parseFloat(String(equipmentKPIs.dmg).replace("%", "")) * skew)}%`
  const relifeYears = parseInt(String(equipmentKPIs.reLife).replace(/\D/g, ""), 10) || 40
  const relifeVal =
    hasScenarioSelection ? `${Math.max(25, Math.round(relifeYears / skew))} yrs` : equipmentKPIs.reLife

  const dataLabels = selectedIds.map((id, idx) => {
    if (id === "live") return idx === 0 ? "Live Data" : `Live Data ${idx + 1}`
    const run = scenarioRuns.find((s) => s.id === id)
    return run?.runName ?? `Scenario ${idx + 1}`
  })

  const colorByIndex = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"]

  const multiSeriesData = mockLineData.map((point, pointIndex) => {
    const row: Record<string, string | number> = { name: point.name }
    selectedIds.forEach((id, index) => {
      const seriesSkew = id === "live" ? 1 : 1.06 + index * 0.04
      row[`series_${index}`] = Math.round((mockLineData[pointIndex]?.value ?? point.value) * seriesSkew)
    })
    return row
  })

  const chartSeriesKeys = selectedIds.map((_, idx) => `series_${idx}`)

  switch (viewType) {
    case "kpi-dmg":
      return (
        <AIKPIBadgeWrapper kpiKey="dmg">
          <KPIPill label="DMG" value={hasScenarioSelection ? dmgVal : equipmentKPIs.dmg} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-relife":
      return (
        <AIKPIBadgeWrapper kpiKey="reLife">
          <KPIPill label="Re-Life" value={relifeVal} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-date":
      return (
        <AIKPIBadgeWrapper kpiKey="date">
          <KPIPill value={equipmentKPIs.date} />
        </AIKPIBadgeWrapper>
      );
    case "kpi-id":
      return (
        <AIKPIBadgeWrapper kpiKey="id">
          <KPIPill label="ID" value={equipmentKPIs.id} />
        </AIKPIBadgeWrapper>
      );
    case "equipment-3d":
      return <Equipment3DViewer equipmentId={equipmentId} />;
    case "demo-pie": {
      const pieSkew = hasScenarioSelection ? 1.1 : 1
      const pie = pieData.map((p) => ({
        ...p,
        value: Math.round(p.value * pieSkew),
      }))
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pie} cx="50%" cy="50%" innerRadius={40} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
              {pie.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    case "data-grid":
      return (
        <div className="h-full overflow-auto text-[11px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-1.5 font-medium">Tag</th>
                <th className="text-right p-1.5 font-medium">Value</th>
                <th className="text-right p-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { tag: "T_in", value: "385 °C", status: "OK" },
                { tag: "P_shell", value: "2.1 bar", status: "OK" },
                { tag: "ΔP", value: "0.4 bar", status: "Warn" },
                { tag: "Flow", value: "120 t/h", status: "OK" },
              ].map((row) => (
                <tr key={row.tag} className="border-b border-border/60">
                  <td className="p-1.5 font-mono text-foreground">{row.tag}</td>
                  <td className="p-1.5 text-right tabular-nums">{row.value}</td>
                  <td className="p-1.5 text-right">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
                        row.status === "OK" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-800"
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "demo-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={multiSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            {chartSeriesKeys.map((key, idx) => (
              <Bar
                key={key}
                dataKey={key}
                name={dataLabels[idx]}
                fill={colorByIndex[idx % colorByIndex.length]}
                radius={[4, 4, 0, 0]}
                barSize={Math.max(10, 22 - selectedIds.length * 2)}
              />
            ))}
            {selectedIds.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          </BarChart>
        </ResponsiveContainer>
      );
    case "demo-summary":
      return (
        <div className="flex gap-4 items-center justify-around h-full">
          {[
            { label: 'OEE', val: '86%' },
            { label: 'Uptime', val: '99.9%' },
            { label: 'Quality', val: '98.5%' }
          ].map(k => (
            <div key={k.label} className="text-center">
              <div className="text-sm text-muted-foreground">{k.label}</div>
              <div className="text-3xl font-bold text-foreground">{k.val}</div>
            </div>
          ))}
        </div>
      );
    case "mon-sensor-1":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            {chartSeriesKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={dataLabels[idx]}
                stroke={colorByIndex[idx % colorByIndex.length]}
                strokeWidth={idx === 0 ? 3 : 2}
                dot={idx === 0 ? { r: 4 } : false}
                activeDot={idx === 0 ? { r: 6 } : undefined}
              />
            ))}
            {selectedIds.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-sensor-2":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={multiSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            {chartSeriesKeys.map((key, idx) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={dataLabels[idx]}
                stroke={colorByIndex[idx % colorByIndex.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
            {selectedIds.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          </LineChart>
        </ResponsiveContainer>
      );
    case "mon-temp":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Area type="monotone" dataKey="pressure" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-composed":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="throughput" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
            <Line yAxisId="right" type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      );
    case "proc-stream":
      return (
        <div className="flex gap-4 overflow-x-auto h-full items-center">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[150px] p-4 bg-background rounded-lg border border-border shrink-0">
              <div className="text-xs text-muted-foreground mb-1">Process Point {i}</div>
              <div className="text-xl font-bold">{(45.5 + (i * 7.2) % 30).toFixed(1)}</div>
            </div>
          ))}
        </div>
      );
    case "fatigue-trend":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Area type="monotone" dataKey="value" stroke="#7c3aed" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
          <AILineChartMarkers height={100} />
        </>
      );
    case "fatigue-cycle":
      return (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockLineData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <AIBarChartThreshold />
        </>
      );
    case "fatigue-rem":
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-4xl font-black text-rose-500 mb-2">12,405</div>
          <div className="text-sm text-muted-foreground w-3/4 text-center">Cycles remaining until critical threshold reached</div>
        </div>
      );
    case "bulge-bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockScatterData} layout="vertical" margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
            <XAxis type="number" fontSize={11} />
            <YAxis dataKey="x" type="category" fontSize={11} tickLine={false} axisLine={false} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Bar dataKey="y" fill="#f59e0b" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "bulge-scatter":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" dataKey="x" name="stature" fontSize={11} />
            <YAxis type="number" dataKey="y" name="weight" fontSize={11} />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Scatter name="Thickness" data={mockScatterData} fill="#ef4444" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "crack-line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockProcessData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey="time" fontSize={11} />
            <YAxis fontSize={11} />
            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
            <Line type="stepAfter" dataKey="pressure" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "crack-flaws":
      return (
        <div className="grid grid-cols-2 gap-2 h-full items-center p-1">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-secondary/50 p-3 rounded-lg flex flex-col justify-center items-center">
              <span className="text-xl mb-1">🔍</span>
              <span className="text-xs font-medium">Flaw {n}</span>
              <span className="text-xs text-rose-500">{(Math.random() * 5).toFixed(2)} mm</span>
            </div>
          ))}
        </div>
      );
    case "generic":
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full opacity-50">
          <span className="text-3xl mb-2">📊</span>
          <span className="text-sm text-muted-foreground">New Widget</span>
        </div>
      );
  }
}
