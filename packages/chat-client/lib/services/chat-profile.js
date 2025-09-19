import { tokenManager } from '@gaiaprotocol/client-common';
import { getAddress } from 'viem';
const TTL = 10 * 60 * 1000; // 10분
class ChatProfileService extends EventTarget {
    #cache = new Map();
    #inflight = new Set();
    #fetchFn = null;
    init(fetchFn) {
        this.#fetchFn = fetchFn;
    }
    async preload(accounts) {
        const toFetch = accounts
            .map(a => getAddress(a))
            .filter(a => this.#needsRefresh(a));
        if (toFetch.length)
            await this.#fetchBatch(toFetch);
    }
    async resolve(account) {
        const addr = getAddress(account);
        if (this.#needsRefresh(addr))
            await this.#fetchBatch([addr]);
        return this.#cache.get(addr);
    }
    getCached(account) {
        return this.#cache.get(getAddress(account));
    }
    setProfile(account, nickname, profileImage) {
        const addr = getAddress(account);
        const prev = this.#cache.get(addr);
        this.#cache.set(addr, {
            nickname,
            profileImage,
            fetchedAt: Date.now()
        });
        this.#emitIfChanged(addr, prev, { nickname, profileImage });
    }
    #needsRefresh(addr) {
        const entry = this.#cache.get(getAddress(addr));
        return !entry || Date.now() - entry.fetchedAt > TTL;
    }
    async #fetchBatch(addresses) {
        if (!this.#fetchFn)
            throw new Error('chatProfileService not initialized with fetch function');
        const targets = addresses.filter(a => {
            if (this.#inflight.has(a))
                return false;
            if (!this.#needsRefresh(a))
                return false;
            return true;
        });
        if (!targets.length)
            return;
        targets.forEach(a => this.#inflight.add(a));
        try {
            const results = await this.#fetchFn(targets);
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
        }
        finally {
            targets.forEach(a => this.#inflight.delete(a));
        }
    }
    #emitIfChanged(addr, prev, next) {
        if (prev?.nickname !== next?.nickname ||
            prev?.profileImage !== next?.profileImage) {
            this.dispatchEvent(new CustomEvent('chatprofilechange', { detail: { account: addr, profile: next } }));
            if (addr === tokenManager.getAddress()) {
                this.dispatchEvent(new Event('mychatprofilechange'));
            }
        }
    }
}
export const chatProfileService = new ChatProfileService();
//# sourceMappingURL=chat-profile.js.map