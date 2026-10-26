import { TEST_BANNER_AD_GROUP_ID } from './testAdGroup.ts';

export interface BannerAdListeners {
  onVisible?: () => void;
  onUnavailable?: () => void;
}

type BannerSdk = typeof import('@apps-in-toss/web-framework')['TossAds'];

export interface BannerAdController {
  initialize: () => Promise<boolean>;
  attach: (target: HTMLElement, listeners?: BannerAdListeners) => () => void;
}

export function isHistoryBannerNeeded(
  recordCount: number,
  contentHeight: number,
  viewportHeight: number,
  surroundingHeight: number,
): boolean {
  return recordCount > 0 && contentHeight + surroundingHeight > viewportHeight;
}

export function resolveBannerAdGroupId(
  environment: 'development' | 'production',
  operationGroupId?: string | null,
  testGroupId?: string | null,
): string | null {
  if (environment === 'development') return testGroupId ?? null;
  return operationGroupId?.trim() || null;
}

export function createBannerAdController(
  loadSdk: () => Promise<BannerSdk>,
  groupId: string | null,
): BannerAdController {
  let sdkPromise: Promise<BannerSdk> | undefined;
  let initialization: Promise<boolean> | undefined;

  function getSdk(): Promise<BannerSdk> {
    sdkPromise ??= loadSdk();
    return sdkPromise;
  }

  function initialize(): Promise<boolean> {
    if (!groupId) return Promise.resolve(false);
    if (initialization) return initialization;

    initialization = getSdk().then((sdk) => new Promise<boolean>((resolve) => {
      if (!sdk.initialize.isSupported() || !sdk.attachBanner.isSupported()) {
        resolve(false);
        return;
      }

      let settled = false;
      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      try {
        sdk.initialize({
          callbacks: {
            onInitialized: () => finish(true),
            onInitializationFailed: () => finish(false),
          },
        });
      } catch {
        finish(false);
      }
    })).catch(() => false);

    return initialization;
  }

  function attach(target: HTMLElement, listeners: BannerAdListeners = {}): () => void {
    let disposed = false;
    let unavailable = false;
    let slot: ReturnType<BannerSdk['attachBanner']> | undefined;
    let destroyed = false;

    function destroySlot() {
      if (!slot || destroyed) return;
      destroyed = true;
      try {
        slot.destroy();
      } catch {
        // 슬롯 정리 오류도 핵심 기록 흐름에는 영향을 주지 않아요.
      }
    }

    function reportUnavailable() {
      if (disposed || unavailable) return;
      unavailable = true;
      destroySlot();
      listeners.onUnavailable?.();
    }

    void initialize().then(async (ready) => {
      if (disposed) return;
      if (!ready) {
        reportUnavailable();
        return;
      }

      try {
        const sdk = await getSdk();
        if (disposed) return;
        const nextSlot = sdk.attachBanner(groupId!, target, {
          theme: 'light',
          tone: 'grey',
          variant: 'card',
          callbacks: {
            onAdRendered: () => {
              if (!disposed && !unavailable) listeners.onVisible?.();
            },
            onAdFailedToRender: reportUnavailable,
            onNoFill: reportUnavailable,
          },
        });

        if (disposed || unavailable) {
          try {
            nextSlot.destroy();
          } catch {
            // 슬롯 정리 오류는 광고 없이 계속 진행해요.
          }
        } else {
          slot = nextSlot;
        }
      } catch {
        reportUnavailable();
      }
    }).catch(reportUnavailable);

    return () => {
      disposed = true;
      destroySlot();
    };
  }

  return { initialize, attach };
}

export const bannerAdGroupId = resolveBannerAdGroupId(
  import.meta.env?.DEV ? 'development' : 'production',
  import.meta.env?.VITE_TOSS_AD_GROUP_ID,
  import.meta.env?.DEV ? TEST_BANNER_AD_GROUP_ID : null,
);

const platformBannerController = createBannerAdController(
  async () => (await import('@apps-in-toss/web-framework')).TossAds,
  bannerAdGroupId,
);

export const initializeBannerAds = platformBannerController.initialize;
export const attachBannerAd = platformBannerController.attach;
