import { clearSessionCookie, headersWithCookies } from './utils'

export async function handleGoogleLogout(_request: Request) {
  return new Response(null, {
    status: 302,
    headers: headersWithCookies({ Location: '/' }, [clearSessionCookie()]),
  })
}
