import { getAddress } from 'viem';
import { z } from 'zod';
import { jsonWithCors } from '../services/cors';
import { generateToken } from '../services/jwt';
import { validateSiwe } from '../services/siwe';
export async function handleLogin(request, chainId, env, domain, uri) {
    const schema = z.object({
        address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
        signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
    });
    const { address, signature } = schema.parse(await request.json());
    const normalizedAddress = getAddress(address);
    const valid = await validateSiwe(normalizedAddress, signature, chainId, env, domain, uri);
    if (!valid) {
        return jsonWithCors('Invalid signature or nonce', 401);
    }
    const token = await generateToken(address, env);
    return jsonWithCors({ token });
}
//# sourceMappingURL=login.js.map