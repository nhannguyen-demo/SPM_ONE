import { prisma } from "@/lib/prisma"
import { mapDashboard, mapShareLink } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

/**
 * Resolve a share link token for an authenticated user (org gate remains client-side).
 * Query: ?token=
 */
export async function GET(req: Request) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId

  const url = new URL(req.url)
  const token = url.searchParams.get("token")?.trim()
  if (!token) return jsonErr("Missing token", 400)

  const link = await prisma.shareLink.findFirst({
    where: {
      token,
      revokedAt: null,
      dashboard: { deletedAt: null },
    },
    include: {
      dashboard: true,
    },
  })

  if (!link) {
    return jsonErr("Link not found or revoked", 404)
  }

  const { dashboard, ...linkOnly } = link
  return jsonOk({
    link: mapShareLink(linkOnly),
    dashboard: mapDashboard(dashboard),
  })
}
