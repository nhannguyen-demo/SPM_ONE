import { randomBytes } from "node:crypto"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapShareLink } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

function genToken(): string {
  return randomBytes(18).toString("base64url").slice(0, 32)
}

const createBody = z.object({
  dashboardId: z.string().min(1),
  permission: z.enum(["view", "comment", "edit"]),
})

/** Dashboard owner creates a share link. */
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

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: parsed.data.dashboardId, ownerUserId: userId, deletedAt: null },
  })
  if (!dashboard) return jsonErr("Dashboard not found", 404)

  const row = await prisma.shareLink.create({
    data: {
      dashboardId: parsed.data.dashboardId,
      createdByUserId: userId,
      token: genToken(),
      permission: parsed.data.permission,
    },
  })

  return jsonOk(mapShareLink(row), { status: 201 })
}
