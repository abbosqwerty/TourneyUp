export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

export function fail(error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  return { ok: false, error, fieldErrors }
}

export function succeed(): { ok: true } {
  return { ok: true }
}

export function succeedWith<T>(data: T): { ok: true; data: T } {
  return { ok: true, data }
}
