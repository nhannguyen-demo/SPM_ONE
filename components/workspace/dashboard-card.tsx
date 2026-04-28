"use client"

import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  MoreVertical,
  Eye,
  Pencil,
  Copy,
  FolderInput,
  Share2,
  Trash2,
  Globe2,
  FileText,
  RotateCcw,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { UserAvatar, UserAvatarStack } from "./avatar"
import { findOrgUserById, getCurrentUserId } from "@/lib/workspace/identity"
import {
  useWorkspaceStore,
  selectMyPermissionOn,
} from "@/lib/workspace/store"
import { permissionAtLeast, type WorkspaceDashboard } from "@/lib/workspace/types"
import { sites } from "@/lib/data"
import { DASHBOARD_DRAG_TYPE } from "./folder-tree"

function equipmentName(equipmentId: string): string {
  for (const s of sites)
    for (const p of s.units)
      for (const e of p.equipment) if (e.id === equipmentId) return e.name
  return "Unknown equipment"
}

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime()
  const diffMs = Date.now() - d
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export interface DashboardCardProps {
  dashboard: WorkspaceDashboard
  onOpen: () => void
  onEdit: () => void
  onShare?: () => void
  onMoveTo?: (folderId: string | null) => void
  /** When true, renders a "trash" variant with restore / delete-permanently actions. */
  variant?: "default" | "trash"
  /** Optional: show this label as a small chip (e.g. permission you have). */
  badgeOverride?: string
}

export function DashboardCard({
  dashboard,
  onOpen,
  onEdit,
  onShare,
  onMoveTo,
  variant = "default",
  badgeOverride,
}: DashboardCardProps) {
  const owner = findOrgUserById(dashboard.ownerUserId)
  const contributors = dashboard.contributorUserIds
    .map((id) => findOrgUserById(id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u))
  const eqName = equipmentName(dashboard.equipmentId)

  const myPermission = useWorkspaceStore((s) => selectMyPermissionOn(s, dashboard.id))
  // useShallow keeps action references stable and prevents the array
  // selector for folders from triggering an infinite render loop.
  const {
    rawFolders,
    duplicate,
    renameDashboard,
    softDelete,
    restore,
    permanentlyDelete,
    publish,
    unpublish,
  } = useWorkspaceStore(
    useShallow((s) => ({
      rawFolders: s.folders,
      duplicate: s.duplicateDashboard,
      renameDashboard: s.renameDashboard,
      softDelete: s.softDeleteDashboard,
      restore: s.restoreDashboard,
      permanentlyDelete: s.permanentlyDeleteDashboard,
      publish: s.publishDashboard,
      unpublish: s.unpublishDashboard,
    }))
  )
  const meId = getCurrentUserId()
  const folders = useMemo(
    () => rawFolders.filter((f) => f.ownerUserId === meId),
    [rawFolders, meId]
  )

  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(dashboard.name)
  const [showMenu, setShowMenu] = useState(false)

  const canEdit = permissionAtLeast(myPermission, "edit")
  const isOwner = dashboard.ownerUserId === getCurrentUserId()

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DASHBOARD_DRAG_TYPE, dashboard.id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      draggable={variant !== "trash"}
      onDragStart={onDragStart}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden",
        variant === "trash" && "opacity-80"
      )}
    >
      {/* Thumbnail / hero */}
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-[16/9] bg-muted overflow-hidden border-b border-border"
      >
        {dashboard.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dashboard.thumbnailUrl}
            alt={dashboard.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {dashboard.lifecycleStatus === "published" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <Globe2 className="w-3 h-3" /> Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              <FileText className="w-3 h-3" /> Draft
            </span>
          )}
          {badgeOverride && (
            <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
              {badgeOverride}
            </span>
          )}
        </div>
      </button>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {renaming ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim() && name.trim() !== dashboard.name) {
                  renameDashboard(dashboard.id, name.trim())
                }
                setRenaming(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur()
                if (e.key === "Escape") {
                  setName(dashboard.name)
                  setRenaming(false)
                }
              }}
              className="flex-1 text-sm font-semibold bg-background border border-primary rounded px-1.5 py-0.5 outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="flex-1 text-left text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors"
            >
              {dashboard.name}
            </button>
          )}
          {variant !== "trash" && (
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Dashboard actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpen}>
                  <Eye className="w-4 h-4 mr-2" /> Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit} disabled={!canEdit}>
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => duplicate(dashboard.id)}
                >
                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setRenaming(true)}>
                    <Pencil className="w-4 h-4 mr-2" /> Rename
                  </DropdownMenuItem>
                )}
                {onMoveTo && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FolderInput className="w-4 h-4 mr-2" /> Move to
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => onMoveTo(null)}>
                          (Root)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {folders.length === 0 ? (
                          <DropdownMenuItem disabled>No folders</DropdownMenuItem>
                        ) : (
                          folders
                            .slice()
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((f) => (
                              <DropdownMenuItem key={f.id} onClick={() => onMoveTo(f.id)}>
                                {f.name}
                              </DropdownMenuItem>
                            ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                )}
                {onShare && (
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="w-4 h-4 mr-2" /> Share
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {dashboard.lifecycleStatus === "created" ? (
                  <DropdownMenuItem
                    onClick={() => publish(dashboard.id)}
                    disabled={!isOwner}
                  >
                    <Globe2 className="w-4 h-4 mr-2" /> Publish to Asset Module
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => unpublish(dashboard.id)}
                    disabled={!isOwner}
                  >
                    <Globe2 className="w-4 h-4 mr-2" /> Unpublish
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => softDelete(dashboard.id)}
                  disabled={!isOwner}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {variant === "trash" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Trash actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>In trash</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => restore(dashboard.id)}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Restore
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${dashboard.name}"? This cannot be undone.`
                      )
                    ) {
                      permanentlyDelete(dashboard.id)
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="px-1.5 py-0.5 rounded bg-muted text-foreground/80 font-medium truncate max-w-[160px]">
            {eqName}
          </span>
          <span>·</span>
          <span title={`Last change: ${new Date(dashboard.lastChangeAt).toLocaleString()}`}>
            {relativeTime(dashboard.lastChangeAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar user={owner} size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {owner?.name ?? "Unknown"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">Owner</div>
            </div>
          </div>
          {contributors.length > 0 && <UserAvatarStack users={contributors} size="xs" max={3} />}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact card variant used inside Equipment Home Page (smaller, no menu).
 * Reused for "Open in new tab" indicator overlay etc.
 */
export function DashboardCardCompact({
  dashboard,
  onOpen,
  rightSlot,
}: {
  dashboard: WorkspaceDashboard
  onOpen: () => void
  rightSlot?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative w-full text-left rounded-lg border border-border bg-card hover:border-primary transition-colors overflow-hidden"
    >
      <div className="aspect-[16/9] bg-muted overflow-hidden">
        {dashboard.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dashboard.thumbnailUrl}
            alt={dashboard.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="px-2 py-1.5 flex items-center gap-1.5">
        <span className="flex-1 text-xs font-medium truncate">{dashboard.name}</span>
        {rightSlot}
      </div>
    </button>
  )
}

export { ExternalLink as ExternalLinkIcon }
