"use client"

import { useMemo, useState } from "react"
import {
  Link as LinkIcon,
  Users,
  Copy,
  Check,
  X,
  Eye,
  MessageSquare,
  Pencil,
  RotateCcw,
  Globe2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { UserAvatar } from "./avatar"
import {
  ORG_USERS,
  findOrgUserById,
  searchOrgUsers,
  getCurrentUserId,
} from "@/lib/workspace/identity"
import { useWorkspaceStore } from "@/lib/workspace/store"
import type {
  SharePermission,
  WorkspaceDashboard,
} from "@/lib/workspace/types"

const PERMISSIONS: Array<{ value: SharePermission; label: string; icon: React.ReactNode; desc: string }> = [
  { value: "view", label: "View", icon: <Eye className="w-3.5 h-3.5" />, desc: "Can open and read" },
  { value: "comment", label: "Comment", icon: <MessageSquare className="w-3.5 h-3.5" />, desc: "Can leave comments" },
  { value: "edit", label: "Edit", icon: <Pencil className="w-3.5 h-3.5" />, desc: "Can modify the dashboard" },
]

export interface ShareDialogProps {
  dashboard: WorkspaceDashboard | null
  open: boolean
  onOpenChange: (o: boolean) => void
}

export function ShareDialog({ dashboard, open, onOpenChange }: ShareDialogProps) {
  if (!dashboard) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Share &ldquo;{dashboard.name}&rdquo;</DialogTitle>
          <DialogDescription>
            Share with named users or generate a link. Links are restricted to your organization.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" /> People
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-1.5">
              <LinkIcon className="w-4 h-4" /> Link
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <PeopleTab dashboard={dashboard} />
          </TabsContent>
          <TabsContent value="link" className="mt-4">
            <LinkTab dashboard={dashboard} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

/* ─── People (named users) tab ─────────────────────────────────────────────── */

function PeopleTab({ dashboard }: { dashboard: WorkspaceDashboard }) {
  const me = getCurrentUserId()
  const [query, setQuery] = useState("")
  const [stagedUserId, setStagedUserId] = useState<string | null>(null)
  const [permission, setPermission] = useState<SharePermission>("view")
  const [message, setMessage] = useState("")
  const [notify, setNotify] = useState(false)

  const shares = useWorkspaceStore((s) =>
    s.shares.filter((sh) => sh.dashboardId === dashboard.id && !sh.revokedAt)
  )
  const shareWithUser = useWorkspaceStore((s) => s.shareWithUser)
  const updateShare = useWorkspaceStore((s) => s.updateShare)

  const excludedIds = useMemo(
    () => [me, dashboard.ownerUserId, ...shares.map((s) => s.sharedWithUserId)],
    [me, dashboard.ownerUserId, shares]
  )

  const candidates = useMemo(
    () => searchOrgUsers(query, excludedIds).slice(0, 8),
    [query, excludedIds]
  )

  const stagedUser = stagedUserId ? findOrgUserById(stagedUserId) : null

  const handleSend = () => {
    if (!stagedUserId) {
      toast.error("Pick a person to share with.")
      return
    }
    shareWithUser({
      dashboardId: dashboard.id,
      sharedWithUserId: stagedUserId,
      permission,
      message: message.trim() || undefined,
      notifyOnFirstView: notify,
    })
    toast.success(`Shared with ${stagedUser?.name ?? "user"}`)
    setStagedUserId(null)
    setQuery("")
    setMessage("")
    setNotify(false)
    setPermission("view")
  }

  return (
    <div className="space-y-4">
      {/* Add-person row */}
      <div className="space-y-2">
        <Label className="text-xs">Add a person</Label>
        {!stagedUser ? (
          <div className="relative">
            <Input
              placeholder="Type a name or email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && candidates.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                {candidates.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStagedUserId(u.id)
                        setQuery("")
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-left"
                    >
                      <UserAvatar user={u} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground truncate">{u.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {query.trim() && candidates.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                No matching organization members.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30">
            <UserAvatar user={stagedUser} size="md" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{stagedUser.name}</div>
              <div className="text-xs text-muted-foreground truncate">{stagedUser.email}</div>
            </div>
            <button
              type="button"
              onClick={() => setStagedUserId(null)}
              className="p-1 rounded hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {stagedUser && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Permission</Label>
            <PermissionSelector value={permission} onChange={setPermission} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short note for the recipient…"
              maxLength={500}
              rows={3}
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={notify} onCheckedChange={setNotify} id="notify-first-view" />
            <Label htmlFor="notify-first-view" className="text-sm cursor-pointer">
              Notify me when {stagedUser.name.split(" ")[0]} first views this dashboard
            </Label>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend}>Send</Button>
          </div>
        </>
      )}

      {/* Existing shares */}
      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-xs">People with access</Label>
        <ul className="space-y-1.5">
          <li className="flex items-center gap-2">
            <UserAvatar user={findOrgUserById(dashboard.ownerUserId)} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {findOrgUserById(dashboard.ownerUserId)?.name ?? "Owner"}
                {dashboard.ownerUserId === me && (
                  <span className="text-xs text-muted-foreground"> (you)</span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">Owner</div>
            </div>
          </li>
          {shares.map((sh) => {
            const u = findOrgUserById(sh.sharedWithUserId)
            return (
              <li key={sh.id} className="flex items-center gap-2">
                <UserAvatar user={u} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u?.name ?? "Unknown"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{u?.email}</div>
                </div>
                <select
                  value={sh.permission}
                  onChange={(e) =>
                    updateShare(sh.id, { permission: e.target.value as SharePermission })
                  }
                  className="rounded border border-input bg-background text-xs px-1.5 py-1"
                >
                  <option value="view">View</option>
                  <option value="comment">Comment</option>
                  <option value="edit">Edit</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    updateShare(sh.id, { revokedAt: new Date().toISOString() })
                    toast.success("Access revoked")
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                  aria-label="Revoke"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            )
          })}
          {shares.length === 0 && (
            <li className="text-xs text-muted-foreground px-1 py-1">Only the owner has access.</li>
          )}
        </ul>
      </div>
    </div>
  )
}

/* ─── Permission selector pill ─────────────────────────────────────────────── */
function PermissionSelector({
  value,
  onChange,
}: {
  value: SharePermission
  onChange: (v: SharePermission) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {PERMISSIONS.map((p) => {
        const active = p.value === value
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              "rounded-lg border px-2 py-2 text-left transition-colors",
              active
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border hover:bg-muted/50 text-foreground/80"
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {p.icon} {p.label}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {p.desc}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Link tab ─────────────────────────────────────────────────────────────── */
function LinkTab({ dashboard }: { dashboard: WorkspaceDashboard }) {
  const links = useWorkspaceStore((s) =>
    s.shareLinks.filter((l) => l.dashboardId === dashboard.id && !l.revokedAt)
  )
  const generateShareLink = useWorkspaceStore((s) => s.generateShareLink)
  const revokeShareLink = useWorkspaceStore((s) => s.revokeShareLink)
  const regenerateShareLink = useWorkspaceStore((s) => s.regenerateShareLink)

  const [linkPermission, setLinkPermission] = useState<SharePermission>("view")

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "https://app.spm-one.com"

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 flex items-start gap-2 text-xs text-muted-foreground">
        <Globe2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <span>
          Anyone in your organization with this link can open the dashboard. Non-organization
          users will be denied access.
        </span>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Permission for new link</Label>
        <PermissionSelector value={linkPermission} onChange={setLinkPermission} />
        <Button
          onClick={() => {
            generateShareLink({ dashboardId: dashboard.id, permission: linkPermission })
            toast.success("New share link generated")
          }}
          variant="default"
          size="sm"
          className="gap-1.5"
        >
          <LinkIcon className="w-4 h-4" /> Create link
        </Button>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <Label className="text-xs">Active links</Label>
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active links.</p>
        ) : (
          <ul className="space-y-2">
            {links.map((l) => {
              const url = `${baseUrl}/share/${l.token}`
              return (
                <li
                  key={l.id}
                  className="rounded-lg border border-border p-2 space-y-1.5 bg-card"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded",
                        l.permission === "edit"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          : l.permission === "comment"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                      )}
                    >
                      {PERMISSIONS.find((p) => p.value === l.permission)?.icon} {l.permission}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Created {new Date(l.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={url}
                      onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                      className="text-xs h-8"
                    />
                    <CopyButton text={url} />
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        regenerateShareLink(l.id)
                        toast.success("Link regenerated")
                      }}
                      className="h-7 text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        revokeShareLink(l.id)
                        toast.success("Link revoked")
                      }}
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy")
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handle} className="h-8 px-2 gap-1">
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

void ORG_USERS
