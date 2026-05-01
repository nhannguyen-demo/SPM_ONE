"use client"

import { SessionProvider } from "next-auth/react"
import { useSession } from "next-auth/react"
import { useEffect, type ReactNode } from "react"
import { WorkspaceServerSync } from "@/components/providers/workspace-server-sync"
import {
  clearCurrentUserId,
  ORG_USERS,
  syncWorkspaceUserFromSession,
} from "@/lib/workspace/identity"
import { bumpWorkspaceIdentityRevision } from "@/lib/workspace/store"

/**
 * Keeps workspace identity aligned with the Auth.js session: mirrors session.user.id
 * into `identity.ts` (dev: optional localStorage), then bumps Zustand revision so
 * selectors using `getCurrentUserId()` refresh.
 */
function AuthIdentitySync() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      clearCurrentUserId()
      bumpWorkspaceIdentityRevision()
      return
    }
    if (status !== "authenticated" || !session?.user?.id) return
    const id = session.user.id
    if (ORG_USERS.some((u) => u.id === id)) {
      syncWorkspaceUserFromSession(id)
    } else {
      syncWorkspaceUserFromSession(null)
    }
    bumpWorkspaceIdentityRevision()
  }, [session, status])

  return null
}

export function AppAuthProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthIdentitySync />
      <WorkspaceServerSync />
      {children}
    </SessionProvider>
  )
}
