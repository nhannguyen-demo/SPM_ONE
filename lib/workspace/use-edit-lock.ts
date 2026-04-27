/**
 * Cross-tab dashboard editor lock.
 *
 *   useDashboardEditLock(dashboardId)
 *     — call from the Workspace dashboard editor on mount. Tries to acquire
 *       an exclusive lock for `dashboardId`. If another tab already holds it,
 *       returns `{ status: "denied", holderUserId }` and the caller MUST NOT
 *       enter editor mode (show the "This dashboard is being edited at the
 *       moment" toast and offer to open read-only).
 *
 * Protocol:
 *   - On mount: post `probe` then wait ~250 ms for `held` responses.
 *   - If no `held`: post `claim`, set status = "acquired".
 *   - While acquired: respond to incoming `claim` and `probe` with `held`.
 *   - On unmount / pagehide: post `release`.
 *   - localStorage sentinel `spm-one:edit-lock:<dashboardId>` records the
 *     current holder for tabs opened later.
 */

"use client"

import { useEffect, useState } from "react"
import { getTabId, openEditLockChannel, type EditLockMessage } from "./cross-tab"
import { getCurrentUserId } from "./identity"

const LOCK_SENTINEL_PREFIX = "spm-one:edit-lock:"
const PROBE_WAIT_MS = 250
const HEARTBEAT_MS = 4_000
const STALE_MS = 12_000

export interface EditLockState {
  status: "probing" | "acquired" | "denied"
  holderUserId: string | null
  holderTabId: string | null
}

interface SentinelRecord {
  tabId: string
  userId: string | null
  claimAt: number
  ts: number
}

function readSentinel(dashboardId: string): SentinelRecord | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(LOCK_SENTINEL_PREFIX + dashboardId)
    if (!raw) return null
    const rec = JSON.parse(raw) as SentinelRecord
    if (Date.now() - rec.ts > STALE_MS) return null
    return rec
  } catch {
    return null
  }
}

function writeSentinel(dashboardId: string, rec: SentinelRecord | null): void {
  if (typeof window === "undefined") return
  try {
    if (rec === null) {
      window.localStorage.removeItem(LOCK_SENTINEL_PREFIX + dashboardId)
    } else {
      window.localStorage.setItem(LOCK_SENTINEL_PREFIX + dashboardId, JSON.stringify(rec))
    }
  } catch {
    /* ignore */
  }
}

/**
 * Acquire (or fail to acquire) the editor lock for `dashboardId`. Cleans up
 * automatically on unmount.
 */
export function useDashboardEditLock(dashboardId: string | null): EditLockState {
  const [state, setState] = useState<EditLockState>({
    status: "probing",
    holderUserId: null,
    holderTabId: null,
  })

  useEffect(() => {
    if (!dashboardId || typeof window === "undefined") return

    const tabId = getTabId()
    const userId = getCurrentUserId()
    const ch = openEditLockChannel()
    const claimAt = Date.now()
    let acquired = false
    let denied = false
    let heartbeatTimer: number | null = null
    let mounted = true

    const post = (msg: EditLockMessage) => {
      ch.post(msg as unknown as Parameters<typeof ch.post>[0])
    }

    const announceHeld = () => {
      post({
        kind: "held",
        dashboardId,
        holderTabId: tabId,
        holderUserId: userId,
        claimAt,
      })
      writeSentinel(dashboardId, { tabId, userId, claimAt, ts: Date.now() })
    }

    const release = () => {
      if (acquired) {
        post({ kind: "release", dashboardId, tabId })
        const cur = readSentinel(dashboardId)
        if (cur && cur.tabId === tabId) writeSentinel(dashboardId, null)
        acquired = false
      }
    }

    const unsubscribe = ch.subscribe((payload) => {
      const msg = payload as unknown as EditLockMessage
      if (!msg || msg.kind === undefined) return
      if (msg.kind === "release") {
        if (msg.dashboardId !== dashboardId) return
        if (denied && mounted) {
          // The previous holder went away — but this hook does not auto-
          // upgrade a denied tab; the user must reopen the editor.
        }
        return
      }
      if (msg.dashboardId !== dashboardId) return

      if (msg.kind === "probe") {
        if (acquired && msg.tabId !== tabId) announceHeld()
        return
      }
      if (msg.kind === "claim") {
        if (msg.tabId === tabId) return
        if (acquired) {
          // We win — older claimAt holds the lock.
          announceHeld()
          return
        }
        // We're still probing; if the other claim is older, defer.
        if (msg.claimAt < claimAt && mounted) {
          denied = true
          setState({
            status: "denied",
            holderUserId: msg.userId,
            holderTabId: msg.tabId,
          })
        }
        return
      }
      if (msg.kind === "held") {
        if (msg.holderTabId === tabId) return
        if (!acquired && mounted) {
          denied = true
          setState({
            status: "denied",
            holderUserId: msg.holderUserId,
            holderTabId: msg.holderTabId,
          })
        }
        return
      }
    })

    /* ── Acquisition flow ──────────────────────────────────────────────── */
    // 1. Check the localStorage sentinel for an existing holder.
    const sentinel = readSentinel(dashboardId)
    if (sentinel && sentinel.tabId !== tabId) {
      denied = true
      setState({
        status: "denied",
        holderUserId: sentinel.userId,
        holderTabId: sentinel.tabId,
      })
    }

    // 2. Probe the channel. Existing holders will respond with "held".
    post({ kind: "probe", dashboardId, tabId })

    // 3. After PROBE_WAIT_MS, if no "held" arrived, claim the lock.
    const probeTimer = window.setTimeout(() => {
      if (!mounted || denied) return
      post({
        kind: "claim",
        dashboardId,
        tabId,
        userId,
        claimAt,
      })
      acquired = true
      writeSentinel(dashboardId, { tabId, userId, claimAt, ts: Date.now() })
      setState({ status: "acquired", holderUserId: userId, holderTabId: tabId })

      // Refresh the sentinel periodically so a crashed holder times out.
      heartbeatTimer = window.setInterval(() => {
        if (!acquired) return
        writeSentinel(dashboardId, { tabId, userId, claimAt, ts: Date.now() })
      }, HEARTBEAT_MS)
    }, PROBE_WAIT_MS)

    const onPageHide = () => release()
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("beforeunload", onPageHide)

    return () => {
      mounted = false
      window.clearTimeout(probeTimer)
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("beforeunload", onPageHide)
      release()
      unsubscribe()
      ch.close()
    }
  }, [dashboardId])

  return state
}
