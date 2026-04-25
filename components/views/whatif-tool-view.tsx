"use client"

/**
 * What-If Scenario Tool View  (v2)
 * Scenario management: configure & run, live progress, history, results (with back/save/discard/report), compare.
 */

import { useState, useEffect, useRef } from "react"
import { useAppStore, type WhatIfRunSession, type WhatIfParameterInputMode } from "@/lib/store"
import { whatIfScenarios } from "@/lib/data"
import type { UserDocument } from "@/lib/data"
import { cn } from "@/lib/utils"
import { RUN_STEPS, StatusBadge, findAssetPathForEquipment, useSeedMockHistory } from "@/components/views/whatif-tool/shared"
import {
  Play, History, ChevronRight, GitCompareArrows,
  Upload, CheckCircle2, Loader2,
  ArrowLeft, ExternalLink, MessageSquare, Check, Box,
  Search, LayoutDashboard, Info,
  FileText, Trash2,
} from "lucide-react"
/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

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
  const { whatIfRunSessions, updateWhatIfRunSession } = useAppStore()
  const session = whatIfRunSessions.find((s) => s.id === sessionId)
  const [localStep, setLocalStep] = useState(0)

  useEffect(() => {
    if (!session || session.status !== "running") return
    let step = 0
    const iv = setInterval(() => {
      step += 1
      setLocalStep(step)
      updateWhatIfRunSession(sessionId, { progressStep: step })
      if (step >= RUN_STEPS.length) {
        clearInterval(iv)
        setTimeout(() => {
          const finishedSession: Partial<WhatIfRunSession> = {
            status: "success",
            duration: `${Math.floor(Math.random() * 3 + 3)}m ${Math.floor(Math.random() * 59)}s`,
            progressStep: RUN_STEPS.length,
            results: [
              { checked: true, col1: "DMG Accumulation", col2: `${(190 + Math.random() * 40).toFixed(1)}%`, col3: Math.random() > 0.3 ? "Pass" : "Warning" },
              { checked: true, col1: "Remaining Life", col2: `${(35 + Math.random() * 10).toFixed(1)} yrs`, col3: "Pass" },
              { checked: true, col1: "Fatigue Index", col2: (0.6 + Math.random() * 0.3).toFixed(2), col3: "Pass" },
              { checked: true, col1: "Peak Temperature", col2: `${(440 + Math.random() * 60).toFixed(1)}°C`, col3: Math.random() > 0.5 ? "Pass" : "Warning" },
              { checked: true, col1: "Pressure Ratio", col2: (0.88 + Math.random() * 0.1).toFixed(2), col3: "Pass" },
              { checked: true, col1: "Cycle Count Delta", col2: `+${Math.floor(Math.random() * 20 + 5)}`, col3: "Pass" },
            ],
          }
          updateWhatIfRunSession(sessionId, finishedSession)
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
  onSaveBack,
  onDiscard,
  onCompareData,
}: {
  session: WhatIfRunSession
  onSaveBack: () => void
  onDiscard: () => void
  onCompareData: () => void
}) {
  const { addDocument } = useAppStore()
  const [reportGenerated, setReportGenerated] = useState(false)
  const pseudo = session.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const tokenConsumed = 100 + (pseudo % 700)
  const childJobs = Math.max(3, Math.min(12, session.results.length || 6))

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
            <button
              type="button"
              onClick={onCompareData}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-foreground rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              <GitCompareArrows className="w-4 h-4" />
              View Data
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
                Generate report (parameters)
              </button>
            )}

            {/* Discard */}
            <button
              type="button"
              onClick={onDiscard}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-300/50 text-rose-600 rounded-lg text-sm hover:bg-rose-500/8 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>

            <button
              type="button"
              onClick={onSaveBack}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Save &amp; Back
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Run session info */}
        <div className="px-6 pt-5 pb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Run Session Information</h4>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {[
                  ["Time run", new Date(session.startedAt).toLocaleString()],
                  ["Elapsed", session.duration || "—"],
                  ["User ran", session.user],
                  ["Status", session.status],
                  ["Number of child jobs", String(childJobs)],
                  ["Token consumed", String(tokenConsumed)],
                  ["Sub-jobs", "View sub-jobs"],
                  ["Run log file", "View log file"],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{label}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Input params used */}
        <div className="px-6 pb-8">
          <h4 className="text-sm font-semibold text-foreground mb-3">Input parameters used</h4>
          {session.parameterInputMode && (
            <p className="text-xs text-muted-foreground mb-3">
              Input pattern recorded:{" "}
              <span className="font-medium text-foreground capitalize">
                {session.parameterInputMode.replace(/-/g, " ")}
              </span>
            </p>
          )}
          {session.parameterInputMode === "full-csv" && (
            <div className="mb-3 text-xs text-muted-foreground rounded-lg border border-border bg-secondary/30 px-3 py-2">
              Uploaded full equipment CSV file. Individual parameter rows are populated from file mapping.
            </div>
          )}
          {session.parameterInputMode === "per-parameter-csv" && (
            <div className="mb-3 text-xs text-muted-foreground rounded-lg border border-border bg-secondary/30 px-3 py-2">
              Per-parameter CSV files uploaded. Values below show interpreted primary values by parameter.
            </div>
          )}
          {session.parameterInputMode === "mixed" && (
            <div className="mb-3 text-xs text-muted-foreground rounded-lg border border-border bg-secondary/30 px-3 py-2">
              Mixed mode run: full CSV and per-parameter CSV entries combined with typed overrides.
            </div>
          )}
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
   CONFIGURE & RUN PANEL
   ═══════════════════════════════════════════════════════════════════════════ */

function ConfigureRunPanel({
  scenario,
  onRunStarted,
}: {
  scenario: (typeof whatIfScenarios)[0]
  onRunStarted: (sessionId: string) => void
}) {
  const { addWhatIfRunSession, setWhatIfActiveRunId } = useAppStore()
  const [runName, setRunName] = useState("")
  const [csvFile, setCsvFile] = useState<string | null>(null)
  const [paramInputMode, setParamInputMode] = useState<WhatIfParameterInputMode>("typed")
  const [paramCsvNames, setParamCsvNames] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(Object.keys(scenario.defaultParams).map((k) => [k, null]))
  )
  const [params, setParams] = useState(() =>
    Object.fromEntries(Object.entries(scenario.defaultParams).map(([k, v]) => [k, v.value]))
  )
  const [productionUnit, setProductionUnit] = useState("Plant 1")
  const [calcMethod, setCalcMethod] = useState("IEC 12345-6-789")
  const [recompute, setRecompute] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const perFileRef = useRef<HTMLInputElement>(null)
  const [perUploadKey, setPerUploadKey] = useState<string | null>(null)

  const showFullCsv = paramInputMode === "full-csv" || paramInputMode === "mixed"
  const showPerParamCol = paramInputMode === "per-parameter-csv" || paramInputMode === "mixed"

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
      selectedDashboards: scenario.availableDashboards,
      results: [],
      progressStep: 0,
      params,
      source: "tool",
      parameterInputMode: paramInputMode,
    }
    addWhatIfRunSession(session)
    setWhatIfActiveRunId(id)
    onRunStarted(id)
  }

  const inputModeOptions: {
    id: WhatIfParameterInputMode
    title: string
    desc: string
  }[] = [
      {
        id: "full-csv",
        title: "Full equipment CSV",
        desc: "One file containing all parameters for the whole asset row-set.",
      },
      {
        id: "per-parameter-csv",
        title: "Per-parameter CSV",
        desc: "Upload a separate CSV for one parameter at a time (or each parameter in turn).",
      },
      {
        id: "typed",
        title: "Type values",
        desc: "Enter coefficients and standalone scalars directly in the table.",
      },
      {
        id: "mixed",
        title: "Mixed",
        desc: "Combine a whole-equipment file, per-parameter files, and typed overrides.",
      },
    ]

  return (
    <div className="flex-1 overflow-y-auto">
      <input
        ref={perFileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f || !perUploadKey) return
          setParamCsvNames((p) => ({ ...p, [perUploadKey]: f.name }))
          e.target.value = ""
          setPerUploadKey(null)
        }}
      />
      <div className="p-6 max-w-3xl space-y-8">
        <section>
          <h3 className="font-semibold text-foreground mb-1">1. Parameter input method</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Client agreements define how data is ingested. Choose the pattern that matches your scenario contract.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {inputModeOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setParamInputMode(opt.id)}
                className={cn(
                  "text-left rounded-xl border p-4 transition-all",
                  paramInputMode === opt.id
                    ? "border-primary bg-primary/8 ring-1 ring-primary/20"
                    : "border-border hover:border-primary/25 hover:bg-secondary/40"
                )}
              >
                <div className="font-medium text-sm text-foreground">{opt.title}</div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{opt.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {showFullCsv && (
          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Full equipment CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a correctly formatted <code className="bg-muted px-1 rounded">.csv</code> with every parameter column.
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
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) setCsvFile(f.name)
                }}
              />
              {csvFile ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <span className="font-medium text-foreground">{csvFile}</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="font-medium text-foreground">Drop CSV here or click to browse</span>
                </>
              )}
            </div>
          </section>
        )}

        {!showFullCsv && paramInputMode !== "typed" && (
          <section className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            No whole-equipment CSV is required for this mode. Use per-parameter uploads and/or the value column below.
          </section>
        )}

        {/* Config */}
        <section>
          <h3 className="font-semibold text-foreground mb-4">3. Scenario configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Scenario Name</label>
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
        {paramInputMode === "full-csv" ? (
          <section className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Full equipment CSV mode selected. Parameter values are read from the uploaded file, so manual parameter value entry is disabled.
          </section>
        ) : (
          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Parameter values &amp; series files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Typed values always apply. When per-parameter CSV is enabled, attach a file per row as needed.
            </p>
            <div
              className={cn(
                "border border-border rounded-xl overflow-hidden",
                paramInputMode === "typed" && "ring-1 ring-primary/15"
              )}
            >
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Parameter</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Value</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">Unit</th>
                    {showPerParamCol && (
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase">
                        Parameter CSV
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(scenario.defaultParams).map(([key, def]) => (
                    <tr key={key}>
                      <td className="px-4 py-2 text-muted-foreground">{key}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={params[key]}
                          onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                          className="w-full h-8 px-2 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{def.unit}</td>
                      {showPerParamCol && (
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPerUploadKey(key)
                              requestAnimationFrame(() => perFileRef.current?.click())
                            }}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {paramCsvNames[key] ?? "Upload CSV…"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Run */}
        <section className="pb-8">
          <button
            id={`run-what-if-${scenario.id}`}
            type="button"
            onClick={handleRun}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base transition-all shadow-sm active:scale-[0.99]",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5" /> Run What-If Scenarios
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
  const { whatIfRunSessions } = useAppStore()
  const sessions = whatIfRunSessions.filter((s) => s.scenarioId === scenarioId)
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
   MAIN CONTENT — tabbed scenario panel, reads whatIfInitialTab from store
   ═══════════════════════════════════════════════════════════════════════════ */

type MainPanelMode =
  | { mode: "overview" | "run" | "history" }
  | { mode: "results"; session: WhatIfRunSession }
  | { mode: "running"; sessionId: string }

function ScenarioMainPanel({ scenarioId }: { scenarioId: string }) {
  const scenario = whatIfScenarios.find((s) => s.id === scenarioId)
  const {
    whatIfRunSessions,
    whatIfInitialTab,
    setWhatIfInitialTab,
    setCurrentPath,
    setCurrentView,
    setViewMode,
    setWhatIfDashboardAutoSelectRunId,
    setEquipmentHomeAutoOpenTab,
    removeWhatIfRunSession,
  } = useAppStore()

  // Consume the initial tab set by external navigation (e.g. equipment dashboard)
  const [panel, setPanel] = useState<MainPanelMode>(() => {
    const init = useAppStore.getState().whatIfInitialTab
    return { mode: init ?? "overview" }
  })

  useEffect(() => {
    if (whatIfInitialTab) {
      setPanel({ mode: whatIfInitialTab })
      setWhatIfInitialTab(null) // consume once
    }
  }, [whatIfInitialTab, setWhatIfInitialTab])

  // Reset panel when scenario changes, but preserve an externally requested initial tab.
  useEffect(() => {
    const init = useAppStore.getState().whatIfInitialTab
    setPanel({ mode: init ?? "overview" })
  }, [scenarioId])

  if (!scenario) return null

  const sessionCount = whatIfRunSessions.filter((s) => s.scenarioId === scenarioId).length
  const lastSuccess = whatIfRunSessions.find((s) => s.scenarioId === scenarioId && s.status === "success")

  const tabs: { id: "overview" | "run" | "history"; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Info className="w-3.5 h-3.5" /> },
    { id: "run", label: "Configure & Run", icon: <Play className="w-3.5 h-3.5" /> },
    { id: "history", label: `History (${sessionCount})`, icon: <History className="w-3.5 h-3.5" /> },
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
        onSaveBack={() => setPanel({ mode: "history" })}
        onDiscard={() => {
          removeWhatIfRunSession(panel.session.id)
          setPanel({ mode: "history" })
        }}
        onCompareData={() => {
          const { site, plant, tab } = findAssetPathForEquipment(panel.session.equipmentId)
          setCurrentPath({ site, plant, equipment: panel.session.equipmentId, tab })
          setWhatIfDashboardAutoSelectRunId(panel.session.id)
          setEquipmentHomeAutoOpenTab(tab)
          setCurrentView("equipment-home")
          setViewMode("view")
        }}
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
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {scenario.description}
            </p>
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
                { label: "Successful", value: whatIfRunSessions.filter((s) => s.scenarioId === scenarioId && s.status === "success").length.toString() },
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
  const { whatIfRunSessions } = useAppStore()
  const [search, setSearch] = useState("")

  const filtered = whatIfScenarios.filter((s) =>
    !search || s.equipmentName.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-72 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-secondary/10">
      <div className="px-4 py-4 border-b border-border">
        <h2 className="font-semibold text-foreground text-base">What-If Scenarios</h2>
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
          const runs = whatIfRunSessions.filter((s) => s.scenarioId === scenario.id)
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
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{scenario.site}</span>
                <ChevronRight className="w-3 h-3" />
                <span>{scenario.plant}</span>
                <ChevronRight className="w-3 h-3" />
                <Box className="w-3 h-3" />
                <span>{scenario.equipmentName}</span>
              </div>
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

export function WhatIfToolView() {
  useSeedMockHistory()
  const { whatIfSelectedScenarioId, setWhatIfSelectedScenarioId, setCurrentView, setViewMode } = useAppStore()

  return (
    <div className="flex-1 flex min-w-0 overflow-hidden">
      <ScenarioSidebarList
        selectedId={whatIfSelectedScenarioId}
        onSelect={setWhatIfSelectedScenarioId}
      />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-card flex-shrink-0 text-xs text-muted-foreground">
          <button onClick={() => { setCurrentView("data-sync"); setViewMode("view") }} className="hover:text-foreground transition-colors">
            Tools
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">What-If Scenario</span>
          {whatIfSelectedScenarioId && (
            <><ChevronRight className="w-3 h-3" /><span className="text-foreground">{whatIfScenarios.find((s) => s.id === whatIfSelectedScenarioId)?.equipmentName}</span></>
          )}
        </div>

        {whatIfSelectedScenarioId ? (
          <ScenarioMainPanel scenarioId={whatIfSelectedScenarioId} />
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
