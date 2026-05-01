import { auth } from "@/auth"

/** Current signed-in user id, or `null` if unauthenticated. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function requireSessionUserId(): Promise<string | Response> {
  const id = await getSessionUserId()
  if (!id) {
    return Response.json({ ok: false as const, error: "Unauthorized" }, { status: 401 })
  }
  return id
}
