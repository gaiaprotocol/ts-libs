/** 채팅에 사용되는 프로필 구조 */
export type ChatProfile = {
    nickname?: string | null;
    profileImage?: string | null;
    fetchedAt: number;
};
type ChatProfileBatchFetcher = (accounts: (`0x${string}`)[]) => Promise<Record<`0x${string}`, {
    nickname?: string | null;
    profileImage?: string | null;
} | null>>;
declare class ChatProfileService extends EventTarget {
    #private;
    init(fetchFn: ChatProfileBatchFetcher): void;
    preload(accounts: string[]): Promise<void>;
    resolve(account: string): Promise<ChatProfile | undefined>;
    getCached(account: string): ChatProfile | undefined;
    setProfile(account: string, nickname?: string, profileImage?: string): void;
}
export declare const chatProfileService: ChatProfileService;
export {};
//# sourceMappingURL=chat-profile.d.ts.map