import { D1Database } from '@cloudflare/workers-types'
import { corsHeadersWithOrigin } from '../../services/cors'
import { readSession } from './utils'

export async function handleUnlinkGoogleWeb3WalletBySession(
  request: Request,
  env: { DB: D1Database, COOKIE_SECRET: string },
  origin?: string
): Promise<Response> {
  try {
    const me = await readSession(env, request)
    if (!me?.sub) {
      return Response.json({ error: 'not_logged_in' }, { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
    }

    // DB에서 해당 사용자의 지갑 연동 정보 삭제
    const result = await env.DB.prepare(`
      DELETE FROM google_web3_accounts
      WHERE google_sub = ?
    `)
      .bind(me.sub)
      .run()

    // 삭제된 row 수 반환 (선택)
    return Response.json({ ok: true, deleted: result.meta.changes ?? 0 }, { status: 200, headers: origin ? corsHeadersWithOrigin(origin) : undefined })
  } catch (err) {
    console.error(err)
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: origin ? corsHeadersWithOrigin(origin) : undefined }
    )
  }
}
