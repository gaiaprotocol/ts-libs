import { KVNamespace } from "@cloudflare/workers-types";
type Env = {
    ALLOWED_DOMAIN: string;
    ALLOWED_URI: string;
    MESSAGE_FOR_WALLET_LOGIN: string;
    SIWE_NONCES: KVNamespace;
};
export declare function validateSiwe(address: `0x${string}`, signature: `0x${string}`, chainId: number, env: Env): Promise<boolean>;
export {};
//# sourceMappingURL=siwe.d.ts.map