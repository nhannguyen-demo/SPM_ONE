"use client"

import { memo, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DashboardContextState } from "@/lib/workspace/types"

const DURATION_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
] as const

type DurationKey = "7d" | "30d" | "custom"

function DashboardContextBarInner({
  value,
  onChange,
  disabled,
}: {
  value: DashboardContextState
  onChange: (v: DashboardContextState) => void
  disabled?: boolean
}) {
  const activeDuration: DurationKey = (value.durationKey as DurationKey) ?? "7d"
  const [cycle, setCycle] = useState(value.cycleId ?? "2751")

  useEffect(() => {
    setCycle(value.cycleId ?? "2751")
  }, [value.cycleId])

  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2 border-b border-border bg-muted/10 text-xs">
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Duration</Label>
        <Select
          value={activeDuration}
          onValueChange={(durationKey) => {
            // Guard: only propagate when the value actually changed.
            // Some Radix UI versions fire onValueChange during internal sync —
            // this prevents the resulting setState → re-render → sync loop.
            if (durationKey !== activeDuration) {
              onChange({ ...value, durationKey })
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Cycle ID</Label>
        <Input
          className="h-8 w-24 text-xs"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
          onBlur={() => {
            const cycleId = cycle || undefined
            if (cycleId !== value.cycleId) onChange({ ...value, cycleId })
          }}
          disabled={disabled}
        />
      </div>
      <div className="text-[10px] text-muted-foreground pt-4">
        Latest: {value.latestUpdateLabel ?? "—"}
      </div>
    </div>
  )
}

/**
 * Memo-wrapped with value comparison: only re-renders when actual dashboard
 * context values change, not when the parent re-renders with a new `value`
 * object reference carrying the same data.
 */
export const DashboardContextBar = memo(DashboardContextBarInner, (prev, next) => {
  return (
    prev.value.durationKey === next.value.durationKey &&
    prev.value.cycleId === next.value.cycleId &&
    prev.value.latestUpdateLabel === next.value.latestUpdateLabel &&
    prev.disabled === next.disabled
  )
})
