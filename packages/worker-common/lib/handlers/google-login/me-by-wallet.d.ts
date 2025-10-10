import { D1Database } from '@cloudflare/workers-types';
export declare function handleGoogleMeByWallet(request: Request, env: {
    DB: D1Database;
    JWT_SECRET: string;
}, origin?: string): Promise<Response>;
//# sourceMappingURL=me-by-wallet.d.ts.map