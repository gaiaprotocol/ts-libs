import { erc721Abi, getAddress, parseAbiItem, } from 'viem';
const ERC721_TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
/**
 * 특정 NFT 컬렉션의 지정된 tokenId 범위(start~end)에 대해 ownerOf 호출 후 DB에 저장
 * - 메타데이터(type/gender/parts/image)는 건드리지 않고 holder만 갱신
 */
async function fetchAndStoreNftOwnershipRange(env, client, nftAddress, start, end) {
    const upsertSql = `
    INSERT INTO nfts (nft_address, token_id, holder)
    VALUES (?, ?, ?)
    ON CONFLICT(nft_address, token_id) DO UPDATE SET
      holder = excluded.holder
  `;
    const tasks = [];
    for (let tokenId = start; tokenId <= end; tokenId++) {
        tasks.push((async () => {
            const owner = await client.readContract({
                address: nftAddress,
                abi: erc721Abi,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)],
            });
            await env.DB.prepare(upsertSql)
                .bind(nftAddress, tokenId, owner)
                .run();
        })());
    }
    await Promise.all(tasks);
}
/**
 * Transfer 이벤트 기반으로 소유자 업데이트
 * - 지정된 tokenRanges에 해당하는 토큰만 반영
 * - 메타데이터 필드는 유지하고 holder만 갱신
 * - 블록 범위 계산을 last+1 ~ last+step 로 단순화
 */
async function syncNftOwnershipFromEvents(env, client, tokenRanges, blockStep) {
    const statusRow = await env.DB.prepare(`SELECT last_synced_block_number FROM contract_event_sync_status WHERE contract_type = ?`)
        .bind('ERC721')
        .first();
    const lastSynced = statusRow ? BigInt(statusRow.last_synced_block_number) : undefined;
    if (lastSynced === undefined) {
        throw new Error('No previously synced block found for ERC721');
    }
    const currentBlock = await client.getBlockNumber();
    // from = last + 1, to = min(from + blockStep - 1, current)
    const fromBlock = lastSynced + 1n;
    if (fromBlock > currentBlock) {
        // 이미 최신
        return;
    }
    let toBlock = fromBlock + BigInt(blockStep) - 1n;
    if (toBlock > currentBlock)
        toBlock = currentBlock;
    const addresses = Object.keys(tokenRanges).map(getAddress);
    const logs = await client.getLogs({
        address: addresses,
        event: ERC721_TRANSFER_EVENT,
        fromBlock,
        toBlock,
    });
    // holder만 갱신하는 UPSERT
    const upsertHolderSql = `
    INSERT INTO nfts (nft_address, token_id, holder)
    VALUES (?, ?, ?)
    ON CONFLICT(nft_address, token_id) DO UPDATE SET
      holder = excluded.holder
  `;
    for (const log of logs) {
        const nftAddress = getAddress(log.address);
        const tokenId = Number(log.args.tokenId);
        const to = log.args.to;
        // 지정된 토큰 범위에 속하는 경우에만 반영
        const range = tokenRanges[nftAddress];
        if (range && tokenId >= range.start && tokenId <= range.end) {
            await env.DB.prepare(upsertHolderSql)
                .bind(nftAddress, tokenId, to)
                .run();
        }
    }
    await env.DB.prepare(`UPDATE contract_event_sync_status
     SET last_synced_block_number = ?, last_synced_at = strftime('%s','now')
     WHERE contract_type = ?`)
        .bind(Number(toBlock), 'ERC721')
        .run();
}
export { fetchAndStoreNftOwnershipRange, syncNftOwnershipFromEvents };
//# sourceMappingURL=nft-ownership-sync.js.map