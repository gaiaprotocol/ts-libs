import { D1Database } from '@cloudflare/workers-types';
export declare function handleGoogleMe(request: Request, env: {
    DB: D1Database;
    COOKIE_SECRET: string;
}): Promise<Response>;
//# sourceMappingURL=me.d.ts.map