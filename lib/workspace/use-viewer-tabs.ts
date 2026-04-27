/**
 * Hooks for the Full-Screen Dashboard Viewer cross-tab presence protocol.
 *
 *   useDashboardOpenElsewhereCount(dashboardId)
 *     — listens for JOIN/HEARTBEAT/LEAVE messages and returns the live count
 *       of OTHER tabs (excluding the current one) that are currently
 *       rendering the Full-Screen Viewer for `dashboardId`.
 *
 *   useRegisterViewerTab(dashboardId)
 *     — call from inside the Full-Screen Viewer page. Broadcasts JOIN on
 *       mount, HEARTBEAT every 5 s, LEAVE on unmount/pagehide.
 */

"use client"

import { useEffect, useRef, useState } from "react"
import {
  HEARTBEAT_INTERVAL_MS,
  STALE_THRESHOLD_MS,
  getTabId,
  openViewerChannel,
  type ViewerMessage,
} from "./cross-tab"

interface SessionRecord {
  tabId: string
  sessionId: string
  dashboardId: string
  lastSeen: number
}

/**
 * Returns the live number of OTHER browser tabs that currently have the
 * Full-Screen Viewer open for `dashboardId`. Returns 0 when there are none.
 */
export function useDashboardOpenElsewhereCount(dashboardId: string): number {
  const [count, setCount] = useState(0)
  const myTabId = getTabId()

  useEffect(() => {
    if (!dashboardId) return
    const sessions = new Map<string, SessionRecord>() // key = sessionId
    let mounted = true

    function recompute() {
      const cutoff = Date.now() - STALE_THRESHOLD_MS
      let n = 0
      for (const [key, rec] of sessions) {
        if (rec.lastSeen < cutoff) {
          sessions.delete(key)
          continue
        }
        if (rec.dashboardId !== dashboardId) continue
        if (rec.tabId === myTabId) continue
        n++
      }
      if (mounted) setCount(n)
    }

    const ch = openViewerChannel()
    const unsubscribe = ch.subscribe((payload) => {
      const msg = payload as unknown as ViewerMessage
      if (!msg || typeof msg !== "object") return
      if (msg.kind === "ping") return
      if (msg.kind === "leave") {
        sessions.delete(msg.sessionId)
        recompute()
        return
      }
      sessions.set(msg.sessionId, {
        tabId: msg.tabId,
        sessionId: msg.sessionId,
        dashboardId: msg.dashboardId,
        lastSeen: msg.ts,
      })
      recompute()
    })

    // Ask existing tabs to re-announce themselves.
    ch.post({ kind: "ping", ts: Date.now() } as unknown as Parameters<typeof ch.post>[0])

    const reconcile = window.setInterval(recompute, HEARTBEAT_INTERVAL_MS)

    return () => {
      mounted = false
      window.clearInterval(reconcile)
      unsubscribe()
      ch.close()
    }
  }, [dashboardId, myTabId])

  return count
}

/**
 * Register the current tab as a Full-Screen Viewer for `dashboardId`. Should
 * be called from the `/dashboards/[id]/full` page on mount.
 */
export function useRegisterViewerTab(dashboardId: string, userId: string | null): void {
  const sessionIdRef = useRef<string>(`vs-${Math.random().toString(36).slice(2, 10)}`)
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  useEffect(() => {
    if (!dashboardId) return
    const sessionId = sessionIdRef.current
    const tabId = getTabId()
    const ch = openViewerChannel()

    function announce(kind: ViewerMessage["kind"]) {
      const msg: ViewerMessage = {
        kind,
        dashboardId,
        sessionId,
        tabId,
        ts: Date.now(),
      } as ViewerMessage
      ch.post(msg as unknown as Parameters<typeof ch.post>[0])
    }

    announce("join")

    // Re-announce when other tabs ping.
    const unsubscribe = ch.subscribe((payload) => {
      const msg = payload as unknown as ViewerMessage
      if (msg.kind === "ping") announce("heartbeat")
    })

    const heartbeat = window.setInterval(() => announce("heartbeat"), HEARTBEAT_INTERVAL_MS)

    const onPageHide = () => announce("leave")
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("beforeunload", onPageHide)

    return () => {
      announce("leave")
      window.clearInterval(heartbeat)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("beforeunload", onPageHide)
      unsubscribe()
      ch.close()
    }
  }, [dashboardId])
}
