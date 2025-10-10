import { z } from 'zod';
import { decodeJwtPayload, exchangeCodeForTokens } from './google';
import { headersWithCookies, hmacVerify, makeCookie, makeSessionCookie, parseCookies } from './utils';

export async function handleOAuth2Callback(request: Request, env: {
  COOKIE_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  SESSION_TTL_DAYS: string;
}) {
  const url = new URL(request.url)
  const schema = z.object({ code: z.string().min(1), state: z.string().min(1) })
  const params = { code: url.searchParams.get('code'), state: url.searchParams.get('state') }
  const parsed = schema.safeParse(params)
  if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 })

  // temp cookie 검증
  const cookies = parseCookies(request.headers.get('Cookie'))
  const raw = cookies['oauth_tmp']
  if (!raw) return Response.json({ error: 'invalid_state' }, { status: 400 })
  const [payload, sig] = raw.split('.')
  const ok = await hmacVerify(env, payload, sig).catch(() => false)
  if (!ok) return Response.json({ error: 'invalid_signature' }, { status: 400 })
  const tmp = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  if (tmp.state !== parsed.data.state) {
    return Response.json({ error: 'state_mismatch' }, { status: 400 })
  }

  // 토큰 교환
  const token = await exchangeCodeForTokens({
    code: parsed.data.code,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    codeVerifier: tmp.code_verifier,
  }).catch((e: any) => ({ error: e?.message || 'exchange_failed' }))
  if ((token as any).error) {
    return Response.json({ error: (token as any).error }, { status: 400 })
  }

  const id = decodeJwtPayload((token as any).id_token) || {}
  const user = { sub: id.sub, email: id.email, email_verified: id.email_verified, name: id.name, picture: id.picture }

  // 크로스사이트 방지: SameSite=Lax 유지(필요 시 'Strict'로 변경 가능)
  const sessionCookie = await makeSessionCookie(env, user, request, { sameSite: 'Lax' })
  const clearTmp = makeCookie('oauth_tmp', '', { maxAge: 0 })

  const wantsJson = url.searchParams.get('format') === 'json'
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: true, user }, null, 2), {
      status: 200,
      headers: headersWithCookies(
        { 'content-type': 'application/json; charset=UTF-8' },
        [sessionCookie, clearTmp]
      ),
    })
  }

  return new Response(null, {
    status: 302,
    headers: headersWithCookies({ Location: '/' }, [sessionCookie, clearTmp]),
  })
}
