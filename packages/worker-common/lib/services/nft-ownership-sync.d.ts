import { D1Database } from '@cloudflare/workers-types';
import { PublicClient } from 'viem';
type TokenRange = {
    start: number;
    end: number;
};
type TokenRangeMap = Record<string, TokenRange>;
/**
 * 특정 NFT 컬렉션의 지정된 tokenId 범위(start~end)에 대해 ownerOf 호출 후 DB에 저장
 * - 메타데이터(type/gender/parts/image)는 건드리지 않고 holder만 갱신
 */
declare function fetchAndStoreNftOwnershipRange(env: {
    DB: D1Database;
}, client: PublicClient, nftAddress: string, start: number, end: number): Promise<void>;
/**
 * Transfer 이벤트 기반으로 소유자 업데이트
 * - 지정된 tokenRanges에 해당하는 토큰만 반영
 * - 메타데이터 필드는 유지하고 holder만 갱신
 * - 블록 범위 계산을 last+1 ~ last+step 로 단순화
 */
declare function syncNftOwnershipFromEvents(env: {
    DB: D1Database;
}, client: PublicClient, tokenRanges: TokenRangeMap, blockStep: number): Promise<void>;
export { fetchAndStoreNftOwnershipRange, syncNftOwnershipFromEvents };
//# sourceMappingURL=nft-ownership-sync.d.ts.map