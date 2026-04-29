"use client"

import { useParams } from "next/navigation"
import { WorkspacePage } from "@/components/workspace/workspace-page"

export default function WorkspaceFolderPage() {
  const params = useParams<{ folderId: string }>()
  const folderId = (params?.folderId as string) ?? ""
  return <WorkspacePage initial={{ kind: "folder", folderId }} />
}
