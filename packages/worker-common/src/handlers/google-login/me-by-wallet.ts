import { D1Database } from '@cloudflare/workers-types';
import { getAddress } from 'viem';
import { corsHeadersWithOrigin } from '../../services/cors';
import { verifyToken } from '../../services/jwt';

export async function handleGoogleMeByWallet(
  request: Request,
  env: { DB: D1Database; JWT_SECRET: string },
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

    const row = await env.DB.prepare(
      `SELECT google_sub, wallet_address, token, linked_at, email, name, picture
       FROM google_web3_accounts
       WHERE wallet_address = ?`
    )
      .bind(normalizedAddress)
      .first<{
        google_sub: string;
        wallet_address: string;
        token: string;
        linked_at: number;
        email: string | null;
        name: string | null;
        picture: string | null;
      }>();

    if (!row) {
      return Response.json(
        { ok: false, error: 'no_account_linked', wallet_address: normalizedAddress },
        { status: 404, headers: origin ? corsHeadersWithOrigin(origin) : undefined },
      );
    }

    return Response.json({
      ok: true,
      wallet_address: row.wallet_address,
      google_sub: row.google_sub,
      token: row.token,
      linked_at: row.linked_at,
      profile: {
        sub: row.google_sub,
        email: row.email,
        name: row.name,
        picture: row.picture,
      },
    }, { status: 200, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500, headers: origin ? corsHeadersWithOrigin(origin) : undefined },
    );
  }
}
