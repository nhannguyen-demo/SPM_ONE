"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "./avatar"
import { findOrgUserById } from "@/lib/workspace/identity"
import { useWorkspaceStore } from "@/lib/workspace/store"
import type { SharePermission } from "@/lib/workspace/types"
import { permissionAtLeast } from "@/lib/workspace/types"

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function CommentsPanel({
  dashboardId,
  myPermission,
  onRequestPermission,
}: {
  dashboardId: string
  myPermission: SharePermission | null
  onRequestPermission?: () => void
}) {
  const comments = useWorkspaceStore((s) =>
    s.comments
      .filter((c) => c.dashboardId === dashboardId)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1))
  )
  const addComment = useWorkspaceStore((s) => s.addComment)

  const [body, setBody] = useState("")
  const canComment = permissionAtLeast(myPermission, "comment")

  const submit = () => {
    if (!body.trim()) return
    addComment({ dashboardId, body })
    setBody("")
  }

  return (
    <div className="flex flex-col h-full bg-card/50 border-l border-border">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-semibold">Comments</span>
        <span className="text-xs text-muted-foreground">{comments.length}</span>
      </div>
      <ScrollArea className="flex-1 px-4 py-3">
        {comments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No comments yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => {
              const author = findOrgUserById(c.authorUserId)
              return (
                <li key={c.id} className="flex gap-2">
                  <UserAvatar user={author} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold">{author?.name ?? "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words mt-0.5">
                      {c.body}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </ScrollArea>
      <div className="border-t border-border px-3 py-2 space-y-2">
        {canComment ? (
          <>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a comment…"
              rows={2}
              maxLength={2000}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit()
              }}
            />
            <div className="flex justify-end">
              <Button onClick={submit} disabled={!body.trim()} size="sm" className="gap-1.5">
                <Send className="w-3.5 h-3.5" /> Post
              </Button>
            </div>
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-2 space-y-2">
            <p>You have view-only access. Request comment access to participate.</p>
            {onRequestPermission && (
              <Button size="sm" variant="outline" onClick={onRequestPermission}>
                Request comment access
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
