"use client"

import { useWorkspaceStore } from "@/lib/workspace/store"
import { getCurrentUserId, findOrgUserById } from "@/lib/workspace/identity"
import { Button } from "@/components/ui/button"
import { sites } from "@/lib/data"
import Link from "next/link"

function equipmentLabel(id: string | null): string {
  if (!id) return "—"
  for (const s of sites)
    for (const u of s.units)
      for (const e of u.equipment) if (e.id === id) return e.name
  return id
}

export default function ParameterRequestsPage() {
  const me = findOrgUserById(getCurrentUserId())
  const list = useWorkspaceStore((s) => s.catalogParameterRequests)
  const update = useWorkspaceStore((s) => s.updateCatalogParameterRequestStatus)

  if (me?.role !== "product_team") {
    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-lg font-bold mb-2">Parameter requests</h1>
        <p className="text-sm text-muted-foreground">
          This queue is only visible to the product team. Switch the mock user to &quot;Product
          Team&quot; in the user switcher to review submissions.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-lg font-bold">Parameter requests (product team)</h1>
      <p className="text-xs text-muted-foreground">
        In-app submissions from engineers. {list.length} total.
      </p>
      <ul className="space-y-3">
        {list.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-border p-3 text-sm bg-card"
          >
            <div className="flex justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
              <span
                className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-secondary"
              >
                {r.status}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{r.body}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Equipment: {equipmentLabel(r.equipmentId)}
              {r.categoryHint && ` · ${r.categoryHint}`}
            </div>
            <div className="mt-2 flex gap-2">
              {r.status === "submitted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => update(r.id, "acknowledged")}
                >
                  Acknowledge
                </Button>
              )}
              {r.status !== "closed" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => update(r.id, "closed")}
                >
                  Close
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {list.length === 0 && (
        <p className="text-sm text-muted-foreground">No requests yet.</p>
      )}
    </div>
  )
}
