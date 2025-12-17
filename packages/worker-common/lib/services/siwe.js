import { verifyMessage } from "viem";
import { createSiweMessage } from "viem/siwe";
export async function validateSiwe(address, signature, chainId, env, domain, uri, messageForWalletLogin) {
    const stored = await env.SIWE_NONCES.get(`nonce:${address}`);
    if (!stored)
        return false;
    const { nonce, issuedAt } = JSON.parse(stored);
    const siweMessage = createSiweMessage({
        domain,
        address,
        statement: messageForWalletLogin,
        uri,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date(issuedAt),
    });
    const isValidSig = await verifyMessage({
        address,
        message: siweMessage,
        signature,
    });
    if (!isValidSig)
        return false;
    // delete nonce here to prevent reuse
    await env.SIWE_NONCES.delete(`nonce:${address}`);
    return true;
}
//# sourceMappingURL=siwe.js.map