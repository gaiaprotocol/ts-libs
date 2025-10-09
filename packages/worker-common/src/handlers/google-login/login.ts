import { googleAuthURL, makePkce } from './google'
import { hmacSign, makeCookie } from '../utils'

function b64UrlJson(obj: any) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export async function handleGoogleLogin(_request: Request, env: Env) {
  const { state, codeVerifier, challenge } = await makePkce()

  // state + code_verifier를 무결성 서명과 함께 쿠키에 저장
  const payload = b64UrlJson({ state, code_verifier: codeVerifier })
  const sig = await hmacSign(env, payload)
  const tmpCookie = makeCookie('oauth_tmp', `${payload}.${sig}`, { maxAge: 600 })

  const redirectTo = googleAuthURL({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri: env.GOOGLE_REDIRECT_URI,
    scope: 'openid email profile', // 필요 시 'openid' 또는 'openid email'로 축소
    codeChallenge: challenge,
    state,
    // accessType / prompt는 필요 시만 추가
    // accessType: 'offline',
    // prompt: 'consent',
  })

  const headers = new Headers({ Location: redirectTo })
  headers.append('Set-Cookie', tmpCookie)
  return new Response(null, { status: 302, headers })
}
