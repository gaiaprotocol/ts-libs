import { D1Database } from '@cloudflare/workers-types';
import { getAddress } from 'viem';
import { corsHeadersWithOrigin } from '../../services/cors';
import { verifyToken } from '../../services/jwt';

export async function handleUnlinkGoogleWeb3WalletByToken(
  request: Request,
  env: { DB: D1Database, JWT_SECRET: string },
  origin?: string
): Promise<Response> {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }

    const token = auth.slice(7);
    const payload = await verifyToken(token, env);
    if (!payload?.sub) {
      return new Response('Unauthorized', { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }

    const normalizedAddress = getAddress(payload.sub);

    const result = await env.DB.prepare(
      `DELETE FROM google_web3_accounts
       WHERE wallet_address = ?`
    )
      .bind(normalizedAddress)
      .run();

    return Response.json({ ok: true, deleted: result.meta.changes ?? 0 }, { status: 200, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: origin ? corsHeadersWithOrigin(origin) : undefined },
    );
  }
}
