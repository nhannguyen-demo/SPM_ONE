import { z } from "zod"
import type { Prisma } from "@/lib/generated/prisma"
import { prisma } from "@/lib/prisma"
import { generateDashboardThumbnail } from "@/lib/workspace/thumbnail"
import type { GridWidget } from "@/components/dashboard/layouts"
import { mapDashboard } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const createBody = z.object({
  name: z.string().min(1).max(300),
  equipmentId: z.string().min(1),
  folderId: z.string().nullable().optional(),
  widgets: z.array(z.unknown()).optional(),
})

export async function GET(req: Request) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  const url = new URL(req.url)
  const trash = url.searchParams.get("trash") === "1"

  if (trash) {
    const rows = await prisma.dashboard.findMany({
      where: { ownerUserId: userId, deletedAt: { not: null } },
      orderBy: { updatedAt: "desc" },
    })
    return jsonOk(rows.map(mapDashboard))
  }

  const rows = await prisma.dashboard.findMany({
    where: {
      deletedAt: null,
      OR: [
        { ownerUserId: userId },
        { shares: { some: { sharedWithUserId: userId, revokedAt: null } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
  })
  return jsonOk(rows.map(mapDashboard))
}

export async function POST(req: Request) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = createBody.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const equipment = await prisma.equipment.findUnique({
    where: { id: parsed.data.equipmentId },
  })
  if (!equipment) return jsonErr("Equipment not found", 400)

  const folderId = parsed.data.folderId ?? null
  if (folderId) {
    const folder = await prisma.workspaceFolder.findFirst({
      where: { id: folderId, ownerUserId: userId },
    })
    if (!folder) return jsonErr("Folder not found", 404)
  }

  const name = parsed.data.name.trim() || "Untitled dashboard"
  const widgets = (parsed.data.widgets ?? []) as GridWidget[]

  const row = await prisma.$transaction(async (tx) => {
    const d = await tx.dashboard.create({
      data: {
        equipmentId: parsed.data.equipmentId,
        name,
        ownerUserId: userId,
        contributorUserIds: [],
        folderId,
        widgets: widgets as unknown as Prisma.InputJsonValue,
        thumbnailUrl: null,
        lastChangeByUserId: userId,
      },
    })
    return tx.dashboard.update({
      where: { id: d.id },
      data: {
        thumbnailUrl: generateDashboardThumbnail(d.id, name, widgets),
      },
    })
  })

  return jsonOk(mapDashboard(row), { status: 201 })
}
