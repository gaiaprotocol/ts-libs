import { getAddress } from 'viem';
import { GOD_NFT_ADDRESS, WHITELIST } from '../constants';
import { isHolder } from './nft';

export async function checkGodMode(address: string): Promise<boolean> {
  const normalized = getAddress(address);
  const holder = await isHolder(normalized, GOD_NFT_ADDRESS);
  return holder || WHITELIST.includes(normalized);
}
