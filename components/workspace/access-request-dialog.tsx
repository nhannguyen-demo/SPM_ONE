"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { useWorkspaceCurrentUserId } from "@/lib/workspace/use-workspace-user-id"
import type { SharePermission } from "@/lib/workspace/types"

const MESSAGE_MAX = 500

export interface AccessRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dashboardId: string
  dashboardName: string
  ownerName: string
  requestedPermission: Exclude<SharePermission, "view">
  onSuccess?: () => void
}

function permissionLabel(permission: Exclude<SharePermission, "view">): string {
  return permission === "comment" ? "comment" : "edit"
}

export function AccessRequestDialog({
  open,
  onOpenChange,
  dashboardId,
  dashboardName,
  ownerName,
  requestedPermission,
  onSuccess,
}: AccessRequestDialogProps) {
  const me = useWorkspaceCurrentUserId()
  const requestPermission = useWorkspaceStore((s) => s.requestPermission)
  const hasPending = useWorkspaceStore((s) =>
    s.permissionRequests.some(
      (r) =>
        r.dashboardId === dashboardId &&
        r.requestedByUserId === me &&
        r.requestedPermission === requestedPermission &&
        r.status === "pending"
    )
  )

  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setMessage("")
      setSubmitting(false)
    }
  }, [open])

  const label = permissionLabel(requestedPermission)
  const title =
    requestedPermission === "comment"
      ? "Request comment access"
      : "Request edit access"

  const handleSubmit = async () => {
    if (hasPending) {
      toast.info(`You already have a pending ${label} access request`)
      return
    }
    setSubmitting(true)
    try {
      const req = await requestPermission({
        dashboardId,
        requestedPermission,
        message: message.trim() || undefined,
      })
      if (req) {
        toast.success(`Requested ${label} access from ${ownerName}`)
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast.error("Could not send access request")
      }
    } catch (e) {
      toast.error("Could not send access request", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            You need {label} permission on &ldquo;{dashboardName}&rdquo;. Send a
            request to {ownerName}; they can approve it from Notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="access-request-note" className="text-sm">
            Note <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="access-request-note"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
            placeholder="Add context for the owner…"
            rows={3}
            maxLength={MESSAGE_MAX}
          />
          <p className="text-xs text-muted-foreground text-right">
            {message.length}/{MESSAGE_MAX}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
