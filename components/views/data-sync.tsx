"use client"

import { useState, useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { dataStatusItems, syncJobs, sites } from "@/lib/data"
import {
  GripVertical,
  Archive,
  ExternalLink,
  Filter,
  X,
  ScrollText,
  Database,
  Settings2,
  Download,
  Activity,
  Cpu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  ToolPageShell,
  ToolPageHeader,
  ToolsModuleHomeCrumb,
} from "@/components/tools/tool-page-layout"
import {
  buildCokerExportSample,
  cokerDatabaseSources,
  cokerOutputDescriptors,
  cokerSensorChannels,
  cokerTransferLog,
  COKER_SENSOR_DB_CONSOLE_URL,
  DATA_JOBS_PRIMARY_ASSETS,
  isDataJobsPrimaryAsset,
  type CokerSensorChannelRow,
  type ExportFormat,
} from "@/lib/data-jobs-mock"

const ALL_ASSETS = "all"

const ASSET_COKER = "Coker 01"
const ASSET_HCU = "HCU 01"
const ASSET_SMR = "SMR Pigtails"

type FeJobRow = (typeof syncJobs)[number]

function DataJobsSection({
  step,
  title,
  description,
  children,
  className,
}: {
  step: string
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.04]",
        className
      )}
    >
      <header className="border-b border-border/70 bg-muted/30 px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background text-[11px] font-bold tabular-nums tracking-tight text-muted-foreground shadow-xs"
            aria-hidden
          >
            {step}
          </span>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3 className="text-sm font-semibold leading-tight text-foreground sm:text-[15px]">{title}</h3>
            {description ? (
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-[13px]">{description}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="bg-card">{children}</div>
    </article>
  )
}

function DataStatusGhostPanel({ title }: { title: string }) {
  return (
    <Card
      className="overflow-hidden border border-dashed border-border/90 bg-muted/10 py-0 shadow-none"
      aria-busy
      aria-label={`${title} data status loading placeholder`}
    >
      <CardHeader className="border-b border-dashed border-border/60 bg-muted/20 py-4">
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Data Status will mirror the Coker layout when fixtures are connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 py-5">
        <div className="h-2.5 w-44 max-w-full rounded-md bg-muted/80 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-lg border border-border/40 bg-muted/50 animate-pulse" />
          <div className="h-24 rounded-lg border border-border/40 bg-muted/50 animate-pulse" />
        </div>
        <div className="h-28 rounded-lg border border-border/40 bg-muted/40 animate-pulse" />
      </CardContent>
    </Card>
  )
}

function channelHealthBadge(health: CokerSensorChannelRow["health"]) {
  if (health === "ok") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-600/20 bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
        OK
      </span>
    )
  }
  if (health === "warn") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
        Warn
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-900 dark:text-rose-200">
      Stale
    </span>
  )
}

function IngestChannelTable({ rows }: { rows: readonly CokerSensorChannelRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="whitespace-nowrap px-4 py-3 font-medium">Tag</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Instrument</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Cadence</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Last client sample</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Last SPM pull</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Avg interval</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Health</th>
            <th className="min-w-[10rem] px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map((row, idx) => (
            <tr
              key={row.tag}
              className={cn(
                "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/25",
                idx % 2 === 1 && "bg-muted/[0.35]",
                row.cadenceClass === "laser_campaign" && "bg-violet-500/[0.04] hover:bg-violet-500/[0.08]"
              )}
            >
              <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-semibold text-foreground">{row.tag}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{row.type}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{row.cadenceLabel}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{row.lastClientSampleLabel}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-foreground">{row.lastSuccessfulPullLabel}</td>
              <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{row.avgPullIntervalLabel}</td>
              <td className="whitespace-nowrap px-4 py-2.5">{channelHealthBadge(row.health)}</td>
              <td className="px-4 py-2.5 text-xs leading-snug text-muted-foreground">
                {row.note ? (
                  <span className="text-foreground/90">{row.note}</span>
                ) : row.lastErrorLabel ? (
                  <span className="font-medium text-amber-700 dark:text-amber-400">{row.lastErrorLabel}</span>
                ) : (
                  <span className="text-muted-foreground/70">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FeJobsTable({ jobs }: { jobs: FeJobRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/90">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="w-10 px-3 py-3.5" aria-hidden />
            <th className="px-4 py-3.5 font-medium">Asset</th>
            <th className="px-4 py-3.5 font-medium">Description</th>
            <th className="px-4 py-3.5 font-medium">State</th>
            <th className="px-4 py-3.5 font-medium">Started</th>
            <th className="px-4 py-3.5 font-medium">Elapsed</th>
            <th className="px-4 py-3.5 font-medium">User</th>
            <th className="px-4 py-3.5 font-medium">Tokens</th>
            <th className="px-4 py-3.5 font-medium">Archive</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {jobs.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-14 text-center text-sm text-muted-foreground">
                No FEA jobs for this filter.
              </td>
            </tr>
          ) : (
            jobs.map((job, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30",
                  i % 2 === 1 && "bg-muted/[0.25]"
                )}
              >
                <td className="px-3 py-3 align-middle">
                  <GripVertical className="size-4 text-muted-foreground/70" aria-hidden />
                </td>
                <td className="px-4 py-3 align-middle font-medium text-foreground">{job.asset}</td>
                <td className="px-4 py-3 align-middle text-foreground/90">{job.description}</td>
                <td className="px-4 py-3 align-middle">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                      job.state === "Success"
                        ? "bg-emerald-600/12 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-600/12 text-rose-800 dark:text-rose-300"
                    )}
                  >
                    {job.state}
                  </span>
                </td>
                <td className="px-4 py-3 align-middle text-muted-foreground">{job.startTime}</td>
                <td className="px-4 py-3 align-middle text-muted-foreground">{job.elapsed}</td>
                <td className="max-w-[10rem] truncate px-4 py-3 align-middle text-muted-foreground">{job.user}</td>
                <td className="px-4 py-3 align-middle text-muted-foreground">{job.tokens}</td>
                <td className="px-4 py-3 align-middle">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Archive job"
                  >
                    <Archive className="size-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function CokerDataStatusPanel() {
  const [logOpen, setLogOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json")

  const processChannels = cokerSensorChannels.filter((c) => c.cadenceClass === "process_fast")
  const laserChannels = cokerSensorChannels.filter((c) => c.cadenceClass === "laser_campaign")

  const openClientDb = () => {
    window.open(COKER_SENSOR_DB_CONSOLE_URL, "_blank", "noopener,noreferrer")
  }

  const handleExportDownload = () => {
    const body = buildCokerExportSample(exportFormat)
    const mime =
      exportFormat === "json"
        ? "application/json"
        : exportFormat === "xml"
          ? "application/xml"
          : "text/csv"
    const ext = exportFormat
    const blob = new Blob([body], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `coker-01-output-sample.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-md">
      <div className="flex flex-col gap-4 border-b border-border/80 bg-gradient-to-br from-muted/40 via-card to-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 className="min-w-0 text-lg font-semibold tracking-tight text-foreground sm:text-xl">{ASSET_COKER}</h2>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="bg-background/90 shadow-xs" onClick={() => setLogOpen(true)}>
            <ScrollText className="size-4 opacity-80" />
            Transfer log
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-background/90 shadow-xs" onClick={openClientDb}>
            <Database className="size-4 opacity-80" />
            Open database
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-background/90 shadow-xs" onClick={() => setConfigOpen(true)}>
            <Settings2 className="size-4 opacity-80" />
            Configure
          </Button>
          <Button type="button" size="sm" className="shadow-sm" onClick={() => setExportOpen(true)}>
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-5 bg-muted/15 p-5 sm:space-y-6 sm:p-6">
        <DataJobsSection step="01" title="Client database sources">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium sm:px-5">Label</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Engine</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Access</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Connection</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Console</th>
                </tr>
              </thead>
              <tbody>
                {cokerDatabaseSources.map((src, i) => (
                  <tr
                    key={src.id}
                    className={cn(
                      "border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20",
                      i % 2 === 1 && "bg-muted/[0.2]"
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-foreground sm:px-5">{src.label}</td>
                    <td className="px-4 py-3 text-foreground sm:px-5">{src.engine}</td>
                    <td className="px-4 py-3 text-muted-foreground sm:px-5">{src.role}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground sm:px-5">{src.connectionSummary}</td>
                    <td className="px-4 py-3 sm:px-5">
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium" onClick={openClientDb}>
                        Open host
                        <ExternalLink className="size-3.5 opacity-70" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataJobsSection>

        <DataJobsSection step="02" title="Ingest by sensor channel">
          <div className="space-y-5 px-4 pb-5 pt-4 sm:px-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground">Process &amp; rate</h4>
              </div>
              <IngestChannelTable rows={processChannels} />
            </div>

            <Separator className="bg-border/70" />

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-violet-500" aria-hidden />
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-foreground">Laser &amp; geometry</h4>
              </div>
              <IngestChannelTable rows={laserChannels} />
            </div>
          </div>
        </DataJobsSection>

        <DataJobsSection
          step="03"
          title="Product outputs"
          description="Deliverables returned after modeling, FEA, and scenario work — surfaced for monitoring and dashboards."
        >
          <div className="flex flex-wrap gap-2 px-4 py-4 sm:px-5">
            {cokerOutputDescriptors.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full border border-border/80 bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs transition-colors hover:border-primary/35"
              >
                {name}
              </span>
            ))}
          </div>
        </DataJobsSection>
      </div>

      <Sheet open={logOpen} onOpenChange={setLogOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-4 text-left">
            <SheetTitle className="text-lg">Transfer log</SheetTitle>
            <SheetDescription className="text-xs leading-relaxed">
              Sample transfer log for {ASSET_COKER}. Entries are not saved.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-1 py-4">
            {cokerTransferLog.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg border px-3.5 py-3 text-sm shadow-xs",
                  row.status === "fail" && "border-destructive/40 bg-destructive/[0.06]",
                  row.status === "warn" && "border-amber-500/35 bg-amber-500/[0.06]",
                  row.status === "ok" && "border-border/80 bg-muted/25"
                )}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>{row.at}</span>
                  <span>{row.direction}</span>
                </div>
                <p className="mt-1.5 leading-snug text-foreground">{row.message}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Database sources</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Preview only. Values are discarded when you close this dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="dj-host">Host / pooler</Label>
              <Input id="dj-host" defaultValue="pooler.site-2000.client.example" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dj-db">Database name</Label>
              <Input id="dj-db" defaultValue="coker_feed" autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dj-role">Credential role</Label>
              <Input id="dj-role" defaultValue="spm_ingest_readonly" autoComplete="off" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => setConfigOpen(false)}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export outputs</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Download a static sample file. Outbound API integration is not wired.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)} className="grid gap-2 py-2">
            {(
              [
                ["json", "JSON (.json)"],
                ["csv", "CSV (.csv)"],
                ["xml", "XML (.xml)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/[0.06]"
              >
                <RadioGroupItem value={value} id={`fmt-${value}`} />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </RadioGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportOpen(false)}>
              Close
            </Button>
            <Button type="button" onClick={handleExportDownload}>
              Download sample
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function DataSyncView() {
  const { preFilterEquipmentId, setPreFilterEquipmentId } = useAppStore()

  const assetOptions = Array.from(
    new Set([
      ...dataStatusItems.map((i) => i.asset),
      ...syncJobs.map((j) => j.asset),
    ])
  ).sort()

  const getEquipmentName = (equipmentId: string): string => {
    for (const site of sites) {
      for (const unit of site.units) {
        const equip = unit.equipment.find((e) => e.id === equipmentId)
        if (equip) return equip.name
      }
    }
    return equipmentId
  }

  const [filterAsset, setFilterAsset] = useState<string>(ALL_ASSETS)

  useEffect(() => {
    if (!preFilterEquipmentId) return
    const name = getEquipmentName(preFilterEquipmentId)
    if (assetOptions.includes(name)) {
      setFilterAsset(name)
    }
    setPreFilterEquipmentId(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredJobs =
    filterAsset === ALL_ASSETS ? syncJobs : syncJobs.filter((j) => j.asset === filterAsset)

  const showCokerPanel = filterAsset === ALL_ASSETS || filterAsset === ASSET_COKER
  const showHcuGhost = filterAsset === ALL_ASSETS || filterAsset === ASSET_HCU
  const showSmrGhost = filterAsset === ALL_ASSETS || filterAsset === ASSET_SMR

  const showNonPrimaryNotice =
    filterAsset !== ALL_ASSETS && !isDataJobsPrimaryAsset(filterAsset)

  const filterSummary =
    filterAsset === ALL_ASSETS ? "All equipment" : filterAsset

  return (
    <ToolPageShell>
      <ToolPageHeader
        title="Data & Jobs"
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <ToolsModuleHomeCrumb />
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Data & Jobs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
      />

        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border/80 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Filter className="size-4 shrink-0 opacity-70" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground">Equipment scope</span>
            </div>
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className={cn(
                "h-10 min-w-[12rem] rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-shadow",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                filterAsset !== ALL_ASSETS && "border-primary/40 ring-1 ring-primary/15"
              )}
              aria-label="Filter by equipment"
            >
              <option value={ALL_ASSETS}>All equipment</option>
              {assetOptions.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
            {filterAsset !== ALL_ASSETS && (
              <button
                type="button"
                onClick={() => setFilterAsset(ALL_ASSETS)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <X className="size-3.5" />
                Reset filter
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Active scope: <span className="font-medium text-foreground">{filterSummary}</span>
          </p>
        </div>

        <Tabs defaultValue="data-status" className="w-full">
          <TabsList className="mb-0 flex h-auto w-full flex-col gap-1 rounded-t-xl border border-b-0 border-border/80 bg-muted/40 p-1 sm:inline-flex sm:w-auto sm:flex-row sm:rounded-b-none sm:p-1">
            <TabsTrigger
              value="data-status"
              className="justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md sm:py-2.5"
            >
              <Activity className="size-4 shrink-0 opacity-70" aria-hidden />
              Data Status
            </TabsTrigger>
            <TabsTrigger
              value="fea-jobs"
              className="justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md sm:py-2.5"
            >
              <Cpu className="size-4 shrink-0 opacity-70" aria-hidden />
              FEA Jobs
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="data-status"
            className="mt-0 rounded-b-xl rounded-tr-xl border border-t-0 border-border/80 bg-card/95 p-5 shadow-md outline-none sm:p-6 lg:rounded-tr-none"
          >
            {showNonPrimaryNotice ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Data Status is available for{" "}
                  <span className="font-medium text-foreground">{DATA_JOBS_PRIMARY_ASSETS.join(", ")}</span>. Choose one of
                  those assets or <span className="font-medium text-foreground">All equipment</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {showCokerPanel && <CokerDataStatusPanel />}
                {filterAsset === ALL_ASSETS && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    {showHcuGhost && <DataStatusGhostPanel title={ASSET_HCU} />}
                    {showSmrGhost && <DataStatusGhostPanel title={ASSET_SMR} />}
                  </div>
                )}
                {filterAsset === ASSET_HCU && <DataStatusGhostPanel title={ASSET_HCU} />}
                {filterAsset === ASSET_SMR && <DataStatusGhostPanel title={ASSET_SMR} />}
              </div>
            )}
          </TabsContent>

          <TabsContent
            value="fea-jobs"
            className="mt-0 rounded-b-xl border border-t-0 border-border/80 bg-card/95 p-5 shadow-md outline-none sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-1 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-base font-semibold text-foreground">FEA &amp; sync jobs</h2>
              {filterAsset !== ALL_ASSETS && (
                <Badge variant="secondary" className="w-fit text-[10px] font-semibold uppercase tracking-wide">
                  Filtered: {filterAsset}
                </Badge>
              )}
            </div>
            <FeJobsTable jobs={filteredJobs} />
          </TabsContent>
        </Tabs>
    </ToolPageShell>
  )
}
