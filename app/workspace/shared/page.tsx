"use client"

import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceSharedPage() {
  return <WorkspacePage initial={{ kind: "virtual", location: "shared" }} />
}
