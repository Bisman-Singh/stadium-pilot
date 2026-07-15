/**
 * Parses a Response body as the type the caller expects. `Response.json()` is
 * typed `any`; confining the assertion to this one helper keeps call sites
 * honest, and Zod validation at the boundaries does the real checking.
 */
export async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
