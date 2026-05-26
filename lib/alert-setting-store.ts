"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { AlertPredicateKindId } from "@/lib/alert-setting-mock"
import { ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID } from "@/lib/alert-setting-mock"

export type AlertAssigneeAccess = "notify_only" | "comment_on_alert" | "co_edit_rule"

export interface MockAlertAssignee {
  userId: string
  accessLevel: AlertAssigneeAccess
  /**
   * Only valid when accessLevel is notify_only or comment_on_alert.
   * Must be false (and hidden in UI) for co_edit_rule.
   */
  mayInitiateDeleteRequest: boolean
}

export type AlertScheduleMode = "one_shot" | "recurring" | "date_window"
export type AlertScheduleFrequency = "daily" | "weekly" | "monthly"

export interface MockParameterCondition {
  parameterId: string
  predicateKind: AlertPredicateKindId
  /** Primary bound / threshold — string until evaluation is wired. */
  a: string
  b: string
  /** Internal hint for slope predicates — not surfaced as a user input. */
  windowLabel?: string
}

export interface MockAlertRule {
  id: string
  equipmentId: string
  ownerUserId: string
  name: string
  status: "draft" | "active" | "archived_deleted"
  parameterIds: string[]
  combineOperator: "AND" | "OR"
  conditions: MockParameterCondition[]
  scheduleMode: AlertScheduleMode
  /** @deprecated kept for backward compat; no longer shown in UI */
  scheduleNote: string
  /** For one_shot / date_window / recurring: the fire/start date (YYYY-MM-DD). */
  scheduleStartDate?: string
  /** HH:mm — time component for scheduleStartDate. */
  scheduleStartTime?: string
  /** For date_window: end date. For recurring: optional last repeat date. */
  scheduleEndDate?: string
  /** HH:mm — time component for scheduleEndDate. */
  scheduleEndTime?: string
  /** Required when scheduleMode = recurring. */
  scheduleFrequency?: AlertScheduleFrequency
  assignees: MockAlertAssignee[]
  createdAt: string
  updatedAt: string
}

export interface MockDeleteRequest {
  id: string
  ruleId: string
  requesterUserId: string
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

function nowIso() {
  return new Date().toISOString()
}

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

interface AlertSettingState {
  rules: MockAlertRule[]
  deletedRules: MockAlertRule[]
  deleteRequests: MockDeleteRequest[]
  addRule: (input: Omit<MockAlertRule, "id" | "createdAt" | "updatedAt" | "status"> & { status?: MockAlertRule["status"] }) => MockAlertRule
  updateRule: (id: string, patch: Partial<Omit<MockAlertRule, "id" | "createdAt">>) => void
  softDeleteRule: (id: string) => void
  recoverRule: (id: string) => void
  addDeleteRequest: (ruleId: string, requesterUserId: string) => void
  resolveDeleteRequest: (id: string, status: "accepted" | "rejected", ownerUserId: string) => void
  resetToSeed: () => void
}

const defaultRule: MockAlertRule = {
  id: "alert-rule-seed-1",
  equipmentId: ALERT_SETTING_FULL_MOCK_EQUIPMENT_ID,
  ownerUserId: "user-nhan",
  name: "Coker drum skin — temperature watch",
  status: "active",
  parameterIds: ["input-temperature", "input-pressure"],
  combineOperator: "AND",
  conditions: [
    { parameterId: "input-temperature", predicateKind: "gt", a: "420", b: "" },
    { parameterId: "input-pressure", predicateKind: "between_closed", a: "180", b: "220" },
  ],
  scheduleMode: "recurring",
  scheduleNote: "",
  scheduleFrequency: "daily",
  scheduleStartTime: "06:00",
  assignees: [
    { userId: "user-ben", accessLevel: "comment_on_alert", mayInitiateDeleteRequest: true },
    { userId: "user-alex", accessLevel: "notify_only", mayInitiateDeleteRequest: false },
  ],
  createdAt: nowIso(),
  updatedAt: nowIso(),
}

const seedState = (): Pick<AlertSettingState, "rules" | "deletedRules" | "deleteRequests"> => ({
  rules: [defaultRule],
  deletedRules: [],
  deleteRequests: [],
})

export const useAlertSettingStore = create<AlertSettingState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      addRule: (input) => {
        const rule: MockAlertRule = {
          ...input,
          id: rid("rule"),
          status: input.status ?? "draft",
          createdAt: nowIso(),
          updatedAt: nowIso(),
        }
        set((s) => ({ rules: [rule, ...s.rules] }))
        return rule
      },

      updateRule: (id, patch) => {
        set((s) => ({
          rules: s.rules.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r
          ),
        }))
      },

      softDeleteRule: (id) => {
        const rule = get().rules.find((r) => r.id === id)
        if (!rule) return
        const archived: MockAlertRule = {
          ...rule,
          status: "archived_deleted",
          updatedAt: nowIso(),
        }
        set((s) => ({
          rules: s.rules.filter((r) => r.id !== id),
          deletedRules: [archived, ...s.deletedRules],
          deleteRequests: s.deleteRequests.filter((d) => d.ruleId !== id),
        }))
      },

      recoverRule: (id) => {
        const rule = get().deletedRules.find((r) => r.id === id)
        if (!rule) return
        const restored: MockAlertRule = {
          ...rule,
          status: "draft",
          updatedAt: nowIso(),
        }
        set((s) => ({
          deletedRules: s.deletedRules.filter((r) => r.id !== id),
          rules: [restored, ...s.rules],
        }))
      },

      addDeleteRequest: (ruleId, requesterUserId) => {
        const req: MockDeleteRequest = {
          id: rid("delreq"),
          ruleId,
          requesterUserId,
          status: "pending",
          createdAt: nowIso(),
        }
        set((s) => ({ deleteRequests: [req, ...s.deleteRequests] }))
      },

      resolveDeleteRequest: (id, status, ownerUserId) => {
        const req = get().deleteRequests.find((d) => d.id === id)
        if (!req || req.status !== "pending") return
        const rule = get().rules.find((r) => r.id === req.ruleId)
        if (!rule || rule.ownerUserId !== ownerUserId) return
        if (status === "accepted") {
          get().softDeleteRule(req.ruleId)
          return
        }
        set((s) => ({
          deleteRequests: s.deleteRequests.map((d) =>
            d.id === id ? { ...d, status: "rejected" } : d
          ),
        }))
      },

      resetToSeed: () => {
        set(seedState())
      },
    }),
    {
      name: "spm-one:alert-setting-v1",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, fromVersion) => {
        // v1 → v2: new schedule date/time fields default to undefined — no structural change needed.
        void fromVersion
        return persisted as ReturnType<typeof seedState>
      },
      partialize: (s) => ({
        rules: s.rules,
        deletedRules: s.deletedRules,
        deleteRequests: s.deleteRequests,
      }),
    }
  )
)
