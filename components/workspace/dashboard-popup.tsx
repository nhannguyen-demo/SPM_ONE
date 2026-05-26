"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Maximize2,
  Pencil,
  Share2,
  X,
  ExternalLink,
  Eye,
  MessageSquare,
  Globe2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ResponsiveDashboardGrid } from "./read-only-grid"
import { CommentsPanel } from "./comments-panel"
import { ShareDialog } from "./share-dialog"
import { AccessRequestDialog } from "./access-request-dialog"
import {
  useWorkspaceStore,
  selectMyPermissionOn,
} from "@/lib/workspace/store"
import {
  canCommentOnDashboard,
  canEditOnDashboard,
  canPublishOnDashboard,
  canShareOnDashboard,
  isDashboardOwner,
} from "@/lib/workspace/dashboard-permissions"
import type { SharePermission } from "@/lib/workspace/types"
import { findOrgUserById } from "@/lib/workspace/identity"
import { useWorkspaceCurrentUserId } from "@/lib/workspace/use-workspace-user-id"
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
    for (const p of s.units)
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
  const me = useWorkspaceCurrentUserId()

  const dashboard = useWorkspaceStore((s) =>
    dashboardId ? s.dashboards.find((d) => d.id === dashboardId) ?? null : null
  )
  const myPermission = useWorkspaceStore((s) =>
    dashboardId ? selectMyPermissionOn(s, dashboardId) : null
  )
  const recordOpened = useWorkspaceStore((s) => s.recordDashboardOpened)
  const markFirstViewed = useWorkspaceStore((s) => s.markShareFirstViewed)
  const publishDashboard = useWorkspaceStore((s) => s.publishDashboard)
  const unpublishDashboard = useWorkspaceStore((s) => s.unpublishDashboard)
  const incomingShare = useWorkspaceStore((s) => {
    void s.workspaceIdentityRevision
    if (!dashboardId) return null
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
  const [accessDialogOpen, setAccessDialogOpen] = useState(false)
  const [accessRequestPermission, setAccessRequestPermission] = useState<
    Exclude<SharePermission, "view">
  >("edit")
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (!open) return
    if (!dashboardId) return
    recordOpened(dashboardId)
    if (incomingShare && !incomingShare.firstViewedAt) {
      void markFirstViewed(incomingShare.id).catch(() => {})
    }
  }, [open, dashboardId, incomingShare, markFirstViewed, recordOpened])

  useEffect(() => {
    if (open) setMode(initialMode)
  }, [open, initialMode])

  if (!open || !dashboard) return null

  const owner = findOrgUserById(dashboard.ownerUserId)
  const ownerName = owner?.name ?? "owner"
  const isOwner = isDashboardOwner(dashboard, me)
  const canComment = canCommentOnDashboard(myPermission, isOwner)
  const canEdit = canEditOnDashboard(myPermission, isOwner)
  const canPublish = canPublishOnDashboard(dashboard, me)
  const canShare = canShareOnDashboard(myPermission, isOwner)

  const openAccessRequest = (permission: Exclude<SharePermission, "view">) => {
    setAccessRequestPermission(permission)
    setAccessDialogOpen(true)
  }

  const handleCommentsClick = () => {
    if (canComment) {
      setMode((m) => (m === "comments" ? "view" : "comments"))
      return
    }
    openAccessRequest("comment")
  }

  const handlePublishClick = () => {
    if (!canPublish) {
      openAccessRequest("edit")
      return
    }
    setPublishing(true)
    void (async () => {
      try {
        if (dashboard.lifecycleStatus === "published") {
          await unpublishDashboard(dashboard.id)
          toast.success("Dashboard unpublished")
        } else {
          await publishDashboard(dashboard.id)
          toast.success("Dashboard published to Asset Module")
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Publish failed")
      } finally {
        setPublishing(false)
      }
    })()
  }

  const handleEditClick = () => {
    if (!canEdit) {
      openAccessRequest("edit")
      return
    }
    onClose()
    router.push(`/dashboard/dashboard/${dashboard.id}/edit`)
  }

  const handleShareClick = () => {
    if (!canShare) {
      openAccessRequest("edit")
      return
    }
    setShareDialogOpen(true)
  }

  const handleOpenInNewTab = () => {
    if (typeof window === "undefined") return
    window.open(`/dashboards/${dashboard.id}/full`, "_blank", "noopener")
  }

  const isPublished = dashboard.lifecycleStatus === "published"

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
                    isPublished
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isPublished ? "Published" : "Draft"}
                </span>{" "}
                · Owner: {ownerName}
              </div>
              <h2 className="text-lg font-bold text-foreground truncate">{dashboard.name}</h2>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                variant={mode === "comments" ? "default" : "outline"}
                onClick={handleCommentsClick}
                className="gap-1"
                aria-pressed={mode === "comments"}
              >
                <MessageSquare className="w-4 h-4" />
                Comments
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePublishClick}
                disabled={publishing}
                className="gap-1"
              >
                <Globe2 className="w-4 h-4" />
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditClick}
                className="gap-1"
              >
                <Pencil className="w-4 h-4" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleShareClick}
                className="gap-1"
              >
                <Share2 className="w-4 h-4" /> Share
              </Button>
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
                  onRequestCommentAccess={
                    !canComment ? () => openAccessRequest("comment") : undefined
                  }
                />
              </div>
            )}
          </div>

          {!isOwner && (
            <div className="border-t border-border px-4 py-2 flex items-center bg-muted/20">
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                You have <strong>{myPermission ?? "no"}</strong> access.
              </div>
            </div>
          )}
        </div>
      </div>
      <ShareDialog
        dashboard={shareDialogOpen ? dashboard : null}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
      <AccessRequestDialog
        open={accessDialogOpen}
        onOpenChange={setAccessDialogOpen}
        dashboardId={dashboard.id}
        dashboardName={dashboard.name}
        ownerName={ownerName}
        requestedPermission={accessRequestPermission}
      />
    </>
  )
}

export { Maximize2 }
