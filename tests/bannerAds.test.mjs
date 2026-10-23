import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createBannerAdController,
  isHistoryBannerNeeded,
  resolveBannerAdGroupId,
} from '../src/lib/bannerAds.ts';

function createSdk({ supported = true, initializeError = false, delayInitialization = false } = {}) {
  const calls = { initialize: 0, attach: 0, destroy: 0 };
  let initCallbacks;
  let slotCallbacks;
  const initialize = (options) => {
    calls.initialize += 1;
    initCallbacks = options.callbacks;
    if (!delayInitialization) {
      if (initializeError) initCallbacks.onInitializationFailed(new Error('init failed'));
      else initCallbacks.onInitialized();
    }
  };
  initialize.isSupported = () => supported;
  const attachBanner = (_groupId, _target, options) => {
    calls.attach += 1;
    slotCallbacks = options.callbacks;
    return { destroy: () => { calls.destroy += 1; } };
  };
  attachBanner.isSupported = () => supported;
  return {
    calls,
    get initCallbacks() { return initCallbacks; },
    get slotCallbacks() { return slotCallbacks; },
    sdk: { initialize, attachBanner },
  };
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('shows a banner only when existing records already make the content scroll', () => {
  assert.equal(isHistoryBannerNeeded(0, 1200, 800, 80), false);
  assert.equal(isHistoryBannerNeeded(3, 620, 800, 80), false);
  assert.equal(isHistoryBannerNeeded(20, 920, 800, 80), true);
  assert.equal(isHistoryBannerNeeded(20, 920, 1100, 80), false);
  assert.equal(isHistoryBannerNeeded(3, 620, 800, 80), false);
});

test('uses a test group in development and hides production ads without an operations group', () => {
  assert.equal(resolveBannerAdGroupId('development'), 'ait-ad-test-banner-id');
  assert.equal(resolveBannerAdGroupId('production'), null);
  assert.equal(resolveBannerAdGroupId('production', 'live-group'), 'live-group');
});

test('initializes at most once when multiple screens request an ad', async () => {
  const mock = createSdk();
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');

  assert.deepEqual(await Promise.all([controller.initialize(), controller.initialize()]), [true, true]);
  assert.equal(mock.calls.initialize, 1);
});

test('keeps the ad unavailable when no group ID or SDK support exists', async () => {
  const noGroupMock = createSdk();
  const noGroup = createBannerAdController(async () => noGroupMock.sdk, null);
  assert.equal(await noGroup.initialize(), false);
  assert.equal(noGroupMock.calls.initialize, 0);

  const unsupportedMock = createSdk({ supported: false });
  const unsupported = createBannerAdController(async () => unsupportedMock.sdk, 'test-group');
  assert.equal(await unsupported.initialize(), false);
  assert.equal(unsupportedMock.calls.initialize, 0);
});

test('isolates initialization failure and keeps the core screen usable', async () => {
  const mock = createSdk({ initializeError: true });
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');
  let unavailable = 0;
  controller.attach({}, { onUnavailable: () => { unavailable += 1; } });

  await tick();
  assert.equal(await controller.initialize(), false);
  assert.equal(mock.calls.attach, 0);
  assert.equal(unavailable, 1);
});

test('does not attach after cleanup while initialization is still pending', async () => {
  const mock = createSdk({ delayInitialization: true });
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');
  const cleanup = controller.attach({});
  await tick();
  cleanup();
  mock.initCallbacks.onInitialized();
  await tick();

  assert.equal(mock.calls.initialize, 1);
  assert.equal(mock.calls.attach, 0);
});

test('handles StrictMode setup and cleanup without duplicate banner instances', async () => {
  const mock = createSdk();
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');
  const firstCleanup = controller.attach({});
  firstCleanup();
  const secondCleanup = controller.attach({});
  await tick();

  assert.equal(mock.calls.initialize, 1);
  assert.equal(mock.calls.attach, 1);
  secondCleanup();
  assert.equal(mock.calls.destroy, 1);
});

test('destroys a rendered banner on unmount and ignores late callbacks', async () => {
  const mock = createSdk();
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');
  let visible = 0;
  let unavailable = 0;
  const cleanup = controller.attach({}, {
    onVisible: () => { visible += 1; },
    onUnavailable: () => { unavailable += 1; },
  });
  await tick();
  mock.slotCallbacks.onAdRendered({});
  cleanup();
  mock.slotCallbacks.onNoFill({});

  assert.equal(mock.calls.attach, 1);
  assert.equal(mock.calls.destroy, 1);
  assert.equal(visible, 1);
  assert.equal(unavailable, 0);
});

test('removes a slot after no fill and never keeps a failed banner visible', async () => {
  const mock = createSdk();
  const controller = createBannerAdController(async () => mock.sdk, 'test-group');
  let visible = 0;
  let unavailable = 0;
  controller.attach({}, {
    onVisible: () => { visible += 1; },
    onUnavailable: () => { unavailable += 1; },
  });
  await tick();
  mock.slotCallbacks.onAdRendered({});
  mock.slotCallbacks.onNoFill({});

  assert.equal(visible, 1);
  assert.equal(unavailable, 1);
  assert.equal(mock.calls.destroy, 1);
});
