"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Siren, Trash2, RotateCcw, FlaskConical, Plus, Pencil } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { sites } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  ALERT_PREDICATE_KINDS,
  ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID,
  cokerAlertInputParameters,
  cokerAlertOutputParameters,
  isAlertSettingComingSoonEquipment,
  isAlertSettingFullMockEquipment,
} from "@/lib/alert-setting-mock"
import type { AlertPredicateKindId } from "@/lib/alert-setting-mock"
import { pushOperationalAlertDemo } from "@/lib/alert-setting-test-notifications"
import {
  useAlertSettingStore,
  type MockAlertRule,
  type MockParameterCondition,
  type AlertAssigneeAccess,
} from "@/lib/alert-setting-store"
import { ORG_USERS, findOrgUserById } from "@/lib/workspace/identity"
import { useWorkspaceCurrentUserId } from "@/lib/workspace/use-workspace-user-id"
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
  ToolPageRouteChip,
} from "@/components/tools/tool-page-layout"

function equipmentDirectory() {
  const rows: { id: string; label: string }[] = []
  for (const site of sites) {
    for (const unit of site.units) {
      for (const eq of unit.equipment) {
        rows.push({ id: eq.id, label: `${eq.name} · ${site.name}` })
      }
    }
  }
  return rows
}

function parameterCatalog() {
  const inputs = cokerAlertInputParameters.map((p) => ({
    id: p.id,
    label: `${p.label} (input)`,
  }))
  const outputs = cokerAlertOutputParameters.map((p) => ({
    id: p.id,
    label: `${p.label} (output)`,
  }))
  return [...inputs, ...outputs]
}

function needsTwoBounds(kind: AlertPredicateKindId): boolean {
  const meta = ALERT_PREDICATE_KINDS.find((k) => k.id === kind)
  return meta?.needs === "two"
}

function validateCondition(c: MockParameterCondition): string | null {
  const na = Number(c.a)
  const nb = Number(c.b)
  if (needsTwoBounds(c.predicateKind)) {
    if (c.a === "" || c.b === "") return "Enter both bounds."
    if (!Number.isFinite(na) || !Number.isFinite(nb)) return "Bounds must be numbers."
    const openBetween = c.predicateKind === "between_open"
    if (openBetween && na >= nb) return "For > & <, lower bound must be less than upper."
    if (
      (c.predicateKind === "between_closed" ||
        c.predicateKind === "between_left_closed" ||
        c.predicateKind === "between_right_closed") &&
      na > nb
    ) {
      return "Invalid interval: lower bound must not exceed upper."
    }
  } else if (ALERT_PREDICATE_KINDS.find((k) => k.id === c.predicateKind)?.needs === "one") {
    if (c.a === "" || !Number.isFinite(na)) return "Enter a numeric threshold."
  } else if (ALERT_PREDICATE_KINDS.find((k) => k.id === c.predicateKind)?.needs === "window") {
    if (!c.windowLabel?.trim()) return "Describe the rate window."
  }
  return null
}

function defaultConditionForParameter(parameterId: string): MockParameterCondition {
  return {
    parameterId,
    predicateKind: "gt",
    a: "0",
    b: "",
    windowLabel: "15 min window",
  }
}

function buildBlankAssignees(currentUserId: string) {
  const blank: Record<string, { on: boolean; access: AlertAssigneeAccess; mayDel: boolean }> = {}
  for (const u of ORG_USERS) {
    if (u.id === currentUserId) continue
    blank[u.id] = { on: false, access: "notify_only", mayDel: false }
  }
  return blank
}

export function AlertSettingView() {
  const searchParams = useSearchParams()
  const me = useWorkspaceCurrentUserId()
  const { preFilterEquipmentId, setPreFilterEquipmentId } = useAppStore()
  const catalog = useMemo(() => parameterCatalog(), [])
  const equipOptions = useMemo(() => equipmentDirectory(), [])

  const [equipmentId, setEquipmentId] = useState<string>(ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID)
  const rules = useAlertSettingStore((s) => s.rules)
  const deletedRules = useAlertSettingStore((s) => s.deletedRules)
  const deleteRequests = useAlertSettingStore((s) => s.deleteRequests)
  const addRule = useAlertSettingStore((s) => s.addRule)
  const updateRule = useAlertSettingStore((s) => s.updateRule)
  const softDeleteRule = useAlertSettingStore((s) => s.softDeleteRule)
  const recoverRule = useAlertSettingStore((s) => s.recoverRule)
  const addDeleteRequest = useAlertSettingStore((s) => s.addDeleteRequest)
  const resolveDeleteRequest = useAlertSettingStore((s) => s.resolveDeleteRequest)

  useEffect(() => {
    const q = searchParams.get("equipment")
    const pick = q || preFilterEquipmentId
    if (pick) setEquipmentId(pick)
    if (preFilterEquipmentId) setPreFilterEquipmentId(null)
  }, [searchParams, preFilterEquipmentId, setPreFilterEquipmentId])

  const fullMock = isAlertSettingFullMockEquipment(equipmentId)
  const comingSoon = isAlertSettingComingSoonEquipment(equipmentId)

  const visibleRules = rules.filter((r) => {
    if (r.equipmentId !== equipmentId) return false
    if (r.ownerUserId === me) return true
    return r.assignees.some((a) => a.userId === me) && r.status === "active"
  })
  const visibleDeleted = deletedRules.filter(
    (r) =>
      r.equipmentId === equipmentId &&
      (r.ownerUserId === me || r.assignees.some((a) => a.userId === me))
  )
  const pendingDeletes = deleteRequests.filter((d) => d.status === "pending")

  const [draftName, setDraftName] = useState("")
  const [draftParams, setDraftParams] = useState<string[]>([])
  const [draftCombine, setDraftCombine] = useState<"AND" | "OR">("AND")
  const [draftSchedule, setDraftSchedule] = useState<MockAlertRule["scheduleMode"]>("one_shot")
  const [draftScheduleNote, setDraftScheduleNote] = useState("")
  const [draftAssignees, setDraftAssignees] = useState(() => buildBlankAssignees(me))
  const [draftConditions, setDraftConditions] = useState<MockParameterCondition[]>([])
  const [draftCreateError, setDraftCreateError] = useState<string | null>(null)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  const resetDraft = useCallback(() => {
    setDraftName("")
    setDraftParams([])
    setDraftConditions([])
    setDraftCombine("AND")
    setDraftSchedule("one_shot")
    setDraftScheduleNote("")
    setDraftAssignees(buildBlankAssignees(me))
    setDraftCreateError(null)
  }, [me])

  const openCreateSheet = () => {
    resetDraft()
    setCreateSheetOpen(true)
  }

  const handleCreate = () => {
    if (!fullMock) return
    const name = draftName.trim() || "Untitled alert"
    if (draftParams.length === 0) {
      setDraftCreateError("Select at least one parameter.")
      return
    }
    for (const pid of draftParams) {
      const c = draftConditions.find((x) => x.parameterId === pid)
      if (!c) {
        setDraftCreateError("Each selected parameter needs a condition row.")
        return
      }
      const msg = validateCondition(c)
      if (msg) {
        setDraftCreateError(msg)
        return
      }
    }
    setDraftCreateError(null)
    const conditions: MockParameterCondition[] = draftParams.map(
      (pid) => draftConditions.find((x) => x.parameterId === pid)!
    )
    const assignees = Object.entries(draftAssignees)
      .filter(([, v]) => v.on)
      .map(([userId, v]) => ({
        userId,
        accessLevel: v.access,
        mayInitiateDeleteRequest: v.mayDel,
      }))
    const status = assignees.length > 0 ? "active" : "draft"
    addRule({
      equipmentId,
      ownerUserId: me,
      name,
      status,
      parameterIds: draftParams,
      combineOperator: draftCombine,
      conditions,
      scheduleMode: draftSchedule,
      scheduleNote: draftScheduleNote || "—",
      assignees,
    })
    setCreateSheetOpen(false)
    resetDraft()
  }

  const runTest = (rule: MockAlertRule) => {
    pushOperationalAlertDemo({
      ruleName: rule.name,
      equipmentId: rule.equipmentId,
      ownerUserId: rule.ownerUserId,
      assigneeUserIds: rule.assignees.map((a) => a.userId),
    })
  }

  return (
    <ToolPageShell>
      <ToolPageHeader
        title="Alert Setting"
        titleAdornment={<Siren className="h-8 w-8 text-amber-500" aria-hidden />}
        description={
          <>
            Equipment alerts for Coker 01 — assign people, compose conditions, schedules, and review history. Saving
            with assignees publishes as <strong>active</strong> so they see the rule; owner-only rules stay{" "}
            <strong>draft</strong> until you activate them in edit. Threshold crossing is not evaluated here;{" "}
            <strong>Test</strong> sends a preview notification to you and all assignees.
          </>
        }
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList className="text-xs">
              <ToolsModuleHomeCrumb />
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Alert Setting</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        trailing={
          <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:max-w-xs sm:items-end">
            <Label htmlFor="eq-filter">Equipment</Label>
            <Select value={equipmentId} onValueChange={setEquipmentId}>
              <SelectTrigger id="eq-filter" className="w-full min-w-0 sm:min-w-[16rem]">
                <SelectValue placeholder="Select equipment" />
              </SelectTrigger>
              <SelectContent>
                {equipOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ToolPageRouteChip path="/tools/alert-setting" />
          </div>
        }
      />

      <div className="space-y-6">
        {comingSoon && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Coming soon</CardTitle>
              <CardDescription>
                Alert Setting is not available for this equipment yet. Switch to{" "}
                <strong>Coker 01</strong> for the full experience.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!fullMock && !comingSoon && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipment not supported yet</CardTitle>
              <CardDescription>Select Coker 01, HCU 01, or SMR Pigtails from the directory.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {fullMock && pendingDeletes.some((d) => {
          const r = rules.find((x) => x.id === d.ruleId)
          return r && r.ownerUserId === me
        }) && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pending delete requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingDeletes.map((d) => {
                const rule = rules.find((r) => r.id === d.ruleId)
                if (!rule || rule.ownerUserId !== me) return null
                const who = findOrgUserById(d.requesterUserId)
                return (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
                  >
                    <span>
                      <strong>{who?.name ?? d.requesterUserId}</strong> asked to delete{" "}
                      <em>{rule.name}</em>
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => resolveDeleteRequest(d.id, "rejected", me)}>
                        Reject
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => resolveDeleteRequest(d.id, "accepted", me)}>
                        Accept & archive
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {fullMock && (
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active rules ({visibleRules.length})</TabsTrigger>
              <TabsTrigger value="history">Deleted history ({visibleDeleted.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button type="button" onClick={openCreateSheet} className="gap-2">
                  <Plus className="h-4 w-4" aria-hidden />
                  Create alert
                </Button>
              </div>
              {visibleRules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  me={me}
                  catalog={catalog}
                  onUpdate={updateRule}
                  onDelete={() => softDeleteRule(rule.id)}
                  onTest={() => runTest(rule)}
                  onRequestDelete={() => addDeleteRequest(rule.id, me)}
                />
              ))}

              <Sheet
                open={createSheetOpen}
                onOpenChange={(open) => {
                  setCreateSheetOpen(open)
                  if (!open) resetDraft()
                }}
              >
                <SheetContent
                  side="right"
                  className="w-full h-full sm:max-w-2xl max-w-[min(100vw,42rem)] flex flex-col gap-0 overflow-hidden p-0"
                >
                  <SheetHeader className="border-b border-border px-6 py-4 text-left shrink-0">
                    <SheetTitle>Create alert</SheetTitle>
                    <SheetDescription>
                      Configure name, parameters, predicates, combine logic, schedule, and assignees,
                      then save once. Rules are saved as draft until you activate them on the card.
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="flex-1 min-h-0 px-6">
                    <div className="space-y-4 py-4 pr-3">
                      <div className="space-y-2">
                        <Label htmlFor="draft-name">Alert name</Label>
                        <Input
                          id="draft-name"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="e.g. High skin temperature"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Parameters</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {catalog.map((p) => (
                            <label key={p.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={draftParams.includes(p.id)}
                                onCheckedChange={(v) => {
                                  const on = v === true
                                  setDraftParams((prev) =>
                                    on ? [...prev, p.id] : prev.filter((x) => x !== p.id)
                                  )
                                  setDraftConditions((prev) =>
                                    on
                                      ? [...prev, defaultConditionForParameter(p.id)]
                                      : prev.filter((c) => c.parameterId !== p.id)
                                  )
                                }}
                              />
                              {p.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {draftParams.length > 0 && (
                        <div className="space-y-3">
                          <Separator />
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Conditions (per parameter)
                          </p>
                          {draftParams.map((pid) => {
                            const c = draftConditions.find((x) => x.parameterId === pid)
                            if (!c) return null
                            const label = catalog.find((x) => x.id === pid)?.label ?? pid
                            return (
                              <div
                                key={pid}
                                className="rounded-md border border-border p-3 space-y-2 bg-muted/20"
                              >
                                <div className="text-sm font-medium">{label}</div>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Predicate</Label>
                                    <Select
                                      value={c.predicateKind}
                                      onValueChange={(v) => {
                                        const nk = v as AlertPredicateKindId
                                        setDraftConditions((prev) =>
                                          prev.map((row) =>
                                            row.parameterId === pid
                                              ? { ...row, predicateKind: nk }
                                              : row
                                          )
                                        )
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-72">
                                        {ALERT_PREDICATE_KINDS.map((k) => (
                                          <SelectItem key={k.id} value={k.id}>
                                            {k.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">A / primary</Label>
                                    <Input
                                      value={c.a}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setDraftConditions((prev) =>
                                          prev.map((row) =>
                                            row.parameterId === pid ? { ...row, a: val } : row
                                          )
                                        )
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">B (if needed)</Label>
                                    <Input
                                      value={c.b}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setDraftConditions((prev) =>
                                          prev.map((row) =>
                                            row.parameterId === pid ? { ...row, b: val } : row
                                          )
                                        )
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Slope window note</Label>
                                    <Input
                                      value={c.windowLabel ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value
                                        setDraftConditions((prev) =>
                                          prev.map((row) =>
                                            row.parameterId === pid
                                              ? { ...row, windowLabel: val }
                                              : row
                                          )
                                        )
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Combine parameters with</Label>
                        <RadioGroup
                          value={draftCombine}
                          onValueChange={(v) => setDraftCombine(v as "AND" | "OR")}
                          className="flex gap-4"
                        >
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="AND" id="sheet-c-and" /> AND
                          </label>
                          <label className="flex items-center gap-2 text-sm">
                            <RadioGroupItem value="OR" id="sheet-c-or" /> OR
                          </label>
                        </RadioGroup>
                      </div>
                      <div className="space-y-2">
                        <Label>Schedule</Label>
                        <Select
                          value={draftSchedule}
                          onValueChange={(v) =>
                            setDraftSchedule(v as MockAlertRule["scheduleMode"])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_shot">One time only</SelectItem>
                            <SelectItem value="recurring">Recurring</SelectItem>
                            <SelectItem value="date_window">Specific dates</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={draftScheduleNote}
                          onChange={(e) => setDraftScheduleNote(e.target.value)}
                          placeholder="Cron or window description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assignees</Label>
                        <div className="space-y-2">
                          {ORG_USERS.filter((u) => u.id !== me).map((u) => {
                            const row = draftAssignees[u.id] ?? {
                              on: false,
                              access: "notify_only" as const,
                              mayDel: false,
                            }
                            return (
                              <div
                                key={u.id}
                                className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
                              >
                                <label className="flex items-center gap-2 text-sm min-w-[140px]">
                                  <Checkbox
                                    checked={row.on}
                                    onCheckedChange={(v) =>
                                      setDraftAssignees((prev) => ({
                                        ...prev,
                                        [u.id]: { ...row, on: v === true },
                                      }))
                                    }
                                  />
                                  {u.name}
                                </label>
                                <Select
                                  value={row.access}
                                  disabled={!row.on}
                                  onValueChange={(v) =>
                                    setDraftAssignees((prev) => ({
                                      ...prev,
                                      [u.id]: { ...row, access: v as AlertAssigneeAccess },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="sm:w-44">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="notify_only">Notify only</SelectItem>
                                    <SelectItem value="comment_on_alert">Comment on alert</SelectItem>
                                    <SelectItem value="co_edit_rule">Co-edit rule</SelectItem>
                                  </SelectContent>
                                </Select>
                                <label className="flex items-center gap-2 text-sm">
                                  <Checkbox
                                    disabled={!row.on}
                                    checked={row.mayDel}
                                    onCheckedChange={(v) =>
                                      setDraftAssignees((prev) => ({
                                        ...prev,
                                        [u.id]: { ...row, mayDel: v === true },
                                      }))
                                    }
                                  />
                                  Can request delete
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {draftCreateError && (
                        <p className="text-sm text-destructive">{draftCreateError}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 pb-4">
                        <FlaskConical className="h-3 w-3 shrink-0" />
                        After save, use <strong>Edit</strong> on the card to change the rule, set it{" "}
                        <strong>Active</strong>, or run <strong>Test</strong>.
                      </p>
                    </div>
                  </ScrollArea>
                  <SheetFooter className="border-t border-border px-6 py-4 flex flex-row flex-wrap gap-2 justify-end shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateSheetOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleCreate} disabled={draftParams.length === 0}>
                      Save alert
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </TabsContent>
            <TabsContent value="history" className="space-y-3 mt-4">
              {visibleDeleted.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deleted alerts.</p>
              ) : (
                visibleDeleted.map((r) => (
                  <Card key={r.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base">{r.name}</CardTitle>
                        <CardDescription>Archived (soft delete)</CardDescription>
                      </div>
                      {r.ownerUserId === me ? (
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => recoverRule(r.id)}>
                          <RotateCcw className="h-3.5 w-3.5" /> Recover
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Owner can recover</span>
                      )}
                    </CardHeader>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ToolPageShell>
  )
}

function cloneAlertRule(r: MockAlertRule): MockAlertRule {
  return {
    ...r,
    parameterIds: [...r.parameterIds],
    conditions: r.conditions.map((c) => ({ ...c })),
    assignees: r.assignees.map((a) => ({ ...a })),
  }
}

function RuleCard({
  rule,
  me,
  catalog,
  onUpdate,
  onDelete,
  onTest,
  onRequestDelete,
}: {
  rule: MockAlertRule
  me: string
  catalog: { id: string; label: string }[]
  onUpdate: (id: string, patch: Partial<MockAlertRule>) => void
  onDelete: () => void
  onTest: () => void
  onRequestDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MockAlertRule | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const isOwner = rule.ownerUserId === me
  const myAssignee = rule.assignees.find((a) => a.userId === me)
  const canCoEdit = myAssignee?.accessLevel === "co_edit_rule"
  const canRequestDelete = myAssignee?.mayInitiateDeleteRequest && !isOwner

  const model = editing && draft ? draft : rule
  const canTest =
    rule.ownerUserId === me ||
    (rule.status === "active" && rule.assignees.some((a) => a.userId === me))
  const canEnterEdit = isOwner || canCoEdit
  const fieldsEditable = editing && (isOwner || canCoEdit)
  const statusEditable = editing && isOwner

  const labelFor = (id: string) => catalog.find((c) => c.id === id)?.label ?? id

  const beginEdit = () => {
    setErr(null)
    setDraft(cloneAlertRule(rule))
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(null)
    setEditing(false)
    setErr(null)
  }

  const saveEdit = () => {
    if (!draft) return
    for (const c of draft.conditions) {
      const msg = validateCondition(c)
      if (msg) {
        setErr(msg)
        return
      }
    }
    setErr(null)
    onUpdate(rule.id, {
      name: draft.name.trim() || rule.name,
      status: draft.status,
      combineOperator: draft.combineOperator,
      scheduleMode: draft.scheduleMode,
      scheduleNote: draft.scheduleNote,
      conditions: draft.conditions,
      parameterIds: draft.conditions.map((c) => c.parameterId),
      assignees: draft.assignees,
    })
    setDraft(null)
    setEditing(false)
  }

  const patchDraft = (patch: Partial<MockAlertRule>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d))
  }

  const applyDraftConditions = (next: MockParameterCondition[]) => {
    const msgs = next.map(validateCondition).filter(Boolean) as string[]
    setErr(msgs[0] ?? null)
    setDraft((d) =>
      d
        ? {
            ...d,
            conditions: next,
            parameterIds: next.map((c) => c.parameterId),
          }
        : d
    )
  }

  const assigneeRow = (d: MockAlertRule, uid: string) => {
    const a = d.assignees.find((x) => x.userId === uid)
    return a
      ? { on: true, access: a.accessLevel, mayDel: a.mayInitiateDeleteRequest }
      : { on: false, access: "notify_only" as const, mayDel: false }
  }

  const setAssigneeFromRow = (uid: string, row: { on: boolean; access: AlertAssigneeAccess; mayDel: boolean }) => {
    setDraft((d) => {
      if (!d) return d
      let assignees = d.assignees.filter((a) => a.userId !== uid)
      if (row.on) {
        assignees = [
          ...assignees,
          {
            userId: uid,
            accessLevel: row.access,
            mayInitiateDeleteRequest: row.mayDel,
          },
        ]
      }
      return { ...d, assignees }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1 space-y-2">
          {!editing ? (
            <CardTitle className="text-base flex flex-wrap items-center gap-2">
              {rule.name}
              <Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge>
            </CardTitle>
          ) : (
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs">Alert name</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="max-w-md"
                    value={draft?.name ?? ""}
                    disabled={!fieldsEditable}
                    onChange={(e) => patchDraft({ name: e.target.value })}
                  />
                  {!statusEditable && draft ? (
                    <Badge variant={draft.status === "active" ? "default" : "secondary"}>
                      {draft.status}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {statusEditable && draft && (
                <div className="space-y-1">
                  <Label className="text-xs">Visibility</Label>
                  <RadioGroup
                    value={draft.status === "active" ? "active" : "draft"}
                    onValueChange={(v) =>
                      patchDraft({ status: v === "active" ? "active" : "draft" })
                    }
                    className="flex gap-4"
                  >
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="draft" id={`st-draft-${rule.id}`} /> Draft (only you)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <RadioGroupItem value="active" id={`st-act-${rule.id}`} /> Active (assignees see it)
                    </label>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}
          <CardDescription>
            Combine: <strong>{model.combineOperator}</strong> · Schedule: {model.scheduleMode} —{" "}
            {model.scheduleNote}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-xs px-2"
            disabled={!canTest}
            onClick={onTest}
          >
            Test
          </Button>
          {!editing && canEnterEdit && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={beginEdit}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          )}
          {editing && (
            <>
              <Button type="button" size="sm" className="h-7 text-xs px-2" onClick={saveEdit}>
                Done
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={cancelEdit}>
                Cancel
              </Button>
            </>
          )}
          {isOwner && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1 px-2" onClick={onDelete}>
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          )}
          {canRequestDelete && (
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs px-2" onClick={onRequestDelete}>
              Request delete
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && fieldsEditable && draft && (
          <>
            <div className="space-y-2">
              <Label>Combine parameters with</Label>
              <RadioGroup
                value={draft.combineOperator}
                onValueChange={(v) => patchDraft({ combineOperator: v as "AND" | "OR" })}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="AND" id={`cb-and-${rule.id}`} /> AND
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="OR" id={`cb-or-${rule.id}`} /> OR
                </label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select
                value={draft.scheduleMode}
                onValueChange={(v) => patchDraft({ scheduleMode: v as MockAlertRule["scheduleMode"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_shot">One time only</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="date_window">Specific dates</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={draft.scheduleNote}
                onChange={(e) => patchDraft({ scheduleNote: e.target.value })}
                placeholder="Cron or window description"
              />
            </div>
          </>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Assignees</p>
          {!editing || !fieldsEditable || !draft ? (
            <div className="flex flex-wrap gap-1">
              {rule.assignees.length === 0 ? (
                <span className="text-xs text-muted-foreground">None (owner only until you add assignees)</span>
              ) : (
                rule.assignees.map((a) => {
                  const u = findOrgUserById(a.userId)
                  return (
                    <Badge key={a.userId} variant="outline">
                      {u?.name ?? a.userId} · {a.accessLevel}
                      {a.mayInitiateDeleteRequest ? " · may request delete" : ""}
                    </Badge>
                  )
                })
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {ORG_USERS.filter((u) => u.id !== me).map((u) => {
                const row = assigneeRow(draft, u.id)
                return (
                  <div
                    key={u.id}
                    className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
                  >
                    <label className="flex items-center gap-2 text-sm min-w-[140px]">
                      <Checkbox
                        checked={row.on}
                        onCheckedChange={(v) =>
                          setAssigneeFromRow(u.id, { ...row, on: v === true })
                        }
                      />
                      {u.name}
                    </label>
                    <Select
                      value={row.access}
                      disabled={!row.on}
                      onValueChange={(v) =>
                        setAssigneeFromRow(u.id, {
                          ...row,
                          access: v as AlertAssigneeAccess,
                        })
                      }
                    >
                      <SelectTrigger className="sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notify_only">Notify only</SelectItem>
                        <SelectItem value="comment_on_alert">Comment on alert</SelectItem>
                        <SelectItem value="co_edit_rule">Co-edit rule</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        disabled={!row.on}
                        checked={row.mayDel}
                        onCheckedChange={(v) =>
                          setAssigneeFromRow(u.id, { ...row, mayDel: v === true })
                        }
                      />
                      Can request delete
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <Separator />
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Conditions (per parameter)
          </p>
          {model.conditions.map((c, idx) => (
            <div key={`${c.parameterId}-${idx}`} className="rounded-md border border-border p-3 space-y-2">
              <div className="text-sm font-medium">{labelFor(c.parameterId)}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Predicate</Label>
                  <Select
                    value={c.predicateKind}
                    disabled={!fieldsEditable}
                    onValueChange={(v) => {
                      const nk = v as AlertPredicateKindId
                      const base = editing && draft ? draft.conditions : rule.conditions
                      const next = [...base]
                      next[idx] = { ...c, predicateKind: nk }
                      if (editing && draft) applyDraftConditions(next)
                      else {
                        const msgs = next.map(validateCondition).filter(Boolean) as string[]
                        setErr(msgs[0] ?? null)
                        onUpdate(rule.id, { conditions: next })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ALERT_PREDICATE_KINDS.map((k) => (
                        <SelectItem key={k.id} value={k.id}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">A / primary</Label>
                  <Input
                    value={c.a}
                    disabled={!fieldsEditable}
                    onChange={(e) => {
                      const base = editing && draft ? draft.conditions : rule.conditions
                      const next = [...base]
                      next[idx] = { ...c, a: e.target.value }
                      if (editing && draft) setDraft((d) => (d ? { ...d, conditions: next } : d))
                      else onUpdate(rule.id, { conditions: next })
                    }}
                    onBlur={() => {
                      const conds = editing && draft ? draft.conditions : rule.conditions
                      if (editing && draft) applyDraftConditions(conds)
                      else {
                        const msgs = conds.map(validateCondition).filter(Boolean) as string[]
                        setErr(msgs[0] ?? null)
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">B (if needed)</Label>
                  <Input
                    value={c.b}
                    disabled={!fieldsEditable}
                    onChange={(e) => {
                      const base = editing && draft ? draft.conditions : rule.conditions
                      const next = [...base]
                      next[idx] = { ...c, b: e.target.value }
                      if (editing && draft) setDraft((d) => (d ? { ...d, conditions: next } : d))
                      else onUpdate(rule.id, { conditions: next })
                    }}
                    onBlur={() => {
                      const conds = editing && draft ? draft.conditions : rule.conditions
                      if (editing && draft) applyDraftConditions(conds)
                      else {
                        const msgs = conds.map(validateCondition).filter(Boolean) as string[]
                        setErr(msgs[0] ?? null)
                      }
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Slope window note</Label>
                  <Input
                    value={c.windowLabel ?? ""}
                    disabled={!fieldsEditable}
                    onChange={(e) => {
                      const base = editing && draft ? draft.conditions : rule.conditions
                      const next = [...base]
                      next[idx] = { ...c, windowLabel: e.target.value }
                      if (editing && draft) setDraft((d) => (d ? { ...d, conditions: next } : d))
                      else onUpdate(rule.id, { conditions: next })
                    }}
                    onBlur={() => {
                      const conds = editing && draft ? draft.conditions : rule.conditions
                      if (editing && draft) applyDraftConditions(conds)
                      else {
                        const msgs = conds.map(validateCondition).filter(Boolean) as string[]
                        setErr(msgs[0] ?? null)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <FlaskConical className="h-3 w-3" />
          Crossing detection is not enabled — Test sends a notification preview to you and assignees.
        </p>
      </CardContent>
    </Card>
  )
}
