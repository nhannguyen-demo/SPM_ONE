"use client"

/**
 * What-If Scenario Tool View  (v2)
 * Scenario management: configure & run, live progress, history, results (with back/save/discard/report), compare.
 */

import { useState, useEffect, useRef } from "react"
import { useAppStore, type WhatIfRunSession } from "@/lib/store"
import { whatIfScenarios, mockWhatifRunSessions } from "@/lib/data"
import type { UserDocument } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  Play, History, GitCompareArrows, ChevronRight,
  Upload, CheckCircle2, XCircle, Loader2,
  ArrowLeft, ExternalLink, MessageSquare, Check, Box,
  Search, AlertTriangle, LayoutDashboard, Info,
  Sparkles, FileText, Trash2, Download,
} from "lucide-react"
import { AIWhatIfSummaryCard } from "@/components/ai/feature8-whatif-summary"

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

const RUN_STEPS = [
  "Uploading scenario data file",
  "Validating parameter inputs",
  "Running scenario engine",
  "Computing dashboard outputs",
  "Finalising results",
]

/* ═══════════════════════════════════════════════════════════════════════════
   SEED MOCK HISTORY
   ═══════════════════════════════════════════════════════════════════════════ */

function useSeedMockHistory() {
  const { whatifRunSessions, addWhatifRunSession } = useAppStore()
  const seeded = useRef(false)
  useEffect(() => {
    if (seeded.current || whatifRunSessions.length > 0) return
    seeded.current = true
    ;[...mockWhatifRunSessions].reverse().forEach((s) =>
      addWhatifRunSession(s as unknown as WhatIfRunSession)
    )
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: WhatIfRunSession["status"] }) {
  const map = {
    success: { label: "Success", cls: "bg-emerald-500/10 text-emerald-600" },
    failed:  { label: "Failed",  cls: "bg-rose-500/10 text-rose-600" },
    running: { label: "Running", cls: "bg-blue-500/10 text-blue-600 animate-pulse" },
    queued:  { label: "Queued",  cls: "bg-amber-500/10 text-amber-600" },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", cls)}>
      {label}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RUN PROGRESS OVERLAY
   ═══════════════════════════════════════════════════════════════════════════ */

function RunProgressOverlay({
  sessionId,
  onComplete,
}: {
  sessionId: string
  onComplete: (session: WhatIfRunSession) => void
}) {
  const { whatifRunSessions, updateWhatifRunSession } = useAppStore()
  const session = whatifRunSessions.find((s) => s.id === sessionId)
  const [localStep, setLocalStep] = useState(0)

  useEffect(() => {
    if (!session || session.status !== "running") return
    let step = 0
    const iv = setInterval(() => {
      step += 1
      setLocalStep(step)
      updateWhatifRunSession(sessionId, { progressStep: step })
      if (step >= RUN_STEPS.length) {
        clearInterval(iv)
        setTimeout(() => {
          const finishedSession: Partial<WhatIfRunSession> = {
            status: "success",
            duration: `${Math.floor(Math.random() * 3 + 3)}m ${Math.floor(Math.random() * 59)}s`,
            progressStep: RUN_STEPS.length,
            results: [
              { checked: true, col1: "DMG Accumulation",  col2: `${(190 + Math.random() * 40).toFixed(1)}%`, col3: Math.random() > 0.3 ? "Pass" : "Warning" },
              { checked: true, col1: "Remaining Life",    col2: `${(35 + Math.random() * 10).toFixed(1)} yrs`, col3: "Pass" },
              { checked: true, col1: "Fatigue Index",     col2: (0.6 + Math.random() * 0.3).toFixed(2),       col3: "Pass" },
              { checked: true, col1: "Peak Temperature",  col2: `${(440 + Math.random() * 60).toFixed(1)}°C`, col3: Math.random() > 0.5 ? "Pass" : "Warning" },
              { checked: true, col1: "Pressure Ratio",    col2: (0.88 + Math.random() * 0.1).toFixed(2),      col3: "Pass" },
              { checked: true, col1: "Cycle Count Delta", col2: `+${Math.floor(Math.random() * 20 + 5)}`,     col3: "Pass" },
            ],
          }
          updateWhatifRunSession(sessionId, finishedSession)
          const updated = { ...session, ...finishedSession } as WhatIfRunSession
          onComplete(updated)
        }, 600)
      }
    }, 750)
    return () => clearInterval(iv)
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <h3 className="font-semibold text-foreground text-lg">Running Scenario…</h3>
        <p className="text-muted-foreground text-sm mt-1">{session?.runName}</p>
      </div>

      <div className="w-full max-w-md space-y-3">
        {RUN_STEPS.map((step, i) => {
          const done = i < localStep
          const active = i === localStep
          return (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                done ? "bg-emerald-500 text-white" : active ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
              )}>
                {done
                  ? <Check className="w-4 h-4" />
                  : active
                    ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                    : <span className="text-[11px] text-muted-foreground">{i + 1}</span>}
              </div>
              <span className={cn("text-sm transition-colors",
                done ? "text-foreground" : active ? "text-primary font-medium" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          )
        })}
      </div>

      <div className="w-full max-w-md">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${(localStep / RUN_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>Step {Math.min(localStep + 1, RUN_STEPS.length)} of {RUN_STEPS.length}</span>
          <span>{Math.round((localStep / RUN_STEPS.length) * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   RESULTS PANEL — with Back / Save & Back / Discard / Generate Report / AI
   ═══════════════════════════════════════════════════════════════════════════ */

function ResultsPanel({
  session,
  scenarioId,
  onSaveBack,
  onDiscard,
  onCompare,
}: {
  session: WhatIfRunSession
  scenarioId: string
  onSaveBack: () => void
  onDiscard: () => void
  onCompare: () => void
}) {
  const { addDocument } = useAppStore()
  const [reportGenerated, setReportGenerated] = useState(false)
  const scenario = whatIfScenarios.find((s) => s.id === scenarioId)

  const handleGenerateReport = () => {
    const doc: UserDocument = {
      id: `report-${session.id}`,
      name: `[What-If Report] ${session.equipmentName} — ${session.runName}.pdf`,
      fileType: "pdf",
      category: "Uploaded",
      siteId: "site-x",
      plantId: "plant-1",
      equipmentId: session.equipmentId,
      size: `${(0.8 + Math.random() * 2).toFixed(1)} MB`,
      date: new Date().toISOString().split("T")[0],
    }
    addDocument(doc)
    setReportGenerated(true)
  }

  const warningCount = session.results.filter((r) => r.col3 !== "Pass").length

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header with actions */}
      <div className="px-6 py-4 border-b border-border bg-emerald-500/5 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <div className="font-semibold text-foreground">{session.runName}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {new Date(session.startedAt).toLocaleString()} · {session.duration} · by {session.user}
              </div>
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Compare */}
            <button
              onClick={onCompare}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              <GitCompareArrows className="w-4 h-4" />
              Compare with Live
            </button>

            {/* Generate Report */}
            {reportGenerated ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Report saved to Documents
              </div>
            ) : (
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 text-primary rounded-lg text-sm hover:bg-primary/10 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
            )}

            {/* Discard */}
            <button
              onClick={onDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-300/50 text-rose-600 rounded-lg text-sm hover:bg-rose-500/8 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>

            {/* Save & Back — primary */}
            <button
              onClick={onSaveBack}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Save &amp; Back
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard tags */}
      <div className="px-6 py-2.5 border-b border-border flex items-center gap-2 flex-wrap flex-shrink-0 bg-card">
        <span className="text-xs text-muted-foreground">Dashboards written:</span>
        {session.selectedDashboards.map((d) => (
          <span key={d} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{d}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* AI Summary */}
        <div className="px-6 pt-5">
          <div className="border border-blue-200/60 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50/60 to-emerald-50/40 dark:from-blue-950/20 dark:to-emerald-950/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-200/40">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">AI Summary</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Generated by SPM AI</span>
            </div>
            <div className="px-4 py-3 text-sm text-foreground leading-relaxed">
              {warningCount > 0 ? (
                <>
                  This scenario shows{" "}
                  <strong>{warningCount} parameter{warningCount > 1 ? "s" : ""}</strong>
                  {" "}outside safe thresholds. The most significant deviation is in{" "}
                  <strong>
                    {session.results.find((r) => r.col3 !== "Pass")?.col1 ?? "peak parameters"}
                  </strong>
                  . Review the highlighted rows and compare against live data before making operational decisions.
                </>
              ) : (
                <>
                  All parameters are within safe operational thresholds under this scenario.
                  The modelled conditions show a <strong>stable future state</strong> with no critical deviations detected.
                  This result can be saved as a reference for the next planning cycle.
                </>
              )}
            </div>
            <div className="px-4 pb-3 text-[11px] text-muted-foreground">
              ⚠ AI summaries are advisory only. Always validate with engineering judgement.
            </div>
          </div>
        </div>

        {/* Results table */}
        <div className="px-6 py-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Parameter Results</h4>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Parameter</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Value</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {session.results.map((r, i) => (
                  <tr key={i} className={cn("hover:bg-secondary/20", r.col3 !== "Pass" && "bg-amber-500/5")}>
                    <td className="px-4 py-3 text-foreground">
                      {r.col3 !== "Pass" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 inline mr-1.5" />}
                      {r.col1}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">{r.col2}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        r.col3 === "Pass" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      )}>
                        {r.col3}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input params used */}
        <div className="px-6 pb-8">
          <h4 className="text-sm font-semibold text-foreground mb-3">Input Parameters Used</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(session.params).map(([k, v]) => (
              <div key={k} className="flex justify-between px-3 py-2 bg-secondary/40 rounded-lg text-xs">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPARE PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function ComparePanel({
  session,
  onBack,
}: {
  session: WhatIfRunSession
  onBack: () => void
}) {
  const liveKPIs = [
    { label: "DMG Accumulation", value: "201%",       note: "Current" },
    { label: "Remaining Life",   value: "40 yrs",     note: "Current" },
    { label: "Fatigue Index",    value: "0.58",        note: "Current" },
  ]
  const scenarioKPIs = session.results.slice(0, 3).map((r) => ({
    label: r.col1, value: r.col2, warn: r.col3 !== "Pass",
  }))

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <div className="font-semibold text-foreground">Comparison View</div>
          <div className="text-xs text-muted-foreground">{session.runName} vs Live Data</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Live */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="font-semibold text-foreground">Live Dashboard</span>
              <span className="text-xs text-muted-foreground">(real data)</span>
            </div>
            <div className="space-y-3">
              {liveKPIs.map((k) => (
                <div key={k.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{k.label}</div>
                  <div className="text-2xl font-bold text-foreground">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="font-semibold text-foreground">Scenario Dashboard</span>
              <span className="text-xs text-muted-foreground">(future projection)</span>
            </div>
            <div className="space-y-3">
              {scenarioKPIs.map((k) => (
                <div key={k.label} className={cn(
                  "bg-card border rounded-xl p-4",
                  k.warn ? "border-amber-400/50 bg-amber-500/5" : "border-border"
                )}>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{k.label}</div>
                  <div className="text-2xl font-bold text-foreground">{k.value}</div>
                  <div className={cn("text-xs mt-1 font-medium", k.warn ? "text-amber-600" : "text-emerald-600")}>
                    {k.warn ? <>Warning <AlertTriangle className="w-3 h-3 inline" /></> : "Pass ✓"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delta table */}
        <h4 className="font-semibold text-foreground mb-4">Full Parameter Delta</h4>
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Parameter</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Live</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Scenario</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {session.results.map((r, i) => (
                <tr key={i} className={cn("hover:bg-secondary/20", r.col3 !== "Pass" && "bg-amber-500/5")}>
                  <td className="px-4 py-3 text-foreground">{r.col1}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">—</td>
                  <td className="px-4 py-3 font-mono text-foreground">{r.col2}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold",
                      r.col3 === "Pass" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                    )}>{r.col3}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONFIGURE & RUN PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function ConfigureRunPanel({
  scenario,
  onRunStarted,
}: {
  scenario: (typeof whatIfScenarios)[0]
  onRunStarted: (sessionId: string) => void
}) {
  const { addWhatifRunSession, setWhatifActiveRunId } = useAppStore()
  const [runName, setRunName] = useState("")
  const [selectedDashboards, setSelectedDashboards] = useState<string[]>(scenario.availableDashboards.slice(0, 2))
  const [csvFile, setCsvFile] = useState<string | null>(null)
  const [params, setParams] = useState(() =>
    Object.fromEntries(Object.entries(scenario.defaultParams).map(([k, v]) => [k, v.value]))
  )
  const [productionUnit, setProductionUnit] = useState("Plant 1")
  const [calcMethod, setCalcMethod] = useState("IEC 12345-6-789")
  const [recompute, setRecompute] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const toggleDashboard = (d: string) =>
    setSelectedDashboards((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )

  const handleRun = () => {
    const id = `wir-${Date.now()}`
    const session: WhatIfRunSession = {
      id,
      scenarioId: scenario.id,
      equipmentId: scenario.equipmentId,
      equipmentName: scenario.equipmentName,
      runName: runName.trim() || `${scenario.equipmentName} Run ${new Date().toLocaleDateString()}`,
      startedAt: new Date().toISOString(),
      duration: "",
      status: "running",
      user: "Nhan N.",
      selectedDashboards,
      results: [],
      progressStep: 0,
      params,
      source: "tool",
    }
    addWhatifRunSession(session)
    setWhatifActiveRunId(id)
    onRunStarted(id)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-3xl space-y-8">
        {/* Upload */}
        <section>
          <h3 className="font-semibold text-foreground mb-1">1. Upload Data File</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a correctly formatted <code className="bg-muted px-1 rounded">.csv</code> file.
          </p>
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
              csvFile ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-secondary/30"
            )}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCsvFile(f.name) }}
            />
            {csvFile ? (
              <><CheckCircle2 className="w-8 h-8 text-primary" /><span className="font-medium text-foreground">{csvFile}</span></>
            ) : (
              <><Upload className="w-8 h-8 text-muted-foreground" /><span className="font-medium text-foreground">Drop CSV here or click to browse</span></>
            )}
          </div>
        </section>

        {/* Config */}
        <section>
          <h3 className="font-semibold text-foreground mb-4">2. Scenario Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Run Name</label>
              <input
                type="text"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
                placeholder={`${scenario.equipmentName} — ${new Date().toLocaleDateString()}`}
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Production Unit</label>
              <select value={productionUnit} onChange={(e) => setProductionUnit(e.target.value)}
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm">
                <option>Plant 1</option><option>Plant 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Calculation Method</label>
              <select value={calcMethod} onChange={(e) => setCalcMethod(e.target.value)}
                className="w-full h-10 px-3 bg-secondary border border-border rounded-lg text-sm">
                <option>IEC 12345-6-789</option><option>API 579</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" id="recompute-p" checked={recompute} onChange={(e) => setRecompute(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary" />
              <label htmlFor="recompute-p" className="text-sm text-foreground">Re-compute pressure</label>
            </div>
          </div>
        </section>

        {/* Parameters */}
        <section>
          <h3 className="font-semibold text-foreground mb-4">3. Parameter Inputs</h3>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Parameter</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Value</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.entries(scenario.defaultParams).map(([key, def]) => (
                  <tr key={key}>
                    <td className="px-4 py-2 text-muted-foreground">{key}</td>
                    <td className="px-4 py-2">
                      <input type="text" value={params[key]}
                        onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full h-8 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{def.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dashboard selection */}
        <section>
          <h3 className="font-semibold text-foreground mb-1">4. Select Result Dashboards</h3>
          <p className="text-sm text-muted-foreground mb-4">Choose which dashboards the scenario results will be written to.</p>
          <div className="grid grid-cols-2 gap-2">
            {scenario.availableDashboards.map((d) => (
              <button key={d} onClick={() => toggleDashboard(d)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all",
                  selectedDashboards.includes(d)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/30 text-foreground hover:bg-secondary"
                )}>
                <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                  selectedDashboards.includes(d) ? "border-primary bg-primary" : "border-muted-foreground")}>
                  {selectedDashboards.includes(d) && <Check className="w-3 h-3 text-white" />}
                </div>
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {d}
              </button>
            ))}
          </div>
          {selectedDashboards.length === 0 && (
            <p className="text-xs text-rose-500 mt-2">Select at least one dashboard to continue.</p>
          )}
        </section>

        {/* Run */}
        <section className="pb-8">
          <button
            id={`run-whatif-${scenario.id}`}
            onClick={handleRun}
            disabled={selectedDashboards.length === 0}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base transition-all shadow-sm active:scale-[0.99]",
              selectedDashboards.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Run What-If Scenario
            </div>
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Want to create a new scenario?{" "}
            <a href="mailto:support@spmone.io" className="text-primary hover:underline">Contact our Technical Team ↗</a>
          </p>
        </section>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   HISTORY PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function HistoryPanel({
  scenarioId,
  onViewRun,
}: {
  scenarioId: string
  onViewRun: (session: WhatIfRunSession) => void
}) {
  const { whatifRunSessions } = useAppStore()
  const sessions = whatifRunSessions.filter((s) => s.scenarioId === scenarioId)
  const [filterStatus, setFilterStatus] = useState<"all" | WhatIfRunSession["status"]>("all")
  const [search, setSearch] = useState("")

  const filtered = sessions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false
    if (search && !s.runName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-3 border-b border-border bg-muted/20 flex items-center gap-3 flex-shrink-0 flex-wrap">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {(["all", "success", "failed"] as const).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors",
                filterStatus === s ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search runs…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary/50 w-40" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
            <History className="w-8 h-8" />
            <span className="text-sm">No run history yet</span>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card border-b border-border z-10">
              <tr>
                {["Run Name", "Status", "Started", "Duration", "User", "Source", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-foreground">{s.runName}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{new Date(s.startedAt).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{s.duration || "—"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{s.user}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-[11px] capitalize",
                      s.source === "tool" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600")}>
                      {s.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.status === "success" ? (
                      <button onClick={() => onViewRun(s)}
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                        View results <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No results</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN CONTENT — tabbed scenario panel, reads whatifInitialTab from store
   ═══════════════════════════════════════════════════════════════════════════ */

type MainPanelMode =
  | { mode: "overview" | "run" | "history" }
  | { mode: "results"; session: WhatIfRunSession }
  | { mode: "compare"; session: WhatIfRunSession }
  | { mode: "running"; sessionId: string }

function ScenarioMainPanel({ scenarioId }: { scenarioId: string }) {
  const scenario = whatIfScenarios.find((s) => s.id === scenarioId)
  const { whatifRunSessions, whatifInitialTab, setWhatifInitialTab } = useAppStore()

  // Consume the initial tab set by external navigation (e.g. equipment dashboard)
  const [panel, setPanel] = useState<MainPanelMode>(() => {
    const init = useAppStore.getState().whatifInitialTab
    return { mode: init ?? "overview" }
  })

  useEffect(() => {
    if (whatifInitialTab) {
      setPanel({ mode: whatifInitialTab })
      setWhatifInitialTab(null) // consume once
    }
  }, [whatifInitialTab, setWhatifInitialTab])

  // Also reset panel when scenario changes
  useEffect(() => {
    setPanel({ mode: "overview" })
  }, [scenarioId])

  if (!scenario) return null

  const sessionCount = whatifRunSessions.filter((s) => s.scenarioId === scenarioId).length
  const lastSuccess = whatifRunSessions.find((s) => s.scenarioId === scenarioId && s.status === "success")

  const tabs: { id: "overview" | "run" | "history"; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview",        icon: <Info className="w-3.5 h-3.5" /> },
    { id: "run",      label: "Configure & Run", icon: <Play className="w-3.5 h-3.5" /> },
    { id: "history",  label: `History (${sessionCount})`, icon: <History className="w-3.5 h-3.5" /> },
  ]

  if (panel.mode === "running") {
    return (
      <RunProgressOverlay
        sessionId={panel.sessionId}
        onComplete={(finished) => setPanel({ mode: "results", session: finished })}
      />
    )
  }

  if (panel.mode === "results") {
    return (
      <ResultsPanel
        session={panel.session}
        scenarioId={scenarioId}
        onSaveBack={() => setPanel({ mode: "history" })}
        onDiscard={() => setPanel({ mode: "history" })}
        onCompare={() => setPanel({ mode: "compare", session: panel.session })}
      />
    )
  }

  if (panel.mode === "compare") {
    return (
      <ComparePanel
        session={panel.session}
        onBack={() => setPanel({ mode: "results", session: panel.session })}
      />
    )
  }

  // Tabbed view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Scenario header */}
      <div className="px-6 py-5 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{scenario.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <span>{scenario.site}</span><ChevronRight className="w-3 h-3" />
              <span>{scenario.plant}</span><ChevronRight className="w-3 h-3" />
              <Box className="w-3 h-3" /><span>{scenario.equipmentName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lastSuccess && (
              <span className="text-xs text-muted-foreground">
                Last run: {new Date(lastSuccess.startedAt).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={() => setPanel({ mode: "run" })}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Play className="w-4 h-4" /> Run Now
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-6 flex-shrink-0 bg-card">
        {tabs.map((t) => {
          const active = panel.mode === t.id
          return (
            <button key={t.id}
              onClick={() => setPanel({ mode: t.id })}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              {t.icon}{t.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {panel.mode === "overview" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-3">About this Scenario</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{scenario.description}</p>
              <hr className="border-border my-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">{scenario.details}</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Runs", value: sessionCount.toString() },
                { label: "Successful", value: whatifRunSessions.filter((s) => s.scenarioId === scenarioId && s.status === "success").length.toString() },
                { label: "Dashboards Available", value: scenario.availableDashboards.length.toString() },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-3">Available Result Dashboards</h3>
              <div className="flex flex-wrap gap-2">
                {scenario.availableDashboards.map((d) => (
                  <span key={d} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full">
                    <LayoutDashboard className="w-3.5 h-3.5" />{d}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-amber-500/5 border border-amber-400/20 rounded-2xl p-5 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-foreground text-sm">Need a different scenario?</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  What-If Scenarios are configured by our Technical Team. To add a scenario for other equipment, please contact us.
                </p>
                <a href="mailto:support@spmone.io" className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Contact Technical Team
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {panel.mode === "run" && (
        <ConfigureRunPanel
          scenario={scenario}
          onRunStarted={(id) => setPanel({ mode: "running", sessionId: id })}
        />
      )}

      {panel.mode === "history" && (
        <HistoryPanel
          scenarioId={scenarioId}
          onViewRun={(s) => setPanel({ mode: "results", session: s })}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENARIO SIDEBAR LIST
   ═══════════════════════════════════════════════════════════════════════════ */

function ScenarioSidebarList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { whatifRunSessions } = useAppStore()
  const [search, setSearch] = useState("")

  const filtered = whatIfScenarios.filter((s) =>
    !search || s.equipmentName.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-secondary/10">
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-base">Scenarios</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select a scenario to manage</p>
      </div>
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input type="text" placeholder="Search scenarios…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary/50" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {filtered.map((scenario) => {
          const runs = whatifRunSessions.filter((s) => s.scenarioId === scenario.id)
          const lastRun = runs[0]
          const hasRunning = runs.some((s) => s.status === "running")
          const selected = selectedId === scenario.id
          return (
            <button key={scenario.id} onClick={() => onSelect(scenario.id)}
              className={cn(
                "w-full text-left px-4 py-4 transition-all border-l-2 flex flex-col gap-1.5",
                selected ? "bg-primary/10 border-l-primary" : "border-l-transparent hover:bg-secondary/60"
              )}>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground text-sm truncate">{scenario.equipmentName}</span>
                {hasRunning && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin ml-auto" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {scenario.description.split(".")[0]}.
              </p>
              <div className="flex items-center gap-2 mt-1">
                {lastRun ? <StatusBadge status={lastRun.status} /> : <span className="text-[11px] text-muted-foreground">Never run</span>}
                {runs.length > 0 && <span className="text-[11px] text-muted-foreground">{runs.length} run{runs.length !== 1 ? "s" : ""}</span>}
              </div>
            </button>
          )
        })}
        <div className="mx-3 mt-3 mb-2 p-3 rounded-xl border border-dashed border-border bg-card">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            To add more scenarios,{" "}
            <a href="mailto:support@spmone.io" className="text-primary hover:underline">contact our Technical Team</a>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export function WhatifToolView() {
  useSeedMockHistory()
  const { whatifSelectedScenarioId, setWhatifSelectedScenarioId, setCurrentView, setViewMode } = useAppStore()

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <ScenarioSidebarList
        selectedId={whatifSelectedScenarioId}
        onSelect={setWhatifSelectedScenarioId}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card flex-shrink-0 text-xs text-muted-foreground">
          <button onClick={() => { setCurrentView("data-sync"); setViewMode("view") }} className="hover:text-foreground transition-colors">
            Tools
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">What-If Scenarios</span>
          {whatifSelectedScenarioId && (
            <><ChevronRight className="w-3 h-3" /><span className="text-foreground">{whatIfScenarios.find((s) => s.id === whatifSelectedScenarioId)?.equipmentName}</span></>
          )}
        </div>

        {whatifSelectedScenarioId ? (
          <ScenarioMainPanel scenarioId={whatifSelectedScenarioId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Info className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm">Select a scenario from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
