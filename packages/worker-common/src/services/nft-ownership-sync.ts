import { D1Database } from '@cloudflare/workers-types';
import {
  erc721Abi,
  getAddress,
  parseAbiItem,
  PublicClient,
} from 'viem';

const ERC721_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

type TokenRange = { start: number; end: number };
type TokenRangeMap = Record<string, TokenRange>;

/**
 * For a specific NFT collection and a given tokenId range [start, end],
 * calls ownerOf and stores the holder in the DB.
 * - Only updates the holder; metadata fields (type/gender/parts/image) are untouched.
 * - All DB writes are executed via a single batch.
 */
async function fetchAndStoreNftOwnershipRange(
  env: { DB: D1Database },
  client: PublicClient,
  nftAddress: string,
  start: number,
  end: number
): Promise<void> {
  const upsertSql = `
    INSERT INTO nfts (nft_address, token_id, holder)
    VALUES (?, ?, ?)
    ON CONFLICT(nft_address, token_id) DO UPDATE SET
      holder = excluded.holder
  `;

  // 1. Fetch all owners in parallel (on-chain calls)
  const ownerships = await Promise.all(
    Array.from({ length: end - start + 1 }, (_, idx) => {
      const tokenId = start + idx;
      return client
        .readContract({
          address: nftAddress as `0x${string}`,
          abi: erc721Abi,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        })
        .then((owner) => ({ tokenId, owner }));
    })
  );

  // 2. Build all DB statements and execute them in a single batch
  const statements = ownerships.map(({ tokenId, owner }) =>
    env.DB.prepare(upsertSql).bind(nftAddress, tokenId, owner)
  );

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}

/**
 * Sync NFT ownership based on Transfer events.
 * - Only applies to tokenIds within the provided tokenRanges.
 * - Only updates the holder field; metadata fields remain unchanged.
 * - Uses batch execution for all DB mutations.
 */
async function syncNftOwnershipFromEvents(
  env: { DB: D1Database },
  client: PublicClient,
  tokenRanges: TokenRangeMap,
  blockStep: number
): Promise<void> {
  const statusRow = await env.DB.prepare(
    `SELECT last_synced_block_number FROM contract_event_sync_status WHERE contract_type = ?`
  )
    .bind('ERC721')
    .first<{ last_synced_block_number: number }>();

  const lastSyncedBlockNumber = statusRow
    ? BigInt(statusRow.last_synced_block_number)
    : undefined;

  if (lastSyncedBlockNumber === undefined) {
    throw new Error('No previously synced block found for ERC721');
  }

  let toBlock = lastSyncedBlockNumber + BigInt(blockStep);
  const currentBlock = await client.getBlockNumber();

  if (toBlock > currentBlock) {
    toBlock = currentBlock;
  }

  let fromBlock = toBlock - BigInt(blockStep) * 2n;
  if (fromBlock < 0n) {
    fromBlock = 0n;
  }

  const logs = await client.getLogs({
    address: Object.keys(tokenRanges) as `0x${string}`[],
    event: ERC721_TRANSFER_EVENT,
    fromBlock,
    toBlock,
  });

  const upsertHolderSql = `
    INSERT INTO nfts (nft_address, token_id, holder)
    VALUES (?, ?, ?)
    ON CONFLICT(nft_address, token_id) DO UPDATE SET
      holder = excluded.holder
  `;

  const statements: any[] = [];

  // 1. Build holder update statements for relevant tokens
  for (const log of logs) {
    const nftAddress = getAddress(log.address);
    const tokenId = Number(log.args.tokenId);
    const to = log.args.to as string;

    const range = tokenRanges[nftAddress];
    if (range && tokenId >= range.start && tokenId <= range.end) {
      statements.push(
        env.DB.prepare(upsertHolderSql).bind(nftAddress, tokenId, to)
      );
    }
  }

  // 2. Update sync checkpoint
  statements.push(
    env.DB.prepare(
      `UPDATE contract_event_sync_status
       SET last_synced_block_number = ?, last_synced_at = strftime('%s','now')
       WHERE contract_type = ?`
    ).bind(Number(toBlock), 'ERC721')
  );

  // 3. Execute all DB mutations in a single batch
  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}

export { fetchAndStoreNftOwnershipRange, syncNftOwnershipFromEvents };
