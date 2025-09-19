import { KVNamespace } from '@cloudflare/workers-types';
export declare function handleNonce(request: Request, env: {
    SIWE_NONCES: KVNamespace;
}): Promise<Response>;
//# sourceMappingURL=nonce.d.ts.map