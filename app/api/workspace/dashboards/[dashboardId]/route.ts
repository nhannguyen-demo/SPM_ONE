import { z } from "zod"
import { Prisma } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"
import type { GridWidget } from "@/components/dashboard/layouts"
import type { DashboardContextState } from "@/lib/workspace/types"
import { generateDashboardThumbnail } from "@/lib/workspace/thumbnail"
import { getDashboardAccess, accessAtLeast } from "@/lib/workspace/server/access"
import { mapDashboard } from "@/lib/workspace/server/mappers"
import { nextKnowledgePackVersion } from "@/lib/workspace/server/pack-version"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const patchBody = z
  .object({
    name: z.string().min(1).max(300).optional(),
    folderId: z.string().nullable().optional(),
    widgets: z.array(z.unknown()).optional(),
    dashboardContext: z.record(z.string(), z.unknown()).nullable().optional(),
    lifecycleStatus: z.enum(["created", "published"]).optional(),
  })
  .strict()

export async function GET(_req: Request, ctx: { params: Promise<{ dashboardId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { dashboardId } = await ctx.params

  const d = await prisma.dashboard.findFirst({
    where: { id: dashboardId },
  })
  if (!d) return jsonErr("Not found", 404)

  if (d.deletedAt !== null && d.ownerUserId !== userId) {
    return jsonErr("Not found", 404)
  }

  const access = await getDashboardAccess(userId, dashboardId)
  if (access === "none") return jsonErr("Not found", 404)

  return jsonOk(mapDashboard(d))
}

export async function PATCH(req: Request, ctx: { params: Promise<{ dashboardId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { dashboardId } = await ctx.params

  const existing = await prisma.dashboard.findFirst({
    where: { id: dashboardId },
  })
  if (!existing || existing.deletedAt) return jsonErr("Not found", 404)

  const access = await getDashboardAccess(userId, dashboardId)
  if (access === "none") return jsonErr("Not found", 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchBody.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const p = parsed.data
  const hasContentPatch =
    p.name !== undefined || p.folderId !== undefined || p.widgets !== undefined || p.dashboardContext !== undefined

  if (hasContentPatch && !accessAtLeast(access, "edit")) {
    return jsonErr("Forbidden", 403)
  }

  if (p.lifecycleStatus !== undefined) {
    if (!accessAtLeast(access, "edit")) return jsonErr("Forbidden", 403)
    if (access !== "owner") return jsonErr("Only the owner can change publish state", 403)
  }

  if (p.folderId !== undefined && p.folderId !== null) {
    const folder = await prisma.workspaceFolder.findFirst({
      where: { id: p.folderId, ownerUserId: existing.ownerUserId },
    })
    if (!folder) return jsonErr("Folder not found", 404)
  }

  const data: Prisma.DashboardUncheckedUpdateInput = {}
  let contributorUserIds = [...existing.contributorUserIds]
  const currentWidgets = existing.widgets as unknown as GridWidget[]

  if (p.name !== undefined) {
    const nextName = p.name.trim() || existing.name
    data.name = nextName
    data.thumbnailUrl = generateDashboardThumbnail(existing.id, nextName, currentWidgets)
  }

  if (p.folderId !== undefined) {
    data.folderId = p.folderId
  }

  if (p.widgets !== undefined) {
    const widgets = p.widgets as GridWidget[]
    data.widgets = widgets as unknown as Prisma.InputJsonValue
    if (existing.ownerUserId !== userId && !contributorUserIds.includes(userId)) {
      contributorUserIds = [...contributorUserIds, userId]
    }
    data.contributorUserIds = contributorUserIds
    data.knowledgePackVersion = nextKnowledgePackVersion(
      existing.equipmentId,
      widgets,
      existing.knowledgePackVersion
    )
    const displayName = typeof data.name === "string" ? data.name : existing.name
    data.thumbnailUrl = generateDashboardThumbnail(existing.id, displayName, widgets)
    data.lastChangeByUserId = userId
    data.lastChangeAt = new Date()
  }

  if (p.dashboardContext !== undefined) {
    data.dashboardContext =
      p.dashboardContext === null ? Prisma.JsonNull : (p.dashboardContext as Prisma.InputJsonValue)
    data.lastChangeByUserId = userId
    data.lastChangeAt = new Date()
  }

  if (p.lifecycleStatus !== undefined) {
    data.lifecycleStatus = p.lifecycleStatus
    if (p.lifecycleStatus === "published") {
      data.publishedAt = existing.publishedAt ?? new Date()
    }
  }

  if (Object.keys(data).length === 0) {
    return jsonOk(mapDashboard(existing))
  }

  const updated = await prisma.dashboard.update({
    where: { id: dashboardId },
    data,
  })

  return jsonOk(mapDashboard(updated))
}

export async function DELETE(req: Request, ctx: { params: Promise<{ dashboardId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { dashboardId } = await ctx.params

  const url = new URL(req.url)
  const permanent = url.searchParams.get("permanent") === "1"

  const existing = await prisma.dashboard.findFirst({
    where: { id: dashboardId },
  })
  if (!existing) return jsonErr("Not found", 404)

  if (existing.ownerUserId !== userId) return jsonErr("Forbidden", 403)

  if (permanent) {
    if (!existing.deletedAt) {
      return jsonErr("Dashboard must be in trash before permanent delete", 400)
    }
    await prisma.dashboard.delete({ where: { id: dashboardId } })
    return jsonOk({ deleted: true as const })
  }

  if (existing.deletedAt) return jsonErr("Already deleted", 400)

  const row = await prisma.dashboard.update({
    where: { id: dashboardId },
    data: { deletedAt: new Date() },
  })
  return jsonOk(mapDashboard(row))
}
