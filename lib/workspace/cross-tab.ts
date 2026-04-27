/**
 * Cross-tab signalling utility.
 *
 * Two channels:
 *   1. VIEWER  — every Full-Screen Dashboard Viewer tab broadcasts JOIN /
 *      HEARTBEAT / LEAVE messages. The Equipment Home Page subscribes and
 *      derives a per-dashboard "open elsewhere" count.
 *   2. EDIT_LOCK — the Workspace-native dashboard editor uses a leader-
 *      election protocol so only one tab may edit a dashboard at a time;
 *      a second tab attempting to acquire is told "in use".
 *
 * Implementation:
 *   - Primary transport: BroadcastChannel.
 *   - Fallback (Safari old / private modes): localStorage `storage` event.
 *   - Both transports are written; receivers dedupe by message id.
 */

"use client"

const VIEWER_CHANNEL = "spm-one:viewer-tabs"
const EDIT_LOCK_CHANNEL = "spm-one:edit-lock"
const FALLBACK_KEY_PREFIX = "spm-one:bc-fallback:"

/** Heartbeat cadence and stale threshold (ms). */
export const HEARTBEAT_INTERVAL_MS = 5_000
export const STALE_THRESHOLD_MS = 15_000

type Json = string | number | boolean | null | Json[] | { [k: string]: Json }

interface BroadcastEnvelope {
  id: string
  ts: number
  payload: Json
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function hasBC(): boolean {
  return isBrowser() && typeof window.BroadcastChannel !== "undefined"
}

/**
 * Open a cross-tab channel. Returns a small interface with `post(payload)`,
 * `subscribe(handler)`, and `close()`. Falls back to localStorage events if
 * BroadcastChannel is unavailable.
 */
export function openCrossTabChannel(name: string): {
  post: (payload: Json) => void
  subscribe: (handler: (payload: Json) => void) => () => void
  close: () => void
} {
  if (!isBrowser()) {
    return { post: () => {}, subscribe: () => () => {}, close: () => {} }
  }

  const handlers = new Set<(payload: Json) => void>()
  const seen = new Set<string>()
  const fallbackKey = FALLBACK_KEY_PREFIX + name

  const bc = hasBC() ? new BroadcastChannel(name) : null

  const onBcMessage = (event: MessageEvent<BroadcastEnvelope>) => {
    const env = event.data
    if (!env || seen.has(env.id)) return
    seen.add(env.id)
    handlers.forEach((h) => {
      try {
        h(env.payload)
      } catch {
        /* swallow */
      }
    })
  }
  bc?.addEventListener("message", onBcMessage)

  const onStorage = (event: StorageEvent) => {
    if (event.key !== fallbackKey || !event.newValue) return
    try {
      const env: BroadcastEnvelope = JSON.parse(event.newValue)
      if (seen.has(env.id)) return
      seen.add(env.id)
      handlers.forEach((h) => {
        try {
          h(env.payload)
        } catch {
          /* swallow */
        }
      })
    } catch {
      /* malformed */
    }
  }
  window.addEventListener("storage", onStorage)

  return {
    post(payload) {
      const env: BroadcastEnvelope = { id: genId(), ts: Date.now(), payload }
      seen.add(env.id)
      try {
        bc?.postMessage(env)
      } catch {
        /* swallow */
      }
      try {
        window.localStorage.setItem(fallbackKey, JSON.stringify(env))
        // Touch-and-clear to make sure subsequent identical writes still fire.
        // (Some browsers debounce same-value writes.)
        window.localStorage.removeItem(fallbackKey)
      } catch {
        /* swallow */
      }
    },
    subscribe(handler) {
      handlers.add(handler)
      return () => handlers.delete(handler)
    },
    close() {
      bc?.removeEventListener("message", onBcMessage)
      bc?.close()
      window.removeEventListener("storage", onStorage)
      handlers.clear()
    },
  }
}

/* ───────────────────────────────────────────────────────────────────────────
 * VIEWER channel — Full-Screen Dashboard Viewer presence
 * ─────────────────────────────────────────────────────────────────────────── */

export type ViewerMessage =
  | { kind: "join"; dashboardId: string; sessionId: string; tabId: string; ts: number }
  | { kind: "heartbeat"; dashboardId: string; sessionId: string; tabId: string; ts: number }
  | { kind: "leave"; dashboardId: string; sessionId: string; tabId: string; ts: number }
  /** Sent when a new tab joins to ask existing tabs to re-announce. */
  | { kind: "ping"; ts: number }

export function openViewerChannel() {
  return openCrossTabChannel(VIEWER_CHANNEL) as ReturnType<typeof openCrossTabChannel>
}

/* ───────────────────────────────────────────────────────────────────────────
 * EDIT-LOCK channel — exclusive dashboard editor
 * ─────────────────────────────────────────────────────────────────────────── */

export type EditLockMessage =
  | {
      kind: "claim"
      dashboardId: string
      tabId: string
      userId: string | null
      claimAt: number
    }
  | { kind: "release"; dashboardId: string; tabId: string }
  /** Existing holder responds to a claim attempt to deny it. */
  | {
      kind: "held"
      dashboardId: string
      holderTabId: string
      holderUserId: string | null
      claimAt: number
    }
  /** New tab asks the channel "is anyone holding this?". */
  | { kind: "probe"; dashboardId: string; tabId: string }

export function openEditLockChannel() {
  return openCrossTabChannel(EDIT_LOCK_CHANNEL) as ReturnType<typeof openCrossTabChannel>
}

/** Stable per-tab id. Generated on first read and cached on the window. */
export function getTabId(): string {
  if (!isBrowser()) return "ssr"
  type W = Window & { __spmOneTabId?: string }
  const w = window as W
  if (!w.__spmOneTabId) {
    w.__spmOneTabId = `tab-${genId()}`
  }
  return w.__spmOneTabId
}
