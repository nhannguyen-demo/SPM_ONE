"use client"

import { useEffect, useState } from "react"
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

export function DashboardContextBar({
  value,
  onChange,
  disabled,
}: {
  value: DashboardContextState
  onChange: (v: DashboardContextState) => void
  disabled?: boolean
}) {
  const [cycle, setCycle] = useState(value.cycleId ?? "2751")

  useEffect(() => {
    setCycle(value.cycleId ?? "2751")
  }, [value.cycleId])

  return (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2 border-b border-border bg-muted/10 text-xs">
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Duration</Label>
        <Select
          value={value.durationKey ?? "7d"}
          onValueChange={(durationKey) => onChange({ ...value, durationKey })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Cycle ID</Label>
        <Input
          className="h-8 w-24 text-xs"
          value={cycle}
          onChange={(e) => setCycle(e.target.value)}
          onBlur={() => onChange({ ...value, cycleId: cycle || undefined })}
          disabled={disabled}
        />
      </div>
      <div className="text-[10px] text-muted-foreground pt-4">
        Latest: {value.latestUpdateLabel ?? "—"}
      </div>
    </div>
  )
}
