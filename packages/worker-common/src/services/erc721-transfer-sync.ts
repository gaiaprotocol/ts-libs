import { D1Database } from '@cloudflare/workers-types';
import { getAddress, parseAbiItem, PublicClient } from 'viem';

const ERC721_TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
);

type TokenRangeMap = Record<string, unknown>;

export class Erc721TransferSyncService {
  #client: PublicClient;
  #tokenRanges: TokenRangeMap;
  #blockStep: bigint;

  constructor(
    client: PublicClient,
    tokenRanges: TokenRangeMap,
    blockStep: number
  ) {
    this.#client = client;
    this.#tokenRanges = tokenRanges;
    this.#blockStep = BigInt(blockStep);
  }

  public async syncTransferEvents(env: { DB: D1Database }): Promise<void> {
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

    let toBlock = lastSyncedBlockNumber + this.#blockStep;
    const currentBlock = await this.#client.getBlockNumber();

    if (toBlock > currentBlock) {
      toBlock = currentBlock;
    }

    let fromBlock = toBlock - this.#blockStep * 2n;
    if (fromBlock < 0n) {
      fromBlock = 0n;
    }

    const logs = await this.#client.getLogs({
      address: Object.keys(this.#tokenRanges) as `0x${string}`[],
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
}
