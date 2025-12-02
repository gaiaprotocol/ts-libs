import { D1Database } from '@cloudflare/workers-types';
import { PublicClient } from 'viem';
type TokenRange = {
    start: number;
    end: number;
};
type TokenRangeMap = Record<string, TokenRange>;
/**
 * For a specific NFT collection and a given tokenId range [start, end],
 * calls ownerOf and stores the holder in the DB.
 * - Only updates the holder; metadata fields (type/gender/parts/image) are untouched.
 * - All DB writes are executed via a single batch.
 */
declare function fetchAndStoreNftOwnershipRange(env: {
    DB: D1Database;
}, client: PublicClient, nftAddress: string, start: number, end: number): Promise<void>;
/**
 * Sync NFT ownership based on Transfer events.
 * - Only applies to tokenIds within the provided tokenRanges.
 * - Only updates the holder field; metadata fields remain unchanged.
 * - Uses batch execution for all DB mutations.
 */
declare function syncNftOwnershipFromEvents(env: {
    DB: D1Database;
}, client: PublicClient, tokenRanges: TokenRangeMap, blockStep: number): Promise<void>;
export { fetchAndStoreNftOwnershipRange, syncNftOwnershipFromEvents };
//# sourceMappingURL=nft-ownership-sync.d.ts.map