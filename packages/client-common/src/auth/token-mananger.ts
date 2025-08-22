import { EventEmitter } from '@webtaku/event-emitter';
import { getAddress } from 'viem';

/** Storage 인터페이스(필요한 부분만) */
type BasicStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type SafeStorage = BasicStorage & {
  /** 실제 localStorage 사용 여부 */
  persistent: boolean;
};

/** localStorage를 안전하게 감싼 뒤, 실패하면 메모리 스토리지로 폴백 */
function createSafeStorage(): SafeStorage {
  // 메모리 폴백
  const memory = (() => {
    const m = new Map<string, string>();
    const api: SafeStorage = {
      persistent: false,
      getItem: (k) => (m.has(k) ? m.get(k)! : null),
      setItem: (k, v) => { m.set(k, String(v)); },
      removeItem: (k) => { m.delete(k); },
    };
    return api;
  })();

  // 브라우저 환경이 아니면 메모리 사용
  if (typeof window === 'undefined') return memory;

  // 접근 자체가 throw 될 수 있으므로 try로 감쌉니다.
  try {
    const ls = window.localStorage; // 이 줄에서 SecurityError 가능
    // 쓰기 가능 여부 테스트
    const probeKey = '__safe_ls_probe__' + Math.random().toString(36).slice(2);
    ls.setItem(probeKey, '1');
    ls.removeItem(probeKey);

    // 정상 사용 가능
    const safe: SafeStorage = {
      persistent: true,
      getItem: (k) => ls.getItem(k),
      setItem: (k, v) => ls.setItem(k, v),
      removeItem: (k) => ls.removeItem(k),
    };
    return safe;
  } catch {
    // SecurityError, QuotaExceededError(사파리 프라이빗 모드) 등 모두 폴백
    return memory;
  }
}

class TokenManager extends EventEmitter<{
  signedIn: (address: string) => void;
  signedOut: () => void;
}> {
  readonly TOKEN_KEY = 'token';
  readonly ADDRESS_KEY = 'token_address';
  private storage: SafeStorage;

  constructor(storage: SafeStorage = createSafeStorage()) {
    super();
    this.storage = storage;
  }

  /** 현재 스토리지가 지속(persistent)인지 노출(디버깅/로깅 용도) */
  isPersistentStorage(): boolean {
    return this.storage.persistent;
  }

  set(token: string, address: `0x${string}`) {
    const addr = getAddress(address);
    try {
      this.storage.setItem(this.TOKEN_KEY, token);
      this.storage.setItem(this.ADDRESS_KEY, addr);
      this.emit('signedIn', addr);
    } catch {
      // 이 레벨에서조차 실패하면 아무것도 저장하지 않고 silent fail
      // 필요하면 여기서 추가 로깅/알림 처리 가능
    }
  }

  getToken(): string | undefined {
    try {
      return this.storage.getItem(this.TOKEN_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  }

  getAddress(): `0x${string}` | undefined {
    try {
      // 타입 단언은 동일하게 유지
      return (this.storage.getItem(this.ADDRESS_KEY) as `0x${string}`) ?? undefined;
    } catch {
      return undefined;
    }
  }

  clear() {
    try {
      this.storage.removeItem(this.TOKEN_KEY);
      this.storage.removeItem(this.ADDRESS_KEY);
    } finally {
      // 저장소에 무엇이 일어났든, 상태 상으로는 signedOut 이벤트를 내보내는 편이 UX에 좋음
      this.emit('signedOut');
    }
  }

  has(): boolean {
    return !!this.getToken();
  }

  isMatchedWith(currentAddress: `0x${string}`): boolean {
    const saved = this.getAddress();
    try {
      return saved !== undefined && saved === getAddress(currentAddress);
    } catch {
      // currentAddress가 형식 불일치 등으로 예외 시 false
      return false;
    }
  }
}

const tokenManager = new TokenManager();

export { tokenManager };
