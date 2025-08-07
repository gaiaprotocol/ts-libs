export interface NftItem {
  tokenId: string;             // 토큰 ID
  contractAddress: string;     // NFT 컨트랙트 주소
  name?: string;               // NFT 이름 (옵션)
  description?: string;        // 설명 (옵션)
  image?: string;              // 이미지 URL (옵션)
  metadataUri?: string;        // 원본 메타데이터 URI (옵션)
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;                          // traits (옵션)
}
