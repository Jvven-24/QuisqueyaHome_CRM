/** Presence is only a reason to verify with Auth, never proof of a session. */
export function hasSupabaseSessionCookie(cookies: readonly { name: string }[]): boolean {
  return cookies.some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
}
