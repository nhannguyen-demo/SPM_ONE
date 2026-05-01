/**
 * Mock identity + organization user directory for the Workspace Module.
 *
 * Development: the current user id may persist in `localStorage` for mock flows.
 * Production (`NODE_ENV === "production"`): identity comes only from the Auth.js
 * session (`syncWorkspaceUserFromSession`); manual `setCurrentUserId` is ignored.
 */

import type { OrgUser } from "./types"

const STORAGE_KEY = "spm-one:current-user-id"

function isProductionBuild(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV === "production"
}

/** Fallback when no session / stored selection (SSR + first paint). */
export const WORKSPACE_DEFAULT_USER_ID = "user-nhan"

/** Session mirror set by `syncWorkspaceUserFromSession` (production). */
let sessionMirroredUserId: string | null = null

/**
 * Fixed mock organization directory.
 *
 * Names align with existing avatar initials used elsewhere in the app
 * (Nhan N., Ben T., Alex P., Simon K.) plus a few more engineers so the
 * Share dialog typeahead has reasonable density.
 */
export const ORG_USERS: OrgUser[] = [
  {
    id: "user-nhan",
    name: "Nhan Nguyen",
    email: "nhan.nguyen@spm-one.com",
    initials: "NN",
    role: "integrity_engineer",
    isCurrentUser: true,
  },
  {
    id: "user-ben",
    name: "Ben Tran",
    email: "ben.tran@spm-one.com",
    initials: "BT",
    role: "process_engineer",
  },
  {
    id: "user-alex",
    name: "Alex Park",
    email: "alex.park@spm-one.com",
    initials: "AP",
    role: "process_engineer",
  },
  {
    id: "user-simon",
    name: "Simon Kim",
    email: "simon.kim@spm-one.com",
    initials: "SK",
    role: "integrity_engineer",
  },
  {
    id: "user-priya",
    name: "Priya Shah",
    email: "priya.shah@spm-one.com",
    initials: "PS",
    role: "integrity_engineer",
  },
  {
    id: "user-marcus",
    name: "Marcus Lee",
    email: "marcus.lee@spm-one.com",
    initials: "ML",
    role: "process_engineer",
  },
  {
    id: "user-elena",
    name: "Elena Rossi",
    email: "elena.rossi@spm-one.com",
    initials: "ER",
    role: "admin",
  },
  {
    id: "user-yuki",
    name: "Yuki Tanaka",
    email: "yuki.tanaka@spm-one.com",
    initials: "YT",
    role: "integrity_engineer",
  },
  {
    id: "user-pm",
    name: "Product Team",
    email: "product@spm-one.com",
    initials: "PM",
    role: "product_team",
  },
]

/** Returns true on the client, false during SSR. */
function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/**
 * Align workspace identity with the Auth.js session user id (must match a seeded
 * `ORG_USERS` id). Call from `AuthIdentitySync` on session changes.
 */
export function syncWorkspaceUserFromSession(userId: string | null): void {
  if (userId && ORG_USERS.some((u) => u.id === userId)) {
    sessionMirroredUserId = userId
  } else {
    sessionMirroredUserId = null
  }
  if (!isBrowser() || isProductionBuild()) return
  try {
    if (userId && ORG_USERS.some((u) => u.id === userId)) {
      window.localStorage.setItem(STORAGE_KEY, userId)
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    /* ignore */
  }
}

/** Read the current user id: production uses session mirror only; dev may use localStorage. */
export function getCurrentUserId(): string {
  if (!isBrowser()) return WORKSPACE_DEFAULT_USER_ID
  if (isProductionBuild()) {
    return sessionMirroredUserId ?? WORKSPACE_DEFAULT_USER_ID
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && ORG_USERS.some((u) => u.id === stored)) return stored
  } catch {
    /* ignore localStorage errors (private mode, etc.) */
  }
  return WORKSPACE_DEFAULT_USER_ID
}

/**
 * Persist a mock current-user selection (development only).
 * In production this is a no-op — identity comes from the session.
 */
export function setCurrentUserId(userId: string): void {
  if (!isBrowser() || isProductionBuild()) return
  if (!ORG_USERS.some((u) => u.id === userId)) return
  try {
    window.localStorage.setItem(STORAGE_KEY, userId)
  } catch {
    /* ignore */
  }
}

/** Clear mock storage and session mirror (e.g. sign-out). */
export function clearCurrentUserId(): void {
  sessionMirroredUserId = null
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getCurrentUser(): OrgUser {
  const id = getCurrentUserId()
  const user = ORG_USERS.find((u) => u.id === id)
  return user ?? ORG_USERS[0]
}

/** Lookup helper used by share dialogs, alerts, dashboard cards. */
export function findOrgUserById(userId: string | null | undefined): OrgUser | null {
  if (!userId) return null
  return ORG_USERS.find((u) => u.id === userId) ?? null
}

/** Resolve a user by email, case-insensitive. Used by Share dialog typeahead. */
export function findOrgUserByEmail(email: string): OrgUser | null {
  const needle = email.trim().toLowerCase()
  if (!needle) return null
  return ORG_USERS.find((u) => u.email.toLowerCase() === needle) ?? null
}

/**
 * Substring search over name + email. Used by Share dialog typeahead.
 * Excludes the current user (you can't share with yourself).
 */
export function searchOrgUsers(query: string, excludeUserIds: string[] = []): OrgUser[] {
  const q = query.trim().toLowerCase()
  const exclude = new Set(excludeUserIds)
  return ORG_USERS.filter((u) => {
    if (exclude.has(u.id)) return false
    if (!q) return true
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.initials.toLowerCase().includes(q)
    )
  })
}

/**
 * True if the given email belongs to an organization member. Used by the
 * /share/[token] landing to block non-org users (per resolved open question).
 */
export function isOrgMemberEmail(email: string): boolean {
  return findOrgUserByEmail(email) !== null
}
