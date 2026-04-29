"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { sites } from "@/lib/data"

export function CreateDashboardDialog({
  open,
  onOpenChange,
  defaultEquipmentId,
  defaultFolderId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultEquipmentId?: string
  defaultFolderId?: string | null
}) {
  const createDashboard = useWorkspaceStore((s) => s.createDashboard)
  const router = useRouter()

  const allEquipment = sites.flatMap((s) =>
    s.units.flatMap((p) =>
      p.equipment.map((e) => ({ id: e.id, label: `${e.name} (${p.name})` }))
    )
  )

  const [name, setName] = useState("")
  const [equipmentId, setEquipmentId] = useState(
    defaultEquipmentId ?? allEquipment[0]?.id ?? ""
  )

  const submit = () => {
    if (!name.trim() || !equipmentId) return
    const dash = createDashboard({
      name: name.trim(),
      equipmentId,
      folderId: defaultFolderId ?? null,
      widgets: [],
    })
    setName("")
    onOpenChange(false)
    router.push(`/dashboard/dashboard/${dash.id}/edit`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New dashboard</DialogTitle>
          <DialogDescription>
            Pick the equipment this dashboard belongs to and give it a name.
            You can change the name later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dash-name" className="text-xs">
              Dashboard name
            </Label>
            <Input
              id="dash-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coker 01 — Pressure Watch"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dash-equipment" className="text-xs">
              Equipment
            </Label>
            <select
              id="dash-equipment"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              {allEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || !equipmentId}>
            Create &amp; open editor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
