import { z } from 'zod'
import { corsHeadersWithOrigin } from '../../services/cors'
import { decodeJwtPayload } from './google'
import { headersWithCookies, makeSessionCookie } from './utils'

/**
 * Google OpenID Connect JWKS endpoint
 * (Google의 OIDC Discovery의 jwks_uri)
 */
const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs'
const ALLOWED_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']
const CLOCK_SKEW_SEC = 300 // ±5분 허용

// ─────────────────────────────────────────────────────────────
// 유틸: base64url 디코딩
// ─────────────────────────────────────────────────────────────
function b64urlToUint8Array(b64url: string): Uint8Array {
  const pad = (s: string) => s + '==='.slice((s.length + 3) % 4)
  const b64 = pad(b64url.replace(/-/g, '+').replace(/_/g, '/'))
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

function textToUint8Array(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

// ─────────────────────────────────────────────────────────────
// JWKS 가져오기(Cloudflare Workers 캐시 활용)
// ─────────────────────────────────────────────────────────────
async function fetchGoogleJwks(): Promise<any> {
  const req = new Request(GOOGLE_JWKS_URL, {
    // @ts-ignore - Cloudflare Workers에서 cf 옵션 사용
    cf: { cacheTtl: 3600, cacheEverything: true }
  })
  // @ts-ignore - Cloudflare Workers에서 cf 옵션 사용
  const cache = caches.default
  const cached = await cache.match(req)
  if (cached) return cached.json()

  const res = await fetch(req)
  if (!res.ok) throw new Error(`Failed to fetch Google JWKS: ${res.status}`)
  const data = await res.clone().json()
  await cache.put(req, res) // 캐시에 넣기
  return data
}

// ─────────────────────────────────────────────────────────────
// JWK → CryptoKey (RS256)
// ─────────────────────────────────────────────────────────────
async function importJwkForVerify(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  )
}

// ─────────────────────────────────────────────────────────────
// ID 토큰 서명/클레임 검증 (별도 함수)
// ─────────────────────────────────────────────────────────────
export async function verifyGoogleIdJwt(idToken: string, expectedAud: string, expectedNonce?: string) {
  // 1) 토큰 파츠
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('invalid_jwt_format')
  const [headerB64, payloadB64, sigB64] = parts

  // 2) 헤더 확인(kid/alg)
  const headerJson = JSON.parse(
    new TextDecoder().decode(b64urlToUint8Array(headerB64))
  )
  if (headerJson.alg !== 'RS256') throw new Error('unsupported_alg')
  const kid: string | undefined = headerJson.kid
  if (!kid) throw new Error('missing_kid')

  // 3) JWKS에서 kid 매칭 키 획득
  const jwks = await fetchGoogleJwks() // { keys: [...] }
  const jwk = (jwks.keys || []).find((k: any) => k.kid === kid)
  if (!jwk) throw new Error('kid_not_found')

  // 4) 서명 검증
  const key = await importJwkForVerify(jwk)
  const data = textToUint8Array(`${headerB64}.${payloadB64}`)
  const sig = b64urlToUint8Array(sigB64)
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data)
  if (!ok) throw new Error('invalid_signature')

  // 5) 페이로드 파싱(검증 이후)
  const payload: any = decodeJwtPayload(idToken) || {}
  const now = Math.floor(Date.now() / 1000)

  // iss
  if (!ALLOWED_ISSUERS.includes(payload.iss)) throw new Error('invalid_issuer')

  // aud
  if (payload.aud !== expectedAud) throw new Error('aud_mismatch')

  // nonce(선택적이지만 있으면 비교 권장)
  if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
    throw new Error('nonce_mismatch')
  }

  // exp/iat 시간 검증(오차 허용)
  if (typeof payload.exp === 'number' && now > payload.exp + CLOCK_SKEW_SEC) {
    throw new Error('token_expired')
  }
  if (typeof payload.iat === 'number' && payload.iat > now + CLOCK_SKEW_SEC) {
    throw new Error('invalid_iat')
  }

  return payload
}

export async function handleOAuth2Verify(request: Request, env: {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  SESSION_TTL_DAYS: string;
  COOKIE_SECRET: string;
}, origin?: string) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
  }

  // zod 스키마
  const schema = z.object({
    provider: z.literal('google'),
    idToken: z.string().min(10),
    nonce: z.string().min(8) // 클라이언트가 보낸 nonce(토큰 내 nonce와 비교)
  })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.message }, { status: 400, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
  }

  const { idToken, nonce } = parsed.data

  // 구글 ID 토큰 검증(서명/클레임)
  let payload: any
  try {
    payload = await verifyGoogleIdJwt(idToken, env.GOOGLE_CLIENT_ID, nonce)
  } catch (e: any) {
    return Response.json({ error: e?.message || 'verify_failed' }, { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
  }

  // 사용자 프로필 구성(필요시 확장)
  const user = {
    sub: payload.sub,
    email: payload.email,
    email_verified: payload.email_verified,
    name: payload.name,
    picture: payload.picture
  }

  // 세션 쿠키 발급 (SameSite=Lax로 CSRF 완화)
  const sessionCookie = await makeSessionCookie(env, user, request, { sameSite: 'Lax' })

  const headers = headersWithCookies(
    { 'content-type': 'application/json; charset=UTF-8' },
    [sessionCookie]
  )
  for (const [k, v] of Object.entries((origin ? corsHeadersWithOrigin(origin) : {}))) headers.set(k, v)

  return new Response(JSON.stringify({ ok: true, user }, null, 2), {
    status: 200,
    headers,
  })
}
