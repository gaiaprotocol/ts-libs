import { KVNamespace } from "@cloudflare/workers-types";
type Env = {
    SIWE_NONCES: KVNamespace;
};
export declare function validateSiwe(address: `0x${string}`, signature: `0x${string}`, chainId: number, env: Env, domain: string, uri: string, messageForWalletLogin: string): Promise<boolean>;
export {};
//# sourceMappingURL=siwe.d.ts.map