import { D1Database } from '@cloudflare/workers-types';
import {
  getAddress,
  parseAbiItem,
  PublicClient,
  erc721Abi,
} from 'viem';

const ERC721_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

type TokenRange = { start: number; end: number };
type TokenRangeMap = Record<string, TokenRange>;

/**
 * 초기 상태에서 모든 토큰에 대해 ownerOf 호출 → 보유자 정보 수집
 */
async function initializeNftOwnershipFromChain(
  env: { DB: D1Database },
  client: PublicClient,
  tokenRanges: TokenRangeMap
): Promise<void> {
  for (const [nftAddress, range] of Object.entries(tokenRanges)) {
    if (!range || typeof range !== 'object') continue;

    const { start, end } = range;

    for (let tokenId = start; tokenId <= end; tokenId++) {
      try {
        const owner = await client.readContract({
          address: nftAddress as `0x${string}`,
          abi: erc721Abi,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)],
        });

        await env.DB.prepare(
          `INSERT OR REPLACE INTO nfts (nft_address, token_id, holder) VALUES (?, ?, ?)`
        ).bind(nftAddress, tokenId, owner).run();
      } catch (err) {
        console.warn(`Failed to fetch owner for ${nftAddress}#${tokenId}:`, err);
      }
    }
  }

  const currentBlock = await client.getBlockNumber();

  await env.DB.prepare(
    `INSERT OR REPLACE INTO contract_event_sync_status (
      contract_type, last_synced_block_number, last_synced_at
    ) VALUES (?, ?, strftime('%s','now'))`
  ).bind('ERC721', Number(currentBlock)).run();
}

/**
 * Transfer 이벤트 기반으로 소유자 업데이트
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

  const transferEvents = logs.map((log) => ({
    nftAddress: getAddress(log.address),
    from: log.args.from,
    to: log.args.to,
    tokenId: Number(log.args.tokenId),
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
    logIndex: log.logIndex,
  }));

  for (const { nftAddress, tokenId, to } of transferEvents) {
    await env.DB.prepare(
      `INSERT OR REPLACE INTO nfts (nft_address, token_id, holder) VALUES (?, ?, ?)`
    ).bind(nftAddress, tokenId, to).run();
  }

  await env.DB.prepare(
    `UPDATE contract_event_sync_status
     SET last_synced_block_number = ?, last_synced_at = strftime('%s','now')
     WHERE contract_type = ?`
  ).bind(Number(toBlock), 'ERC721').run();
}

async function syncNftOwnership(
  env: { DB: D1Database },
  client: PublicClient,
  tokenRanges: TokenRangeMap,
  blockStep: number
): Promise<void> {
  const statusRow = await env.DB.prepare(
    `SELECT last_synced_block_number FROM contract_event_sync_status WHERE contract_type = ?`
  )
    .bind('ERC721')
    .first();

  if (!statusRow) {
    console.log('No sync status found. Performing initial holder sync...');
    await initializeNftOwnershipFromChain(env, client, tokenRanges);
  } else {
    await syncNftOwnershipFromEvents(env, client, tokenRanges, blockStep);
  }
}

export { syncNftOwnership, syncNftOwnershipFromEvents };
