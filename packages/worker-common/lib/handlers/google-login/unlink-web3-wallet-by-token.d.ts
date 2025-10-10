import { D1Database } from '@cloudflare/workers-types';
export declare function handleUnlinkGoogleWeb3WalletByToken(request: Request, env: {
    DB: D1Database;
    JWT_SECRET: string;
}, origin?: string): Promise<Response>;
//# sourceMappingURL=unlink-web3-wallet-by-token.d.ts.map