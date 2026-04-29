"use client"

import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceIndexPage() {
  return <WorkspacePage initial={{ kind: "virtual", location: "all" }} />
}
