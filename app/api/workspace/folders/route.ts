import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { mapFolder } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const createBody = z.object({
  name: z.string().min(1).max(200),
  parentFolderId: z.string().nullable().optional(),
})

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

  const name = parsed.data.name.trim() || "Untitled folder"
  const parentFolderId = parsed.data.parentFolderId ?? null

  if (parentFolderId) {
    const parent = await prisma.workspaceFolder.findFirst({
      where: { id: parentFolderId, ownerUserId: userId },
    })
    if (!parent) return jsonErr("Parent folder not found", 404)
  }

  const folder = await prisma.workspaceFolder.create({
    data: {
      ownerUserId: userId,
      parentFolderId,
      name,
    },
  })

  return jsonOk(mapFolder(folder), { status: 201 })
}
