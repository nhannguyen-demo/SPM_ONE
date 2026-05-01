"use client"

import { useSession } from "next-auth/react"
import { useMemo } from "react"
import {
  getCurrentUserId,
  ORG_USERS,
  WORKSPACE_DEFAULT_USER_ID,
} from "@/lib/workspace/identity"

/**
 * Workspace-scoped “current user” id for React components.
 *
 * Production: uses the Auth.js session user id when it matches a seeded org user.
 * Development: falls back to `getCurrentUserId()` (localStorage mock selection).
 */
export function useWorkspaceCurrentUserId(): string {
  const { data: session, status } = useSession()
  return useMemo(() => {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
      const id = session?.user?.id
      if (status === "authenticated" && id && ORG_USERS.some((u) => u.id === id)) {
        return id
      }
      return WORKSPACE_DEFAULT_USER_ID
    }
    return getCurrentUserId()
  }, [session?.user?.id, status])
}
