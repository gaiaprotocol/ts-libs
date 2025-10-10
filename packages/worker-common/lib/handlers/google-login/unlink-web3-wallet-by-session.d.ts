import { D1Database } from '@cloudflare/workers-types';
export declare function handleUnlinkGoogleWeb3WalletBySession(request: Request, env: {
    DB: D1Database;
    COOKIE_SECRET: string;
}, origin?: string): Promise<Response>;
//# sourceMappingURL=unlink-web3-wallet-by-session.d.ts.map