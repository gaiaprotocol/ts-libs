import { parseAbi } from 'viem';
import { client } from '../client';
const erc721Abi = parseAbi([
    'function balanceOf(address owner) view returns (uint256)'
]);
export async function isHolder(address, contract) {
    const balance = await client.readContract({
        address: contract,
        abi: erc721Abi,
        functionName: 'balanceOf',
        args: [address]
    });
    return balance > 0n;
}
//# sourceMappingURL=nft.js.map