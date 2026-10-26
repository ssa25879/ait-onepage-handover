export const USER_IDENTITY_STORAGE_KEY = 'ingye-hanjang:user-identity:v1';

interface UserIdentityAdapter {
  getAnonymousKey(): Promise<{ type: string; hash: string }>;
  setItem(key: string, value: string): Promise<void>;
}

export function createUserIdentityInitializer(adapter: UserIdentityAdapter): () => Promise<boolean> {
  let initialization: Promise<boolean> | undefined;
  return () => {
    initialization ??= (async () => {
      try {
        const result = await adapter.getAnonymousKey();
        if (result.type !== 'HASH' || !result.hash.trim()) return false;
        await adapter.setItem(USER_IDENTITY_STORAGE_KEY, result.hash);
        return true;
      } catch {
        // 미지원 환경이나 조회·저장 실패가 기존 로컬 기록 이용을 막지 않아요.
        return false;
      }
    })();
    return initialization;
  };
}

export const initializeUserIdentity = createUserIdentityInitializer({
  async getAnonymousKey() {
    const { User } = await import('@apps-in-toss/web-framework');
    return User.getAnonymousKey();
  },
  async setItem(key, value) {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.setItem(key, value);
  },
});
