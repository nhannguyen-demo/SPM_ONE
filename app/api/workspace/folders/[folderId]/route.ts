import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { collectFolderSubtreeIds, isFolderDescendantOf } from "@/lib/workspace/server/folder-tree"
import { mapFolder } from "@/lib/workspace/server/mappers"
import { jsonErr, jsonOk } from "@/lib/workspace/server/http"
import { requireSessionUserId } from "@/lib/workspace/server/session"

export const dynamic = "force-dynamic"

const patchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  parentFolderId: z.string().nullable().optional(),
})

export async function PATCH(req: Request, ctx: { params: Promise<{ folderId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { folderId } = await ctx.params

  const existing = await prisma.workspaceFolder.findFirst({
    where: { id: folderId, ownerUserId: userId },
  })
  if (!existing) return jsonErr("Folder not found", 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonErr("Invalid JSON", 400)
  }
  const parsed = patchBody.safeParse(body)
  if (!parsed.success) return jsonErr(parsed.error.message, 400)

  const nextParent = parsed.data.parentFolderId
  const nextName = parsed.data.name?.trim()

  if (nextParent !== undefined && nextParent !== null) {
    if (nextParent === folderId) return jsonErr("Folder cannot be its own parent", 400)
    const wouldCycle = await isFolderDescendantOf(userId, folderId, nextParent)
    if (wouldCycle) return jsonErr("Invalid parent (would create a cycle)", 400)
    const p = await prisma.workspaceFolder.findFirst({
      where: { id: nextParent, ownerUserId: userId },
    })
    if (!p) return jsonErr("Parent folder not found", 404)
  }

  const updated = await prisma.workspaceFolder.update({
    where: { id: folderId },
    data: {
      ...(nextName !== undefined ? { name: nextName || existing.name } : {}),
      ...(nextParent !== undefined ? { parentFolderId: nextParent } : {}),
    },
  })

  return jsonOk(mapFolder(updated))
}

export async function DELETE(req: Request, ctx: { params: Promise<{ folderId: string }> }) {
  const userId = await requireSessionUserId()
  if (userId instanceof Response) return userId
  const { folderId } = await ctx.params

  const existing = await prisma.workspaceFolder.findFirst({
    where: { id: folderId, ownerUserId: userId },
  })
  if (!existing) return jsonErr("Folder not found", 404)

  const url = new URL(req.url)
  const mode = url.searchParams.get("mode") === "cascade" ? "cascade" : "move-to-root"

  const subtreeIds = await collectFolderSubtreeIds(userId, folderId)

  await prisma.$transaction(async (tx) => {
    if (mode === "cascade") {
      await tx.dashboard.updateMany({
        where: { folderId: { in: subtreeIds } },
        data: { deletedAt: new Date(), folderId: null },
      })
    } else {
      await tx.dashboard.updateMany({
        where: { folderId: { in: subtreeIds } },
        data: { folderId: null },
      })
    }
    await tx.workspaceFolder.deleteMany({
      where: { id: { in: subtreeIds }, ownerUserId: userId },
    })
  })

  return jsonOk({ deletedFolderIds: subtreeIds })
}
