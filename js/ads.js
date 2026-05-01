/**
 * Ad manager — non-intrusive AdMob integration.
 *
 * Strategy:
 *   - Banner: bottom of secondary tabs only (calendar, analytics, watchlist, mistakes, macro, help).
 *             Hidden on Today, Trades, Patterns, Pre-market, Review (high-focus tabs).
 *   - Interstitial: cold-start only, frequency-capped to 1 per 2 hours, never shown in first 60s,
 *                   never shown if user is mid-task.
 *   - Rewarded: opt-in only — user taps a button to "watch ad to unlock X".
 *
 * Web fallback: in browser the AdMob SDK isn't present, so we silently no-op.
 * On Android (Capacitor), the @capacitor-community/admob plugin handles native ads.
 *
 * Ad unit IDs below are GOOGLE TEST IDs — replace before production launch.
 *   See: https://developers.google.com/admob/android/test-ads
 */
window.Ads = (function () {
  // ===== Configuration =====
  const TEST_IDS = {
    appId: 'ca-app-pub-3940256099942544~3347511713',
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917'
  };
  // Production AdMob IDs — Jora Nagra / EdgeBook (publisher 7067114010918613).
  // These are used at runtime ONLY when Ads.init() is called with useTestAds:false.
  // During dev keep useTestAds:true (in js/app.js) so we don't generate fraudulent
  // impressions on our own account — Google bans accounts for that.
  const PROD_IDS = {
    appId:        'ca-app-pub-7067114010918613~7901474698',
    banner:       'ca-app-pub-7067114010918613/1502527815',
    interstitial: 'ca-app-pub-7067114010918613/4712204574',
    rewarded:     'ca-app-pub-7067114010918613/1868306973'
  };

  const BANNER_TABS = new Set(['calendar', 'analytics', 'watchlist', 'mistakes', 'macro', 'help']);
  const INTERSTITIAL_MIN_GAP_MS = 2 * 60 * 60 * 1000;       // 2 hours
  const INTERSTITIAL_FIRST_DELAY_MS = 60 * 1000;             // 60s after first launch
  const STORAGE_KEY = 'eb_ads_state';

  // ===== Internal state =====
  let isNative = false;
  let admob = null;
  let initialized = false;
  let bannerVisible = false;
  let useTestAds = true;            // toggled to false in production builds
  let firstLaunchAt = Date.now();
  let interstitialReady = false;

  function ids() { return useTestAds ? TEST_IDS : PROD_IDS; }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveState(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }

  // ===== Init =====
  async function init(opts) {
    opts = opts || {};
    useTestAds = opts.useTestAds !== false;       // default true; pass false in production build
    isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

    const state = loadState();
    firstLaunchAt = state.firstLaunchAt || Date.now();
    if (!state.firstLaunchAt) saveState(Object.assign(state, { firstLaunchAt }));

    if (!isNative) {
      console.info('[Ads] Web environment — AdMob disabled, web banner placeholder used.');
      initialized = true;
      return;
    }

    try {
      // Capacitor AdMob plugin (community).
      // npm: @capacitor-community/admob
      const mod = await import('@capacitor-community/admob');
      admob = mod.AdMob;
      await admob.initialize({
        requestTrackingAuthorization: true,
        testingDevices: [],
        initializeForTesting: useTestAds
      });
      initialized = true;
      console.info('[Ads] AdMob initialized.');
      preloadInterstitial();
    } catch (e) {
      console.warn('[Ads] AdMob init failed — running without ads.', e);
    }
  }

  // ===== Banner =====
  async function showBannerForTab(tabId) {
    if (!initialized) return;
    const shouldShow = BANNER_TABS.has(tabId);
    if (shouldShow) await showBanner();
    else await hideBanner();
  }

  async function showBanner() {
    if (bannerVisible) return;
    if (!isNative || !admob) {
      // Web placeholder — render a subtle "Ad" placeholder bar so layout is consistent in dev
      paintWebPlaceholder(true);
      bannerVisible = true;
      return;
    }
    try {
      await admob.showBanner({
        adId: ids().banner,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: useTestAds
      });
      bannerVisible = true;
    } catch (e) { console.warn('[Ads] banner show failed', e); }
  }

  async function hideBanner() {
    if (!bannerVisible) return;
    if (!isNative || !admob) {
      paintWebPlaceholder(false);
      bannerVisible = false;
      return;
    }
    try { await admob.hideBanner(); } catch (e) {}
    bannerVisible = false;
  }

  function paintWebPlaceholder(show) {
    let el = document.getElementById('ad-banner-web');
    if (!show) { if (el) el.remove(); return; }
    if (el) return;
    el = document.createElement('div');
    el.id = 'ad-banner-web';
    el.className = 'ad-banner-web';
    el.innerHTML = '<span>Ad placeholder · banner shows on device</span>';
    document.body.appendChild(el);
  }

  // ===== Interstitial =====
  async function preloadInterstitial() {
    if (!isNative || !admob) return;
    try {
      await admob.prepareInterstitial({ adId: ids().interstitial, isTesting: useTestAds });
      interstitialReady = true;
    } catch (e) { console.warn('[Ads] interstitial preload failed', e); }
  }

  async function maybeShowColdStartInterstitial() {
    if (!initialized) return;
    const sinceFirst = Date.now() - firstLaunchAt;
    if (sinceFirst < INTERSTITIAL_FIRST_DELAY_MS) return;     // never on first 60s of first install
    const state = loadState();
    const lastShown = state.lastInterstitialAt || 0;
    if (Date.now() - lastShown < INTERSTITIAL_MIN_GAP_MS) return;

    if (!isNative || !admob) {
      console.info('[Ads] (web) would show cold-start interstitial here.');
      return;
    }
    if (!interstitialReady) return;
    try {
      await admob.showInterstitial();
      saveState(Object.assign(state, { lastInterstitialAt: Date.now() }));
      interstitialReady = false;
      preloadInterstitial();
    } catch (e) { console.warn('[Ads] interstitial show failed', e); }
  }

  // ===== Rewarded =====
  async function showRewarded() {
    if (!isNative || !admob) {
      console.info('[Ads] (web) would show rewarded ad — granting reward.');
      return { rewarded: true, web: true };
    }
    try {
      await admob.prepareRewardVideoAd({ adId: ids().rewarded, isTesting: useTestAds });
      const result = await admob.showRewardVideoAd();
      return { rewarded: !!result };
    } catch (e) {
      console.warn('[Ads] rewarded show failed', e);
      return { rewarded: false, error: e };
    }
  }

  return {
    init,
    showBannerForTab,
    hideBanner,
    maybeShowColdStartInterstitial,
    showRewarded
  };
})();
