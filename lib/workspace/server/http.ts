export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ ok: true as const, data }, { status: 200, ...init })
}

export function jsonErr(message: string, status: number): Response {
  return Response.json({ ok: false as const, error: message }, { status })
}
