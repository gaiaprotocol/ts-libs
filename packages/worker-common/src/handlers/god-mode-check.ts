import { getAddress } from 'viem';
import { z } from 'zod';
import { isHolder } from "../services/nft";

const GOD_NFT_CONTRACT = '0x134590ACB661Da2B318BcdE6b39eF5cF8208E372';

const WHITELIST = [
  '0xa9a6D8C0ACc5266CC5Db2c3FE2EF799A10d9ceA8',
  '0x67aaB54e9F81d35B2d9Ad7Bc3b6505095618aeB0',
  '0x7a2bBEc3a4064d43A691A5809fAC81547f3Fa202',
  '0x5223595e40ACeAaC6F829b4aa79D9ef430758E09',
  '0x80A594e6555D04D718Ac565358daB8eA76D0eEe5',
];

export async function handleGodModeCheck(request: Request): Promise<Response> {
  const schema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  });

  const { address } = schema.parse(await request.json());

  const normalizedAddress = getAddress(address);
  const holder = await isHolder(normalizedAddress, GOD_NFT_CONTRACT);

  return Response.json({ godMode: holder || WHITELIST.includes(normalizedAddress) });
}
