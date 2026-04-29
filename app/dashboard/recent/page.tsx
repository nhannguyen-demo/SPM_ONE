"use client"

import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceRecentPage() {
  return <WorkspacePage initial={{ kind: "virtual", location: "recent" }} />
}
