"use client"

import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceTrashPage() {
  return <WorkspacePage initial={{ kind: "virtual", location: "trash" }} />
}
