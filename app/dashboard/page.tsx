"use client"

import { Suspense } from "react"
import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceIndexPage() {
  return (
    <Suspense fallback={null}>
      <WorkspacePage initial={{ kind: "virtual", location: "all" }} />
    </Suspense>
  )
}
