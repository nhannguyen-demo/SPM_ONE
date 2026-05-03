"use client"

import { useSession } from "next-auth/react"
import { useMemo } from "react"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { getCurrentUserId } from "@/lib/workspace/identity"

/**
 * Workspace-scoped “current user” id for React components.
 *
 * Always mirrors `getCurrentUserId()` (session mirror in production, optional
 * localStorage in development) and re-renders when `bumpWorkspaceIdentityRevision`
 * runs after Auth.js session sync — same source as Zustand notification actions.
 */
export function useWorkspaceCurrentUserId(): string {
  const revision = useWorkspaceStore((s) => s.workspaceIdentityRevision)
  const { data: session, status } = useSession()
  return useMemo(() => {
    void session?.user?.id
    void status
    void revision
    return getCurrentUserId()
  }, [session?.user?.id, status, revision])
}
