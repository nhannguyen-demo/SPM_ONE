"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useWorkspaceStore } from "@/lib/workspace/store"
import { getWorkspaceDashboardIdForTag } from "@/lib/workspace-data"

/**
 * Legacy URL: /equipment-dashboard/[equipmentId]/[tag]/full
 * Redirects to the canonical full-screen viewer using WorkspaceDashboard.id.
 */
export default function LegacyEquipmentDashboardFullRedirect() {
  const params = useParams<{ equipmentId: string; tag: string }>()
  const router = useRouter()
  const dashboards = useWorkspaceStore((s) => s.dashboards)

  const equipmentId = decodeURIComponent((params?.equipmentId as string) ?? "")
  const tag = decodeURIComponent((params?.tag as string) ?? "")

  useEffect(() => {
    const id = getWorkspaceDashboardIdForTag(equipmentId, tag, dashboards)
    if (id) {
      router.replace(`/dashboards/${encodeURIComponent(id)}/full`)
    } else {
      router.replace("/dashboard")
    }
  }, [equipmentId, tag, dashboards, router])

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
      Redirecting…
    </div>
  )
}
