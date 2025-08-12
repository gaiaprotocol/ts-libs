import { KVNamespace } from '@cloudflare/workers-types';
import { getAddress } from 'viem';
import { z } from 'zod';
import { jsonWithCors } from '../services/cors';
import { generateToken } from '../services/jwt';
import { validateSiwe } from '../services/siwe';

type Env = {
  ALLOWED_DOMAIN: string;
  ALLOWED_URI: string;
  MESSAGE_FOR_WALLET_LOGIN: string;
  SIWE_NONCES: KVNamespace;
  JWT_SECRET: string;
};

export async function handleLogin(request: Request, chainId: number, env: Env) {
  const schema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
  });

  const { address, signature } = schema.parse(await request.json());

  const normalizedAddress = getAddress(address);

  const valid = await validateSiwe(
    normalizedAddress,
    signature as `0x${string}`,
    chainId,
    env
  );

  if (!valid) {
    return jsonWithCors('Invalid signature or nonce', 401);
  }

  const token = await generateToken(address, env);
  return jsonWithCors({ token });
}
