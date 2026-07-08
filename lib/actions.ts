// lib/actions.ts — shared server action result type
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export function actionOk(): ActionResult<undefined>
export function actionOk<T>(data: T): ActionResult<T>
export function actionOk<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data: data as T }
}

export function actionErr(error: string): ActionResult<never> {
  return { ok: false, error }
}
