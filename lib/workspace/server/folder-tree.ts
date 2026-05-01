import { prisma } from "@/lib/prisma"

/** All folder ids in the subtree rooted at `rootId` (including root), same owner only. */
export async function collectFolderSubtreeIds(
  ownerUserId: string,
  rootId: string
): Promise<string[]> {
  const rows = await prisma.workspaceFolder.findMany({
    where: { ownerUserId },
    select: { id: true, parentFolderId: true },
  })
  const childrenByParent = new Map<string | null, string[]>()
  for (const r of rows) {
    const p = r.parentFolderId
    const list = childrenByParent.get(p) ?? []
    list.push(r.id)
    childrenByParent.set(p, list)
  }
  const out: string[] = []
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()!
    out.push(id)
    const kids = childrenByParent.get(id) ?? []
    for (const k of kids) stack.push(k)
  }
  return out
}

/** True if `maybeDescendant` is inside the subtree of `ancestorId` (same owner rows). */
export async function isFolderDescendantOf(
  ownerUserId: string,
  ancestorId: string,
  maybeDescendant: string
): Promise<boolean> {
  const ids = await collectFolderSubtreeIds(ownerUserId, ancestorId)
  return ids.includes(maybeDescendant)
}
