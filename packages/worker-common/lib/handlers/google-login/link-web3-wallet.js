import { getAddress } from 'viem';
import { verifyToken } from '../../services/jwt';
import { readSession } from './utils';
import { corsHeadersWithOrigin } from '../../services/cors';
export async function handleLinkGoogleWeb3Wallet(request, env, origin) {
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
        const me = await readSession(env, request);
        if (!me?.sub) {
            return Response.json({ error: 'not_logged_in' }, { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
        }
        // 0) 선제 정리: 동일 지갑 주소로 기존에 연결된 다른 계정 있으면 삭제
        await env.DB.prepare(`DELETE FROM google_web3_accounts
        WHERE LOWER(wallet_address) = LOWER(?)`)
            .bind(normalizedAddress)
            .run();
        const now = Math.floor(Date.now() / 1000);
        await env.DB.prepare(`
      INSERT INTO google_web3_accounts
        (google_sub, wallet_address, token, linked_at, email, name, picture)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(google_sub) DO UPDATE SET
        wallet_address = excluded.wallet_address,
        token          = excluded.token,
        linked_at      = excluded.linked_at,
        email          = excluded.email,
        name           = excluded.name,
        picture        = excluded.picture
    `)
            .bind(me.sub, normalizedAddress, token, now, me.email ?? null, me.name ?? null, me.picture ?? null)
            .run();
        return Response.json({
            ok: true,
            wallet_address: normalizedAddress,
            token,
            profile: {
                sub: me.sub,
                email: me.email ?? null,
                name: me.name ?? null,
                picture: me.picture ?? null,
            },
            linked_at: now,
        }, { status: 200, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }
    catch (err) {
        console.error(err);
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }
}
//# sourceMappingURL=link-web3-wallet.js.map