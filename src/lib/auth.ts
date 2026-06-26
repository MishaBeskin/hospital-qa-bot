import { createClient } from '@/lib/supabase/server'

// getSession() reads the JWT from the cookie without a network round-trip.
// getUser() would validate against the Supabase Auth API (~400ms extra per request).
// The proxy already refreshes and validates tokens on every admin page load,
// so local JWT verification is sufficient here.
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}
