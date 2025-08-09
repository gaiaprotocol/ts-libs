import { tokenManager } from '@gaiaprotocol/client-common';
import { getAddress } from 'viem';

/** 채팅에 사용되는 프로필 구조 */
export type ChatProfile = {
  nickname?: string | null;
  profileImage?: string | null;
  fetchedAt: number;
};

type ChatProfileBatchFetcher = (
  accounts: (`0x${string}`)[]
) => Promise<Record<`0x${string}`, { nickname?: string | null; profileImage?: string | null } | null>>;

const TTL = 10 * 60 * 1000; // 10분

class ChatProfileService extends EventTarget {
  #cache = new Map<string, ChatProfile>();
  #inflight = new Set<string>();
  #fetchFn: ChatProfileBatchFetcher | null = null;

  init(fetchFn: ChatProfileBatchFetcher) {
    this.#fetchFn = fetchFn;
  }

  async preload(accounts: string[]) {
    const toFetch = accounts
      .map(a => getAddress(a))
      .filter(a => this.#needsRefresh(a));
    if (toFetch.length) await this.#fetchBatch(toFetch);
  }

  async resolve(account: string): Promise<ChatProfile | undefined> {
    const addr = getAddress(account);
    if (this.#needsRefresh(addr)) await this.#fetchBatch([addr]);
    return this.#cache.get(addr);
  }

  getCached(account: string): ChatProfile | undefined {
    return this.#cache.get(getAddress(account));
  }

  setProfile(account: string, nickname?: string, profileImage?: string) {
    const addr = getAddress(account);
    const prev = this.#cache.get(addr);

    this.#cache.set(addr, {
      nickname,
      profileImage,
      fetchedAt: Date.now()
    });

    this.#emitIfChanged(addr, prev, { nickname, profileImage });
  }

  #needsRefresh(addr: string) {
    const entry = this.#cache.get(getAddress(addr));
    return !entry || Date.now() - entry.fetchedAt > TTL;
  }

  async #fetchBatch(addresses: string[]) {
    if (!this.#fetchFn) throw new Error('chatProfileService not initialized with fetch function');

    const targets = addresses.filter(a => {
      if (this.#inflight.has(a)) return false;
      if (!this.#needsRefresh(a)) return false;
      return true;
    });

    if (!targets.length) return;

    targets.forEach(a => this.#inflight.add(a));

    try {
      const results = await this.#fetchFn(targets as `0x${string}`[]);

      for (const addr of targets) {
        const profile = results[getAddress(addr)] ?? null;
        const prev = this.#cache.get(addr);

        this.#cache.set(addr, {
          nickname: profile?.nickname ?? null,
          profileImage: profile?.profileImage ?? null,
          fetchedAt: Date.now()
        });

        this.#emitIfChanged(addr, prev, profile);
      }
    } finally {
      targets.forEach(a => this.#inflight.delete(a));
    }
  }

  #emitIfChanged(
    addr: string,
    prev?: ChatProfile,
    next?: { nickname?: string | null; profileImage?: string | null } | null
  ) {
    if (
      prev?.nickname !== next?.nickname ||
      prev?.profileImage !== next?.profileImage
    ) {
      this.dispatchEvent(
        new CustomEvent('chatprofilechange', { detail: { account: addr, profile: next } })
      );
      if (addr === tokenManager.getAddress()) {
        this.dispatchEvent(new Event('mychatprofilechange'));
      }
    }
  }
}

export const chatProfileService = new ChatProfileService();
