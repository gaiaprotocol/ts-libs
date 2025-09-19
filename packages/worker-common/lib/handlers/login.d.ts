import { KVNamespace } from '@cloudflare/workers-types';
type Env = {
    ALLOWED_DOMAIN: string;
    ALLOWED_URI: string;
    MESSAGE_FOR_WALLET_LOGIN: string;
    SIWE_NONCES: KVNamespace;
    JWT_SECRET: string;
};
export declare function handleLogin(request: Request, chainId: number, env: Env): Promise<Response>;
export {};
//# sourceMappingURL=login.d.ts.map