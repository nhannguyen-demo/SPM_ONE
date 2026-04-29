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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/workspace/avatar"
import { useAppStore } from "@/lib/store"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { findOrgUserById, getCurrentUserId } from "@/lib/workspace/identity"
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
  } = useWorkspaceStore(
    useShallow((s) => ({
      rawNotifications: s.notifications,
      rawRequests: s.permissionRequests,
      markRead: s.markNotificationRead,
      markAllRead: s.markAllNotificationsRead,
      resolveRequest: s.resolvePermissionRequest,
    }))
  )

  const me = getCurrentUserId()
  const notifications = useMemo(
    () =>
      rawNotifications
        .filter((n) => n.userId === me)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [rawNotifications, me]
  )
  const unreadCount = useMemo(
    () =>
      rawNotifications.reduce(
        (acc, n) => (n.userId === me && !n.readAt ? acc + 1 : acc),
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

  const [tab, setTab] = useState<"all" | "unread">("all")

  const visible = useMemo(() => {
    return tab === "unread" ? notifications.filter((n) => !n.readAt) : notifications
  }, [tab, notifications])

  const handleClick = (n: Notification) => {
    if (!n.readAt) markRead(n.id)
    if (n.dashboardId) {
      router.push(`/dashboard?d=${n.dashboardId}`)
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-foreground" /> Alerts
          </h1>
          <p className="text-xs text-muted-foreground">
            Dashboard sharing and permission updates from your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 flex flex-col">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
            <div className="px-6 pt-4 pb-2 border-b border-border">
              <TabsList>
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={tab} className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full px-6 py-4">
                {visible.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-muted-foreground space-y-2">
                      <CheckCheck className="w-10 h-10 mx-auto" />
                      <p className="text-sm">You&apos;re all caught up.</p>
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
                      return (
                        <li
                          key={n.id}
                          onClick={() => handleClick(n)}
                          className={cn(
                            "rounded-lg border p-3 cursor-pointer transition-colors",
                            n.readAt
                              ? "border-border bg-card hover:bg-muted/40"
                              : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className="mt-0.5">
                              {ICON_BY_CATEGORY[n.category]}
                            </div>
                            <UserAvatar user={actor} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-foreground">
                                {n.title}
                              </div>
                              {n.body && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {n.body}
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground/80 mt-1">
                                {relativeTime(n.createdAt)}
                              </div>
                              {req && (
                                <PermissionRequestActions
                                  request={req}
                                  onResolve={(status) => {
                                    resolveRequest(req.id, status)
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex items-start gap-1">
                              {n.dashboardId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!n.readAt) markRead(n.id)
                                    router.push(`/dashboard?d=${n.dashboardId}`)
                                  }}
                                  className="text-xs gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Button>
                              )}
                              {!n.readAt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markRead(n.id)
                                  }}
                                  className="text-xs gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
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
