import { b64urlEncode, sha256 } from './utils'

export function googleAuthURL({ clientId, redirectUri, scope, codeChallenge, state, accessType, prompt }: {
  clientId: string
  redirectUri: string
  scope: string
  codeChallenge: string
  state: string
  accessType?: 'online' | 'offline'
  prompt?: 'consent' | 'none' | 'select_account' | 'consent select_account'
}) {
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  auth.searchParams.set('response_type', 'code')
  auth.searchParams.set('client_id', clientId)
  auth.searchParams.set('redirect_uri', redirectUri)
  auth.searchParams.set('scope', scope)
  auth.searchParams.set('code_challenge', codeChallenge)
  auth.searchParams.set('code_challenge_method', 'S256')
  auth.searchParams.set('state', state)
  if (accessType) auth.searchParams.set('access_type', accessType)
  if (prompt) auth.searchParams.set('prompt', prompt)
  return auth.toString()
}

export async function exchangeCodeForTokens({ code, clientId, clientSecret, redirectUri, codeVerifier }: {
  code: string
  clientId: string
  clientSecret?: string
  redirectUri: string
  codeVerifier: string
}) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  })
  if (clientSecret) body.set('client_secret', clientSecret)

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!resp.ok) throw new Error(`token exchange failed: ${resp.status}`)
  return await resp.json()
}

export function decodeJwtPayload(idToken?: string) {
  if (!idToken) return null
  const [, p] = idToken.split('.')
  if (!p) return null
  const json = atob(p.replace(/-/g, '+').replace(/_/g, '/'))
  return JSON.parse(json)
}

export async function makePkce() {
  const state = b64urlEncode(crypto.getRandomValues(new Uint8Array(16)))
  const codeVerifier = b64urlEncode(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = b64urlEncode(await sha256(codeVerifier))
  return { state, codeVerifier, challenge }
}
