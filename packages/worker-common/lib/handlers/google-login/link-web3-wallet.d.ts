import { D1Database } from '@cloudflare/workers-types';
export declare function handleLinkGoogleWeb3Wallet(request: Request, env: {
    DB: D1Database;
    JWT_SECRET: string;
    COOKIE_SECRET: string;
}): Promise<Response>;
//# sourceMappingURL=link-web3-wallet.d.ts.map