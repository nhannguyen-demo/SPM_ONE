"use client"

import { useEffect, useMemo, useState } from "react"
import { useShallow } from "zustand/react/shallow"
import { useRouter } from "next/navigation"
import {
  Bell,
  Check,
  Eye,
  Inbox,
  MessageSquare,
  ShieldCheck,
  ShieldX,
  Share2,
  CheckCheck,
  Archive,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/workspace/avatar"
import { useAppStore } from "@/lib/store"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { findOrgUserById } from "@/lib/workspace/identity"
import { useWorkspaceCurrentUserId } from "@/lib/workspace/use-workspace-user-id"
import { notificationHref } from "@/lib/workspace/notification-navigation"
import type {
  Notification,
  NotificationCategory,
  PermissionRequest,
} from "@/lib/workspace/types"

const ICON_BY_CATEGORY: Record<NotificationCategory, React.ReactNode> = {
  dashboard_shared_with_you: <Share2 className="w-4 h-4 text-sky-500" />,
  dashboard_first_view: <Eye className="w-4 h-4 text-emerald-500" />,
  permission_request_received: <Inbox className="w-4 h-4 text-amber-500" />,
  permission_request_resolved: <ShieldCheck className="w-4 h-4 text-violet-500" />,
  edit_lock_blocked: <Bell className="w-4 h-4 text-rose-500" />,
  operational_alert: <Bell className="w-4 h-4 text-orange-500" />,
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.round(diffMs / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function CommsAlertsPage() {
  const router = useRouter()
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const me = useWorkspaceCurrentUserId()
  useEffect(() => {
    setActiveModule("comms")
  }, [setActiveModule])

  // useShallow keeps subscriptions stable when the underlying arrays haven't
  // actually changed; otherwise array-returning selectors yield a new reference
  // on every render and trigger an infinite render loop.
  const {
    rawNotifications,
    rawRequests,
    markRead,
    markAllRead,
    resolveRequest,
    archiveNotification,
    restoreNotification,
    deleteNotification,
  } = useWorkspaceStore(
    useShallow((s) => ({
      rawNotifications: s.notifications,
      rawRequests: s.permissionRequests,
      markRead: s.markNotificationRead,
      markAllRead: s.markAllNotificationsRead,
      resolveRequest: s.resolvePermissionRequest,
      archiveNotification: s.archiveNotification,
      restoreNotification: s.restoreNotification,
      deleteNotification: s.deleteNotification,
    }))
  )

  const inboxList = useMemo(
    () =>
      rawNotifications
        .filter((n) => n.userId === me && !n.archivedAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [rawNotifications, me]
  )
  const archivedList = useMemo(
    () =>
      rawNotifications
        .filter((n) => n.userId === me && n.archivedAt)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [rawNotifications, me]
  )
  const unreadCount = useMemo(
    () =>
      rawNotifications.reduce(
        (acc, n) =>
          n.userId === me && !n.readAt && !n.archivedAt ? acc + 1 : acc,
        0
      ),
    [rawNotifications, me]
  )
  const requests = useMemo(
    () =>
      rawRequests.filter(
        (r) => r.requestedToUserId === me && r.status === "pending"
      ),
    [rawRequests, me]
  )

  const [bucket, setBucket] = useState<"inbox" | "archived">("inbox")
  const [readTab, setReadTab] = useState<"all" | "unread">("all")

  const visible = useMemo(() => {
    if (bucket === "archived") return archivedList
    return readTab === "unread" ? inboxList.filter((n) => !n.readAt) : inboxList
  }, [bucket, readTab, inboxList, archivedList])

  const handleClick = (n: Notification) => {
    if (!n.readAt) void markRead(n.id).catch(() => {})
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-foreground" /> Notifications
          </h1>
          <p className="text-xs text-muted-foreground">
            Dashboard sharing, permissions, and equipment alerts. Archive clears your inbox; delete
            removes the item from your list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bucket === "inbox" && unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void markAllRead().catch(() => {})}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="px-6 pt-4 pb-3 border-b border-border space-y-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={bucket === "inbox" ? "default" : "outline"}
              onClick={() => setBucket("inbox")}
              className="gap-1.5"
            >
              <Inbox className="w-4 h-4" />
              Inbox ({inboxList.length})
            </Button>
            <Button
              type="button"
              size="sm"
              variant={bucket === "archived" ? "default" : "outline"}
              onClick={() => {
                setBucket("archived")
                setReadTab("all")
              }}
              className="gap-1.5"
            >
              <Archive className="w-4 h-4" />
              Archived ({archivedList.length})
            </Button>
          </div>
          {bucket === "inbox" && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={readTab === "all" ? "secondary" : "outline"}
                onClick={() => setReadTab("all")}
              >
                All ({inboxList.length})
              </Button>
              <Button
                type="button"
                size="sm"
                variant={readTab === "unread" ? "secondary" : "outline"}
                onClick={() => setReadTab("unread")}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          {visible.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                <CheckCheck className="w-10 h-10 mx-auto" />
                <p className="text-sm">
                  {bucket === "archived"
                    ? "No archived notifications."
                    : readTab === "unread"
                      ? "No unread notifications."
                      : "You're all caught up."}
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2 max-w-3xl">
              {visible.map((n) => {
                const actor = findOrgUserById(n.actorUserId ?? "")
                const req =
                  n.category === "permission_request_received" && n.relatedRequestId
                    ? requests.find((r) => r.id === n.relatedRequestId)
                    : null
                const isOperational = n.category === "operational_alert"
                return (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-colors",
                      isOperational && !n.readAt
                        ? "border-amber-500/80 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-background shadow-md"
                        : isOperational && n.readAt
                          ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10"
                          : n.readAt
                            ? "border-border bg-card hover:bg-muted/40"
                            : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{ICON_BY_CATEGORY[n.category]}</div>
                      <UserAvatar user={actor} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm text-foreground",
                            isOperational ? "font-bold tracking-tight" : "font-semibold"
                          )}
                        >
                          {n.title}
                        </div>
                        {n.body && (
                          <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground/80 mt-1">
                          {relativeTime(n.createdAt)}
                        </div>
                        {req && (
                          <PermissionRequestActions
                            request={req}
                            onResolve={(status) => {
                              void resolveRequest(req.id, status).catch(() => {})
                            }}
                          />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex flex-wrap justify-end gap-1">
                          {notificationHref(n) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (!n.readAt) void markRead(n.id).catch(() => {})
                                const href = notificationHref(n)
                                if (href) router.push(href)
                              }}
                              className="text-xs gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />{" "}
                              {n.category === "operational_alert" ? "Equipment" : "View"}
                            </Button>
                          )}
                          {!n.readAt && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                void markRead(n.id).catch(() => {})
                              }}
                              className="text-xs gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {bucket === "inbox" && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void archiveNotification(n.id).catch(() => {})
                                }}
                                className="text-xs gap-1"
                                title="Archive"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (
                                    typeof window !== "undefined" &&
                                    window.confirm("Delete this notification from your list?")
                                  ) {
                                    void deleteNotification(n.id).catch(() => {})
                                  }
                                }}
                                className="text-xs gap-1 text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          {bucket === "archived" && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void restoreNotification(n.id).catch(() => {})
                                }}
                                className="text-xs gap-1"
                                title="Restore to inbox"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (
                                    typeof window !== "undefined" &&
                                    window.confirm("Permanently delete this archived notification?")
                                  ) {
                                    void deleteNotification(n.id).catch(() => {})
                                  }
                                }}
                                className="text-xs gap-1 text-destructive hover:text-destructive"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

function PermissionRequestActions({
  request,
  onResolve,
}: {
  request: PermissionRequest
  onResolve: (status: "granted" | "denied") => void
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onResolve("granted")
        }}
        className="gap-1.5"
      >
        <ShieldCheck className="w-3.5 h-3.5" /> Grant {request.requestedPermission}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation()
          onResolve("denied")
        }}
        className="gap-1.5"
      >
        <ShieldX className="w-3.5 h-3.5" /> Deny
      </Button>
    </div>
  )
}

void MessageSquare
