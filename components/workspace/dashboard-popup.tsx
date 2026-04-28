"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Maximize2,
  Pencil,
  Share2,
  X,
  ExternalLink,
  Eye,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResponsiveDashboardGrid } from "./read-only-grid"
import { CommentsPanel } from "./comments-panel"
import { ShareDialog } from "./share-dialog"
import {
  useWorkspaceStore,
  selectMyPermissionOn,
} from "@/lib/workspace/store"
import { permissionAtLeast } from "@/lib/workspace/types"
import { findOrgUserById, getCurrentUserId } from "@/lib/workspace/identity"
import { sites } from "@/lib/data"

export interface DashboardPopupProps {
  dashboardId: string | null
  open: boolean
  onClose: () => void
  /** When true, render the "Open in new tab" full-screen action. */
  showOpenInNewTab?: boolean
  /** Optional initial mode: "view" or "comments". */
  initialMode?: "view" | "comments"
}

function equipmentName(equipmentId: string): string {
  for (const s of sites)
    for (const p of s.plants)
      for (const e of p.equipment) if (e.id === equipmentId) return e.name
  return "Unknown"
}

export function DashboardPopup({
  dashboardId,
  open,
  onClose,
  showOpenInNewTab,
  initialMode = "view",
}: DashboardPopupProps) {
  const router = useRouter()

  const dashboard = useWorkspaceStore((s) =>
    dashboardId ? s.dashboards.find((d) => d.id === dashboardId) ?? null : null
  )
  const myPermission = useWorkspaceStore((s) =>
    dashboardId ? selectMyPermissionOn(s, dashboardId) : null
  )
  const recordOpened = useWorkspaceStore((s) => s.recordDashboardOpened)
  const markFirstViewed = useWorkspaceStore((s) => s.markShareFirstViewed)
  const requestPermission = useWorkspaceStore((s) => s.requestPermission)
  const incomingShare = useWorkspaceStore((s) => {
    if (!dashboardId) return null
    const me = getCurrentUserId()
    return (
      s.shares.find(
        (sh) =>
          sh.dashboardId === dashboardId &&
          sh.sharedWithUserId === me &&
          !sh.revokedAt
      ) ?? null
    )
  })

  const [mode, setMode] = useState<"view" | "comments">(initialMode)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!dashboardId) return
    recordOpened(dashboardId)
    if (incomingShare && !incomingShare.firstViewedAt) {
      markFirstViewed(incomingShare.id)
    }
  }, [open, dashboardId, incomingShare, markFirstViewed, recordOpened])

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  if (!open || !dashboard) return null

  const owner = findOrgUserById(dashboard.ownerUserId)
  const me = getCurrentUserId()
  const isOwner = dashboard.ownerUserId === me
  const canEdit = permissionAtLeast(myPermission, "edit")

  const handleEdit = () => {
    onClose()
    router.push(`/workspace/dashboard/${dashboard.id}/edit`)
  }

  const handleOpenInNewTab = () => {
    if (typeof window === "undefined") return
    window.open(`/dashboards/${dashboard.id}/full`, "_blank", "noopener")
  }

  const handleRequestPermission = () => {
    if (!dashboard) return
    const desired: "comment" | "edit" =
      myPermission === "comment" ? "edit" : "comment"
    const req = requestPermission({
      dashboardId: dashboard.id,
      requestedPermission: desired,
      message: undefined,
    })
    if (req) {
      toast.success(
        `Requested ${desired} access from ${owner?.name ?? "owner"}`
      )
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full h-full max-w-7xl max-h-[92vh] bg-background rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground truncate">
                {equipmentName(dashboard.equipmentId)} ·{" "}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-1 py-0 rounded",
                    dashboard.lifecycleStatus === "published"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {dashboard.lifecycleStatus === "published" ? "Published" : "Draft"}
                </span>{" "}
                · Owner: {owner?.name ?? "Unknown"}
              </div>
              <h2 className="text-lg font-bold text-foreground truncate">{dashboard.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant={mode === "comments" ? "default" : "outline"}
                onClick={() => setMode(mode === "comments" ? "view" : "comments")}
                className="gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Comments
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEdit}
                disabled={!canEdit}
                className="gap-1"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              {(isOwner || canEdit) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShareDialogOpen(true)}
                  className="gap-1"
                >
                  <Share2 className="w-4 h-4" /> Share
                </Button>
              )}
              {showOpenInNewTab && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenInNewTab}
                  className="gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in new tab
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 flex">
            <div
              className={cn(
                "flex-1 min-w-0 overflow-auto bg-muted/20",
                mode === "comments" ? "border-r border-border" : ""
              )}
            >
              <ResponsiveDashboardGrid dashboard={dashboard} />
            </div>
            {mode === "comments" && (
              <div className="w-[340px] flex-shrink-0">
                <CommentsPanel
                  dashboardId={dashboard.id}
                  myPermission={myPermission}
                  onRequestPermission={
                    !permissionAtLeast(myPermission, "comment") && !isOwner
                      ? handleRequestPermission
                      : undefined
                  }
                />
              </div>
            )}
          </div>

          {/* Footer with permission affordance */}
          {!isOwner && (
            <div className="border-t border-border px-4 py-2 flex items-center justify-between bg-muted/20">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                You have <strong>{myPermission ?? "no"}</strong> access.
              </div>
              {!canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRequestPermission}
                  className="text-xs"
                >
                  Request {myPermission === "comment" ? "edit" : "comment"} access
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <ShareDialog
        dashboard={shareDialogOpen ? dashboard : null}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  )
}

// also export Maximize2 to keep tree-shaker friendly when consumers want it
export { Maximize2 }
