"use client"

import { useParams } from "next/navigation"
import { useEffect } from "react"
import { useAppStore } from "@/lib/store"
import { DashboardEditor } from "@/components/workspace/dashboard-editor"

export default function DashboardEditorPage() {
  const params = useParams<{ dashboardId: string }>()
  const dashboardId = (params?.dashboardId as string) ?? ""
  const setActiveModule = useAppStore((s) => s.setActiveModule)

  useEffect(() => {
    setActiveModule("workspace")
  }, [setActiveModule])

  return <DashboardEditor dashboardId={dashboardId} />
}
