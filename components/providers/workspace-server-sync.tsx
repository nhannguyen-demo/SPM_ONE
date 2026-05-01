"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { toast } from "sonner"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { WORKSPACE_SEED } from "@/lib/workspace/seed"
import { fetchWorkspaceBootstrap } from "@/lib/workspace/workspace-fetch"
import { setWorkspaceRemoteMode } from "@/lib/workspace/remote-mode"

const SEED = WORKSPACE_SEED

const fullSeedHydrate = {
  folders: SEED.folders,
  dashboards: SEED.dashboards,
  shares: SEED.shares,
  shareLinks: SEED.shareLinks,
  comments: SEED.comments,
  permissionRequests: SEED.permissionRequests,
  notifications: SEED.notifications,
}

/**
 * Loads workspace data from GET /api/workspace/bootstrap when the user is signed in.
 * Mock seed data is restored when signed out.
 */
export function WorkspaceServerSync() {
  const { status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      setWorkspaceRemoteMode(false)
      useWorkspaceStore.getState().hydrateWorkspaceFromServer(fullSeedHydrate)
      return
    }

    setWorkspaceRemoteMode(true)
    useWorkspaceStore.setState({
      folders: [],
      dashboards: [],
      shares: [],
      shareLinks: [],
      comments: [],
      permissionRequests: [],
      notifications: [],
    })

    let cancelled = false
    void (async () => {
      try {
        const data = await fetchWorkspaceBootstrap()
        if (cancelled) return
        useWorkspaceStore.getState().hydrateWorkspaceFromServer(data)
      } catch (e) {
        if (cancelled) return
        toast.error("Could not load workspace", {
          description: e instanceof Error ? e.message : "Unknown error",
        })
        setWorkspaceRemoteMode(false)
        useWorkspaceStore.getState().hydrateWorkspaceFromServer(fullSeedHydrate)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status])

  return null
}
