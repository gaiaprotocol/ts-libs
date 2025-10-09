import { clearSessionCookie, headersWithCookies } from '../utils'

export async function handleGoogleLogout(_request: Request, _env: Env) {
  return new Response(null, {
    status: 302,
    headers: headersWithCookies({ Location: '/' }, [clearSessionCookie()]),
  })
}
