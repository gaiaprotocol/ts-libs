import { erc721Abi, getAddress, parseAbiItem, } from 'viem';
const ERC721_TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)');
/**
 * 특정 NFT 컬렉션의 지정된 tokenId 범위(start~end)에 대해 ownerOf 호출 후 DB에 저장
 */
async function fetchAndStoreNftOwnershipRange(env, client, nftAddress, start, end) {
    const promises = [];
    for (let tokenId = start; tokenId <= end; tokenId++) {
        const promise = ((async () => {
            const owner = await client.readContract({
                address: nftAddress,
                abi: erc721Abi,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)],
            });
            await env.DB.prepare(`INSERT OR REPLACE INTO nfts (nft_address, token_id, holder) VALUES (?, ?, ?)`).bind(nftAddress, tokenId, owner).run();
        })());
        promises.push(promise);
    }
    await Promise.all(promises);
}
/**
 * Transfer 이벤트 기반으로 소유자 업데이트
 */
async function syncNftOwnershipFromEvents(env, client, tokenRanges, blockStep) {
    const statusRow = await env.DB.prepare(`SELECT last_synced_block_number FROM contract_event_sync_status WHERE contract_type = ?`)
        .bind('ERC721')
        .first();
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
        address: Object.keys(tokenRanges),
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
        await env.DB.prepare(`INSERT OR REPLACE INTO nfts (nft_address, token_id, holder) VALUES (?, ?, ?)`).bind(nftAddress, tokenId, to).run();
    }
    await env.DB.prepare(`UPDATE contract_event_sync_status
     SET last_synced_block_number = ?, last_synced_at = strftime('%s','now')
     WHERE contract_type = ?`).bind(Number(toBlock), 'ERC721').run();
}
export { fetchAndStoreNftOwnershipRange, syncNftOwnershipFromEvents };
//# sourceMappingURL=nft-ownership-sync.js.map