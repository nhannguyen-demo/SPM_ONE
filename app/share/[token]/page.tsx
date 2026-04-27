"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Lock, ShieldAlert, ExternalLink, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResponsiveDashboardGrid } from "@/components/workspace/read-only-grid"
import { useWorkspaceStore } from "@/lib/workspace/store"
import {
  ORG_USERS,
  findOrgUserById,
  getCurrentUserId,
} from "@/lib/workspace/identity"
import { permissionAtLeast } from "@/lib/workspace/types"

/**
 * Share-link landing page.
 *
 * Authorization model (per resolved open question):
 *   - Token must exist and be non-revoked.
 *   - The current user MUST be a member of the organization directory; non-org
 *     users are blocked with a "not authorised" state.
 *   - On a successful "Open in Workspace" action with edit/comment permission,
 *     the user becomes a contributor on first save (handled by the editor, not
 *     here — this landing only routes them in).
 */
export default function ShareLandingPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = (params?.token as string) ?? ""

  const link = useWorkspaceStore((s) =>
    s.shareLinks.find((l) => l.token === token && !l.revokedAt) ?? null
  )
  const dashboard = useWorkspaceStore((s) =>
    link ? s.dashboards.find((d) => d.id === link.dashboardId && !d.deletedAt) ?? null : null
  )
  const shareWithUser = useWorkspaceStore((s) => s.shareWithUser)

  const meId = getCurrentUserId()
  const me = useMemo(() => findOrgUserById(meId), [meId])

  const isOrgMember = ORG_USERS.some((u) => u.id === meId)

  const [accepted, setAccepted] = useState(false)

  // Persist a baseline share when an org user successfully consumes the link.
  useEffect(() => {
    if (!accepted) return
    if (!link || !dashboard || !isOrgMember) return
    if (dashboard.ownerUserId === meId) return
    shareWithUser({
      dashboardId: dashboard.id,
      sharedWithUserId: meId,
      permission: link.permission,
    })
  }, [accepted, link, dashboard, isOrgMember, meId, shareWithUser])

  /* ── Error / blocked states ──────────────────────────────────────────── */
  if (!link) {
    return (
      <CenteredPanel
        icon={<Lock className="w-10 h-10 text-muted-foreground" />}
        title="Link not available"
        body="This share link is invalid, has expired, or has been revoked. Please ask the dashboard owner for a new link."
      />
    )
  }
  if (!dashboard) {
    return (
      <CenteredPanel
        icon={<Lock className="w-10 h-10 text-muted-foreground" />}
        title="Dashboard unavailable"
        body="The dashboard this link points to has been deleted or is no longer accessible."
      />
    )
  }
  if (!isOrgMember) {
    return (
      <CenteredPanel
        icon={<ShieldAlert className="w-10 h-10 text-rose-500" />}
        title="Not authorised"
        body="Share links are restricted to members of this organization. You are not signed in as an organization member."
      />
    )
  }

  const owner = findOrgUserById(dashboard.ownerUserId)
  const canEdit = permissionAtLeast(link.permission, "edit")

  if (accepted) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background">
        <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 flex-shrink-0">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">
              Shared via link · {link.permission} access · Owner: {owner?.name ?? "Unknown"}
            </div>
            <h1 className="text-sm font-bold text-foreground truncate">{dashboard.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                size="sm"
                onClick={() => router.push(`/workspace/dashboard/${dashboard.id}/edit`)}
                className="gap-1.5"
              >
                Open editor <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push("/workspace/shared")}
              className="gap-1.5"
            >
              Go to Workspace <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-auto bg-muted/20">
          <ResponsiveDashboardGrid dashboard={dashboard} />
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{dashboard.name}</h2>
          <p className="text-xs text-muted-foreground">
            Shared by {owner?.name ?? "the owner"} ·{" "}
            <strong className="capitalize">{link.permission}</strong> access
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          You&apos;re signed in as {me?.name}. Click below to open this dashboard.
        </p>
        <Button onClick={() => setAccepted(true)} className="w-full">
          Open dashboard
        </Button>
      </div>
    </div>
  )
}

function CenteredPanel({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
          {icon}
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
        <Button asChild>
          <a href="/workspace">Go to Workspace</a>
        </Button>
      </div>
    </div>
  )
}
