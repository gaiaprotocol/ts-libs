import { corsHeadersWithOrigin } from '../../services/cors'
import { clearSessionCookie, headersWithCookies } from './utils'

export async function handleGoogleLogout(_request: Request, redirectTo = '/', origin?: string) {

  const headers = headersWithCookies({ Location: redirectTo }, [clearSessionCookie()])
  for (const [k, v] of Object.entries((origin ? corsHeadersWithOrigin(origin) : {}))) headers.set(k, v)

  return new Response(null, {
    status: 302,
    headers,
  })
}
