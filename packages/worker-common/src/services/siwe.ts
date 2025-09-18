import { KVNamespace } from "@cloudflare/workers-types";
import { verifyMessage } from "viem";
import { createSiweMessage } from "viem/siwe";

type Env = {
  ALLOWED_DOMAIN: string;
  ALLOWED_URI: string;
  MESSAGE_FOR_WALLET_LOGIN: string;
  SIWE_NONCES: KVNamespace;
};

export async function validateSiwe(address: `0x${string}`, signature: `0x${string}`, chainId: number, env: Env) {
  const expectedDomain = env.ALLOWED_DOMAIN;
  const expectedUri = env.ALLOWED_URI;

  const stored = await env.SIWE_NONCES.get(`nonce:${address}`);
  if (!stored) return false;

  const { nonce, issuedAt } = JSON.parse(stored);

  const siweMessage = createSiweMessage({
    domain: expectedDomain,
    address,
    statement: env.MESSAGE_FOR_WALLET_LOGIN,
    uri: expectedUri,
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

  if (!isValidSig) return false;

  // delete nonce here to prevent reuse
  await env.SIWE_NONCES.delete(`nonce:${address}`);

  return true;
}
