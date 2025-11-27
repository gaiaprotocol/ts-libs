import { KVNamespace } from '@cloudflare/workers-types';
type Env = {
    MESSAGE_FOR_WALLET_LOGIN: string;
    SIWE_NONCES: KVNamespace;
    JWT_SECRET: string;
};
export declare function handleLogin(request: Request, chainId: number, env: Env, domain: string, uri: string): Promise<Response>;
export {};
//# sourceMappingURL=login.d.ts.map