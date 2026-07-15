/**
 * Returns `value`, throwing if it is undefined. For invariants the type system
 * cannot see, such as a Map lookup guaranteed by construction. Failing loudly
 * at the broken invariant beats propagating `undefined` into arithmetic.
 */
export function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`Invariant violated: missing ${what}`);
  return value;
}
