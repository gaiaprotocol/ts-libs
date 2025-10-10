import { corsHeadersWithOrigin } from '../../services/cors';
import { readSession } from './utils';
export async function handleGoogleMe(request, env, origin) {
    try {
        const me = await readSession(env, request);
        if (!me?.sub)
            return Response.json({ error: 'not_logged_in' }, { status: 401, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
        const row = await env.DB.prepare(`SELECT wallet_address, token, linked_at, email, name, picture
       FROM google_web3_accounts
       WHERE google_sub = ?`)
            .bind(me.sub)
            .first();
        return Response.json({
            ok: true,
            user: {
                sub: me.sub,
                email: me.email ?? null,
                name: me.name ?? null,
                picture: me.picture ?? null,
            },
            wallet_address: row?.wallet_address ?? null,
            token: row?.token ?? null,
            linked_at: row?.linked_at ?? null,
            // 저장된 값이 있으면 DB 기준으로, 없으면 세션 기준으로 profile 노출
            profile: {
                sub: me.sub,
                email: row?.email ?? me.email ?? null,
                name: row?.name ?? me.name ?? null,
                picture: row?.picture ?? me.picture ?? null,
            },
        }, { status: 200, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }
    catch (err) {
        console.error(err);
        return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500, headers: origin ? corsHeadersWithOrigin(origin) : undefined });
    }
}
//# sourceMappingURL=me.js.map