"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useWorkspaceStore, selectMyUnreadCount } from "@/lib/workspace/store"
import type { Notification } from "@/lib/workspace/types"
import { useWorkspaceCurrentUserId } from "@/lib/workspace/use-workspace-user-id"
import { notificationHref } from "@/lib/workspace/notification-navigation"

const EPHEMERAL_TTL_MS = 4_000
const MAX_EPHEMERAL = 4

function useMyNotifications(): Notification[] {
  const me = useWorkspaceCurrentUserId()
  const raw = useWorkspaceStore((s) => s.notifications)
  return useMemo(() => {
    return raw
      .filter((n) => n.userId === me)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }, [raw, me])
}

export function Header() {
  const { status } = useSession()
  const router = useRouter()
  const unread = useWorkspaceStore(selectMyUnreadCount)
  const myNotifications = useMyNotifications()
  const markRead = useWorkspaceStore((s) => s.markNotificationRead)
  const prevIdsRef = useRef<string[] | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const [ephemeral, setEphemeral] = useState<Notification[]>([])
  const [notifyMenuOpen, setNotifyMenuOpen] = useState(false)

  const recentForMenu = useMemo(() => myNotifications.slice(0, 8), [myNotifications])

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t)
      timersRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const readIds = new Set(myNotifications.filter((n) => n.readAt).map((n) => n.id))
    for (const id of readIds) {
      const t = timersRef.current.get(id)
      if (t) {
        clearTimeout(t)
        timersRef.current.delete(id)
      }
    }
    setEphemeral((stack) => stack.filter((n) => !readIds.has(n.id)))
  }, [myNotifications])

  useEffect(() => {
    if (status !== "authenticated") return
    const ids = myNotifications.map((n) => n.id)
    if (prevIdsRef.current === null) {
      prevIdsRef.current = ids
      return
    }
    const prev = new Set(prevIdsRef.current)
    for (const n of myNotifications) {
      if (!prev.has(n.id) && !n.readAt) {
        setEphemeral((stack) => {
          const deduped = stack.filter((x) => x.id !== n.id)
          return [n, ...deduped].slice(0, MAX_EPHEMERAL)
        })
        const existing = timersRef.current.get(n.id)
        if (existing) clearTimeout(existing)
        const t = setTimeout(() => {
          setEphemeral((s) => s.filter((x) => x.id !== n.id))
          timersRef.current.delete(n.id)
        }, EPHEMERAL_TTL_MS)
        timersRef.current.set(n.id, t)
      }
    }
    prevIdsRef.current = ids
  }, [myNotifications, status])

  const openFromNotification = (n: Notification) => {
    if (!n.readAt) void markRead(n.id).catch(() => {})
    const href = notificationHref(n)
    if (href) router.push(href)
  }

  const dismissEphemeral = (n: Notification) => {
    const t = timersRef.current.get(n.id)
    if (t) {
      clearTimeout(t)
      timersRef.current.delete(n.id)
    }
    setEphemeral((s) => s.filter((x) => x.id !== n.id))
    if (!n.readAt) void markRead(n.id).catch(() => {})
  }

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-end px-6 shrink-0">
      <div className="flex items-center gap-1">
        <div className="relative flex flex-col items-end">
          <DropdownMenu open={notifyMenuOpen} onOpenChange={setNotifyMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-secondary transition-colors relative outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={
                  unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
                }
                aria-expanded={notifyMenuOpen}
                aria-haspopup="menu"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unread > 0 ? (
                  <span
                    className={cn(
                      "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive",
                      "text-[10px] font-bold text-white flex items-center justify-center leading-none"
                    )}
                  >
                    {unread > 99 ? "99+" : String(unread)}
                  </span>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 max-h-[min(70vh,420px)] overflow-y-auto z-[60]"
            >
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentForMenu.length === 0 ? (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  You&apos;re all caught up.
                </div>
              ) : (
                recentForMenu.map((n) => {
                  const href = notificationHref(n)
                  return (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-0.5 cursor-pointer whitespace-normal"
                      onSelect={(e) => {
                        e.preventDefault()
                        openFromNotification(n)
                      }}
                    >
                      <span className="text-sm font-medium text-foreground">{n.title}</span>
                      {n.body ? (
                        <span className="text-xs text-muted-foreground line-clamp-2">{n.body}</span>
                      ) : null}
                      {href ? (
                        <span className="text-[10px] text-primary">Go to dashboard</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No linked destination</span>
                      )}
                    </DropdownMenuItem>
                  )
                })
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer justify-center font-medium text-primary"
                onSelect={(e) => {
                  e.preventDefault()
                  router.push("/comms/alerts")
                }}
              >
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {ephemeral.length > 0 && !notifyMenuOpen ? (
            <div
              className={cn(
                "absolute top-full right-0 mt-1 z-40 flex flex-col gap-1.5 w-[min(18rem,calc(100vw-3rem))]",
                "pointer-events-auto"
              )}
              role="list"
              aria-live="polite"
              aria-relevant="additions text"
              aria-label="New notifications"
            >
              {ephemeral.map((n) => {
                const href = notificationHref(n)
                return (
                  <div
                    key={n.id}
                    role="listitem"
                    className={cn(
                      "rounded-md border border-border bg-popover text-popover-foreground shadow-md",
                      "p-2.5 text-sm animate-in fade-in zoom-in-95 duration-200"
                    )}
                  >
                    <div className="flex gap-2 items-start">
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => openFromNotification(n)}
                        aria-label={
                          href
                            ? `Open notification: ${n.title}`
                            : `Mark as read: ${n.title}`
                        }
                      >
                        <div className="font-medium text-foreground leading-snug line-clamp-2">
                          {n.title}
                        </div>
                        {n.body ? (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {n.body}
                          </div>
                        ) : null}
                        {href ? (
                          <div className="text-[10px] text-primary mt-1 font-medium">
                            Open linked item
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Mark as read
                          </div>
                        )}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        aria-label={`Dismiss notification: ${n.title}`}
                        onClick={() => dismissEphemeral(n)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
