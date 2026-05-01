import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapShare } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const patchSchema = z
  .object({
    permission: z.enum(["view", "comment", "edit"]).optional(),
    revokedAt: z.string().datetime().nullable().optional(),
  })
  .strict()

/** Owner-only: update permission or revoke a share. */
export async function PATCH(req: Request, ctx: { params: Promise<{ shareId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { shareId } = await ctx.params

  const shareRow = await prisma.dashboardShare.findUnique({
    where: { id: shareId },
  })
  if (!shareRow) return jsonErr("Share not found", 404)

  const dash = await prisma.dashboard.findFirst({
    where: { id: shareRow.dashboardId },
    select: { ownerUserId: true },
  })
  if (!dash || dash.ownerUserId !== userId) return jsonErr("Forbidden", 403)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const p = parsed.data
  if (Object.keys(p).length === 0) return jsonOk(mapShare(shareRow))

  const revokedDate =
    p.revokedAt === undefined
      ? undefined
      : p.revokedAt === null
        ? null
        : new Date(p.revokedAt)

  const updated = await prisma.dashboardShare.update({
    where: { id: shareId },
    data: {
      ...(p.permission !== undefined ? { permission: p.permission } : {}),
      ...(revokedDate !== undefined ? { revokedAt: revokedDate } : {}),
    },
  })

  return jsonOk(mapShare(updated))
}
