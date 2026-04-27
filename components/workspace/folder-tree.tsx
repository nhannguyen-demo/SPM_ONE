"use client"

import { useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder as FolderIcon,
  FolderPlus,
  Home as HomeIcon,
  Inbox,
  Clock,
  Trash2,
  MoreVertical,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspaceStore } from "@/lib/workspace/store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { WorkspaceVirtualLocation } from "@/lib/workspace/types"

export const FOLDER_DRAG_TYPE = "application/x-spm-folder"
export const DASHBOARD_DRAG_TYPE = "application/x-spm-dashboard"

interface FolderTreeProps {
  selected: { kind: "virtual"; location: WorkspaceVirtualLocation } | { kind: "folder"; folderId: string }
  onSelect: (
    sel:
      | { kind: "virtual"; location: WorkspaceVirtualLocation }
      | { kind: "folder"; folderId: string }
  ) => void
}

interface FolderNode {
  id: string
  name: string
  parentFolderId: string | null
  children: FolderNode[]
}

function buildTree(
  folders: { id: string; name: string; parentFolderId: string | null }[]
): FolderNode[] {
  const byId = new Map<string, FolderNode>()
  for (const f of folders) {
    byId.set(f.id, { id: f.id, name: f.name, parentFolderId: f.parentFolderId, children: [] })
  }
  const roots: FolderNode[] = []
  for (const node of byId.values()) {
    if (node.parentFolderId && byId.has(node.parentFolderId)) {
      byId.get(node.parentFolderId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  for (const node of byId.values()) {
    node.children.sort((a, b) => a.name.localeCompare(b.name))
  }
  roots.sort((a, b) => a.name.localeCompare(b.name))
  return roots
}

/* ─── Inline rename input ──────────────────────────────────────────────────── */
function InlineRename({
  initialValue,
  onCommit,
  onCancel,
}: {
  initialValue: string
  onCommit: (v: string) => void
  onCancel: () => void
}) {
  const [v, setV] = useState(initialValue)
  return (
    <input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => (v.trim() ? onCommit(v.trim()) : onCancel())}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (v.trim()) onCommit(v.trim())
          else onCancel()
        } else if (e.key === "Escape") onCancel()
      }}
      className="flex-1 bg-background border border-primary rounded px-1.5 py-0.5 text-sm text-foreground outline-none"
    />
  )
}

/* ─── Folder row ───────────────────────────────────────────────────────────── */
function FolderRow({
  node,
  depth,
  selected,
  onSelect,
  expanded,
  toggleExpanded,
  renameId,
  setRenameId,
}: {
  node: FolderNode
  depth: number
  selected: FolderTreeProps["selected"]
  onSelect: FolderTreeProps["onSelect"]
  expanded: Set<string>
  toggleExpanded: (id: string) => void
  renameId: string | null
  setRenameId: (id: string | null) => void
}) {
  const isOpen = expanded.has(node.id)
  const isSelected = selected.kind === "folder" && selected.folderId === node.id
  const renameFolder = useWorkspaceStore((s) => s.renameFolder)
  const moveFolder = useWorkspaceStore((s) => s.moveFolder)
  const moveDashboard = useWorkspaceStore((s) => s.moveDashboard)
  const deleteFolder = useWorkspaceStore((s) => s.deleteFolder)
  const createFolder = useWorkspaceStore((s) => s.createFolder)
  const [dropOver, setDropOver] = useState(false)

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(FOLDER_DRAG_TYPE, node.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const onDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes(FOLDER_DRAG_TYPE) ||
      e.dataTransfer.types.includes(DASHBOARD_DRAG_TYPE)
    ) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setDropOver(true)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    setDropOver(false)
    const folderId = e.dataTransfer.getData(FOLDER_DRAG_TYPE)
    if (folderId && folderId !== node.id) {
      // Prevent dropping a parent into its own descendant.
      const isDescendant = (childId: string, ancestorId: string): boolean => {
        const stack = [childId]
        while (stack.length) {
          const cur = stack.pop()!
          if (cur === ancestorId) return true
          for (const ch of node.children) stack.push(ch.id)
        }
        return false
      }
      if (!isDescendant(node.id, folderId)) {
        moveFolder(folderId, node.id)
        e.preventDefault()
        return
      }
    }
    const dashId = e.dataTransfer.getData(DASHBOARD_DRAG_TYPE)
    if (dashId) {
      moveDashboard(dashId, node.id)
      e.preventDefault()
    }
  }

  return (
    <>
      <div
        draggable={renameId !== node.id}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={() => setDropOver(false)}
        onDrop={onDrop}
        onClick={() => onSelect({ kind: "folder", folderId: node.id })}
        className={cn(
          "group/row flex items-center gap-1 pr-1 rounded-md text-sm cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 text-foreground" : "hover:bg-muted/50 text-foreground/90",
          dropOver && "ring-2 ring-primary/60 bg-primary/10"
        )}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            toggleExpanded(node.id)
          }}
          className="p-0.5 text-muted-foreground hover:text-foreground"
          aria-label={isOpen ? "Collapse folder" : "Expand folder"}
        >
          {node.children.length > 0 ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="inline-block w-3.5" />
          )}
        </button>
        {isOpen ? (
          <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
        ) : (
          <FolderIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
        )}
        {renameId === node.id ? (
          <InlineRename
            initialValue={node.name}
            onCommit={(v) => {
              renameFolder(node.id, v)
              setRenameId(null)
            }}
            onCancel={() => setRenameId(null)}
          />
        ) : (
          <span className="flex-1 truncate py-1.5">{node.name}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground"
              aria-label="Folder actions"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => setRenameId(node.id)}>
              <Pencil className="w-4 h-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                const folder = createFolder({ name: "New folder", parentFolderId: node.id })
                if (!isOpen) toggleExpanded(node.id)
                setRenameId(folder.id)
              }}
            >
              <FolderPlus className="w-4 h-4 mr-2" /> New subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this folder? Subfolders will also be removed; dashboards inside will move to your Workspace root."
                  )
                ) {
                  deleteFolder(node.id, "move-to-root")
                }
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isOpen &&
        node.children.map((c) => (
          <FolderRow
            key={c.id}
            node={c}
            depth={depth + 1}
            selected={selected}
            onSelect={onSelect}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            renameId={renameId}
            setRenameId={setRenameId}
          />
        ))}
    </>
  )
}

/* ─── Virtual location row ─────────────────────────────────────────────────── */
function VirtualRow({
  label,
  icon,
  active,
  onClick,
  badge,
  acceptsDashboard,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
  badge?: number
  acceptsDashboard?: boolean
}) {
  const moveDashboard = useWorkspaceStore((s) => s.moveDashboard)
  const [dropOver, setDropOver] = useState(false)
  return (
    <div
      onClick={onClick}
      onDragOver={(e) => {
        if (acceptsDashboard && e.dataTransfer.types.includes(DASHBOARD_DRAG_TYPE)) {
          e.preventDefault()
          setDropOver(true)
        }
      }}
      onDragLeave={() => setDropOver(false)}
      onDrop={(e) => {
        setDropOver(false)
        if (!acceptsDashboard) return
        const dashId = e.dataTransfer.getData(DASHBOARD_DRAG_TYPE)
        if (dashId) moveDashboard(dashId, null)
      }}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
        active ? "bg-primary/10 text-foreground" : "hover:bg-muted/50 text-foreground/90",
        dropOver && "ring-2 ring-primary/60 bg-primary/10"
      )}
    >
      {icon}
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          {badge}
        </span>
      )}
    </div>
  )
}

/* ─── Folder tree (top-level export) ───────────────────────────────────────── */
export function FolderTree({ selected, onSelect }: FolderTreeProps) {
  // useShallow prevents new-array-on-every-call from triggering infinite renders.
  const { rawFolders, shares, dashboards } = useWorkspaceStore(
    useShallow((s) => ({
      rawFolders: s.folders,
      shares: s.shares,
      dashboards: s.dashboards,
    }))
  )

  const meId = useMemo(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("spm-one:current-user-id") ?? "user-nhan"
    }
    return "user-nhan"
  }, [])

  const folders = useMemo(
    () => rawFolders.filter((f) => f.ownerUserId === meId),
    [rawFolders, meId]
  )
  const sharedCount = useMemo(
    () => shares.filter((sh) => sh.sharedWithUserId === meId && !sh.revokedAt).length,
    [shares, meId]
  )
  const trashCount = useMemo(
    () => dashboards.filter((d) => d.deletedAt !== null).length,
    [dashboards]
  )

  const tree = useMemo(() => buildTree(folders), [folders])

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(folders.map((f) => f.id)))
  const [renameId, setRenameId] = useState<string | null>(null)
  const createFolder = useWorkspaceStore((s) => s.createFolder)
  const moveDashboard = useWorkspaceStore((s) => s.moveDashboard)
  const [allRootDropOver, setAllRootDropOver] = useState(false)

  const toggleExpanded = (id: string) =>
    setExpanded((s) => {
      const ns = new Set(s)
      if (ns.has(id)) ns.delete(id)
      else ns.add(id)
      return ns
    })

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card/30 flex flex-col">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Workspace
        </span>
        <button
          type="button"
          aria-label="New folder"
          onClick={() => {
            const folder = createFolder({ name: "New folder", parentFolderId: null })
            setRenameId(folder.id)
          }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        <div className="space-y-0.5">
          <div
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes(DASHBOARD_DRAG_TYPE)) {
                e.preventDefault()
                setAllRootDropOver(true)
              }
            }}
            onDragLeave={() => setAllRootDropOver(false)}
            onDrop={(e) => {
              setAllRootDropOver(false)
              const dashId = e.dataTransfer.getData(DASHBOARD_DRAG_TYPE)
              if (dashId) moveDashboard(dashId, null)
            }}
            className={cn(
              "rounded-md",
              allRootDropOver && "ring-2 ring-primary/60 bg-primary/10"
            )}
          >
            <VirtualRow
              label="All dashboards"
              icon={<HomeIcon className="w-4 h-4 text-foreground/70" />}
              active={selected.kind === "virtual" && selected.location === "all"}
              onClick={() => onSelect({ kind: "virtual", location: "all" })}
              acceptsDashboard
            />
          </div>
          <VirtualRow
            label="Shared with me"
            icon={<Inbox className="w-4 h-4 text-foreground/70" />}
            active={selected.kind === "virtual" && selected.location === "shared"}
            onClick={() => onSelect({ kind: "virtual", location: "shared" })}
            badge={sharedCount}
          />
          <VirtualRow
            label="Recent"
            icon={<Clock className="w-4 h-4 text-foreground/70" />}
            active={selected.kind === "virtual" && selected.location === "recent"}
            onClick={() => onSelect({ kind: "virtual", location: "recent" })}
          />
          <VirtualRow
            label="Trash"
            icon={<Trash2 className="w-4 h-4 text-foreground/70" />}
            active={selected.kind === "virtual" && selected.location === "trash"}
            onClick={() => onSelect({ kind: "virtual", location: "trash" })}
            badge={trashCount}
          />
        </div>
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Folders
          </div>
          {tree.length === 0 ? (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              No folders yet — drag dashboards onto a folder to organize.
            </p>
          ) : (
            tree.map((node) => (
              <FolderRow
                key={node.id}
                node={node}
                depth={0}
                selected={selected}
                onSelect={onSelect}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                renameId={renameId}
                setRenameId={setRenameId}
              />
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
