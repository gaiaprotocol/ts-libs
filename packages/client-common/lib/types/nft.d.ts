export interface NftItem {
    tokenId: string;
    contractAddress: string;
    name?: string;
    description?: string;
    image?: string;
    metadataUri?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}
//# sourceMappingURL=nft.d.ts.map