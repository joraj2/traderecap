# TradeRecap — Launch Walkthrough

The single source of truth for getting TradeRecap from "code on disk" → "live on Play Store."

Each phase lists: **who does it** (you/me/either), **time**, **what's needed**, and which detail doc to read. Tick items as you go.

> 🚦 **You are here:** end of Phase 0. Phase 1 starts when you reply to me.

---

## Phase 0 — Build (DONE ✅)

The app is built and committed locally. 3 commits on `main`:
- `b23876f` Add app-ads.txt + name developer in privacy policy
- `c39ae8f` Add AdMob signup walkthrough
- `01c16c0` Initial commit — TradeRecap v1.0.0

What's already done: 11 tabs, mobile-first responsive, Capacitor config, AdMob scaffolding (test IDs), help/FAQ, privacy policy, Play Store listing copy, build instructions, app icon SVG, app-ads.txt with your AdSense pub ID, gh CLI installed.

---

## Phase 1 — GitHub + privacy hosting (~10 min) — **next**

**Why:** Play Store requires a public privacy policy URL before you can submit. GitHub Pages is free + fast.

| Step | Who | What |
|---|---|---|
| 1.1 | **You** | Either run `gh auth login` in a fresh PowerShell, **or** generate a fine-grained PAT at https://github.com/settings/tokens?type=beta (scopes: Administration r/w, Contents r/w, Pages r/w) and paste it to me |
| 1.2 | **Me** | Create `https://github.com/joraj2/traderecap` (public), push 3 commits |
| 1.3 | **Me** | Enable GitHub Pages on `main` branch, root path |
| 1.4 | **Me** | Verify `https://joraj2.github.io/traderecap/PRIVACY.md` and `https://joraj2.github.io/traderecap/app-ads.txt` resolve |
| 1.5 | **Me** | Reply with the live URLs you'll paste into Play Console |

**Outcome:** repo public, privacy policy + app-ads.txt hosted at stable URLs.

---

## Phase 2 — AdMob signup (~15 min) — **next, parallel with Phase 1**

**Why:** Without real ad unit IDs, you can't ship to production (test ads in production = AdMob ban).

| Step | Who | What |
|---|---|---|
| 2.1 | **You** | Sign in at https://admob.google.com with the Google account that has AdSense `pub-7067114010918613` |
| 2.2 | **You** | Apps → Add app → Android → Not on store yet → Name: TradeRecap → save the **App ID** |
| 2.3 | **You** | Create 3 ad units: Banner (Adaptive), Interstitial, Rewarded → save all 3 IDs |
| 2.4 | **You** | Paste 4 IDs in this format:<br>`APP_ID: ca-app-pub-...~...`<br>`BANNER_ID: ca-app-pub-.../...`<br>`INTERSTITIAL_ID: ca-app-pub-.../...`<br>`REWARDED_ID: ca-app-pub-.../...` |
| 2.5 | **Me** | Patch `js/ads.js` PROD_IDS, `capacitor.config.json`, `android/app/src/main/AndroidManifest.xml`, flip `useTestAds: false` in `js/app.js` — single commit |

**Defer to launch +1 week:** payments setup, GDPR/CCPA consent banners — see [ADMOB_WALKTHROUGH.md §5–6](ADMOB_WALKTHROUGH.md#step-5--set-up-payments).

**Outcome:** code references real ad units; app is ready to monetize.

---

## Phase 3 — Local Android build environment (~60 min, one-time)

**Why:** Capacitor wraps the web app into an Android project that Android Studio compiles into an `.aab` file Play Store accepts.

| Step | Who | What |
|---|---|---|
| 3.1 | **You** | Install **Node 20 LTS** from https://nodejs.org (verify: `node -v`) |
| 3.2 | **You** | Install **JDK 17 Temurin** from https://adoptium.net (NOT JDK 21 — Gradle conflict). Set `JAVA_HOME` env var |
| 3.3 | **You** | Install **Android Studio** from https://developer.android.com/studio (~5 GB) |
| 3.4 | **You** | Open Android Studio once → SDK Manager → install Android 14 (API 34) + Build-Tools 34.x + Platform-Tools + Cmdline-Tools |
| 3.5 | **You** | Set `ANDROID_HOME` env var (PowerShell: `[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')`) |
| 3.6 | **You** | Restart terminal — verify `java -version` shows 17, `adb --version` works |

Detail: [BUILD_INSTRUCTIONS.md §0](BUILD_INSTRUCTIONS.md#0-prerequisites-1-hour-one-time-setup).

**Outcome:** machine can compile Android APKs.

---

## Phase 4 — Capacitor wrap (~10 min, one-time)

| Step | Who | What |
|---|---|---|
| 4.1 | **You** (or me with permission) | `cd c:/Users/joran/Documents/Claude/trading-dashboard && npm install` |
| 4.2 | **You** (or me) | `npm run build:web` (creates `dist/`) |
| 4.3 | **You** (or me) | `npx cap add android` (creates `android/` Gradle project) |
| 4.4 | **You** (or me) | `npm run cap:sync` (copies `dist/` → `android/app/src/main/assets/public`) |
| 4.5 | **Me** | Add the AdMob meta-data line to `android/app/src/main/AndroidManifest.xml` |
| 4.6 | **Me** | Commit the new `android/` directory |

**Outcome:** Android Studio project ready to build.

---

## Phase 5 — First debug build + device test (~30 min)

| Step | Who | What |
|---|---|---|
| 5.1 | **You** | Plug your Android phone in via USB → enable Developer Options + USB Debugging in Settings |
| 5.2 | **You** | `adb devices` — should list your phone |
| 5.3 | **You** | `npx cap run android` — installs and launches the debug build |
| 5.4 | **You** | Manually test: add a trade, navigate all 11 tabs, verify ads appear on secondary tabs only, verify FAB, swipe gestures, modals, export/import, help search |
| 5.5 | **You** | Report any bugs — we'll patch and re-sync |

**Outcome:** confirmed working app on real hardware.

---

## Phase 6 — Signing keystore + production build (~20 min, one-time)

⚠️ **Critical:** lose the keystore = you can NEVER update the app on Play Store again. Back up to a password manager.

| Step | Who | What |
|---|---|---|
| 6.1 | **You** | Run `keytool -genkeypair -v -keystore traderecap-release.jks -alias traderecap -keyalg RSA -keysize 2048 -validity 10000` → set + remember 2 passwords |
| 6.2 | **You** | Save the `.jks` file + passwords in your password manager (1Password, Bitwarden, etc.) |
| 6.3 | **Me** | Add signing config to `android/app/build.gradle` (referenced via `android/key.properties` which is gitignored) |
| 6.4 | **You** | Create `android/key.properties` with the keystore password values (do NOT commit) |
| 6.5 | **You** | `npm run android:release` — produces `android/app/build/outputs/bundle/release/app-release.aab` |

Detail: [BUILD_INSTRUCTIONS.md §5–6](BUILD_INSTRUCTIONS.md#5-generate-a-signing-key-one-time).

**Outcome:** signed `.aab` ready to upload to Play Console.

---

## Phase 7 — App assets (~2 hours)

| Asset | Source | Spec |
|---|---|---|
| **App icon (1024×1024 PNG)** | Convert `assets/icon-source.svg` via Inkscape or online SVG→PNG converter | required |
| **Adaptive icon foreground/background** | Run `npx capacitor-assets generate --android` after placing `icon.png` at root | required |
| **Splash screen (2732×2732 PNG)** | Centered TradeRecap logo on `#0a0d0c` background | required |
| **Feature graphic (1024×500 PNG)** | Banner with TradeRecap + tagline; use Canva or Figma | required |
| **8 phone screenshots (1080×1920 PNG)** | Capture from emulator or your phone w/ sample data — see [PLAY_STORE_LISTING.md screenshot plan](PLAY_STORE_LISTING.md#screenshot-plan-8-frames) | min 2, max 8 |

**Tip for screenshots:** populate sample data first (10–15 trades across a month), then capture. Empty screenshots look unprofessional and lower install rates.

**Outcome:** all visual assets ready for Play Console upload.

---

## Phase 8 — Play Console setup (~90 min)

| Step | Who | What |
|---|---|---|
| 8.1 | **You** | Pay $25 USD one-time at https://play.google.com/console + identity verification (passport/driver license) |
| 8.2 | **You** | Create app: name "TradeRecap", default language en-US, App, Free, declarations all ticked |
| 8.3 | **You** | Dashboard → complete every section: privacy policy URL (`https://joraj2.github.io/traderecap/PRIVACY.md`), App access, Ads = Yes, Content rating, Target audience 18+, News No, COVID No, Data safety form (paste from [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md#data-safety-form)), Government No, Financial features No |
| 8.4 | **You** | Store listing: paste short + long description from [PLAY_STORE_LISTING.md](PLAY_STORE_LISTING.md#full-description-max-4000-chars), upload icon + feature graphic + 8 screenshots |
| 8.5 | **You** | Pricing & distribution: Free, Contains ads = Yes, NZ + AU + US + UK + CA initially |

**Outcome:** Play Console "ready for release" — all green ticks on the dashboard.

---

## Phase 9 — Internal testing track (~1 hour)

**Why:** Sanity check the install on your own phone before exposing to testers.

| Step | Who | What |
|---|---|---|
| 9.1 | **You** | Play Console → Testing → Internal testing → Create new release → Upload `app-release.aab` |
| 9.2 | **You** | Add yourself + 2–3 trusted people as testers (Gmail addresses) |
| 9.3 | **You** | Click the opt-in link from the email → install via Play Store on your phone → verify it installs and runs |
| 9.4 | **You** | Smoke test: add trade, navigate tabs, see ads, exit, reopen, data persists |

**Outcome:** confirmed Play Store distribution works.

---

## Phase 10 — Closed testing (14 days, mandatory for new dev accounts)

⚠️ **Cannot skip** for new accounts — Google requires 12+ testers active for 14 consecutive days before promoting to production.

| Step | Who | What |
|---|---|---|
| 10.1 | **You** | Play Console → Testing → Closed testing → Create new track |
| 10.2 | **You** | Recruit 12+ testers (Gmail accounts only). Sources: trading Discords, Twitter/X traders, Reddit r/Daytrading, friends — share the opt-in link |
| 10.3 | **You** | Upload the same AAB to closed track |
| 10.4 | **You** | Monitor Console → Testing → Closed testing → Testers tab — confirm 12+ have opted in and used the app |
| 10.5 | **All** | Wait the 14-day clock |
| 10.6 | **You** | After day 14 with 12+ active: **Promote release → Production** |

Tester recruitment tips: offer "early access to a free trading journal — only ask for honest feedback." Most traders are happy to help if the app actually works.

**Outcome:** eligible for production promotion.

---

## Phase 11 — Production launch (~7 days for review)

| Step | Who | What |
|---|---|---|
| 11.1 | **You** | Promote closed track release → Production track |
| 11.2 | **Google** | Manual review (typically 1–7 days for new apps) |
| 11.3 | **Google** | Approves → app goes live on Play Store |
| 11.4 | **You** | Share the Play Store URL on Twitter/X, Discord, Reddit, your trading network |

**Outcome:** TradeRecap is publicly downloadable.

---

## Phase 12 — Post-launch (ongoing)

| Task | Cadence | What |
|---|---|---|
| Monitor crashes | Daily for week 1, then weekly | Play Console → Quality → Android vitals |
| AdMob earnings | Weekly | https://admob.google.com — watch fill rate, eCPM, daily impressions |
| User reviews | Daily for week 1 | Reply to every review (1-star reviews respond fast — Google reads this) |
| Bug fixes | As needed | Patch in code, build new AAB, upload to Production track (no closed-test loop after first prod release) |
| Feature requests | Weekly triage | Email inbox for support@traderecap.app |
| Payment threshold ($100) | Should hit ~60–90 days post-launch with 500+ DAU | First payment 30+ days after threshold cross |

---

## Realistic timeline summary

| Day | Phase | Status check |
|---|---|---|
| 0 | Phase 1+2 (GitHub + AdMob) | Repo public, AdMob IDs in code |
| 1 | Phase 3+4 (env + Capacitor) | `npx cap run android` works on device |
| 2 | Phase 5+6 (test + sign) | Signed AAB built |
| 3 | Phase 7 (assets) | Screenshots + icon ready |
| 4 | Phase 8+9 (Console + internal test) | Live on internal track |
| 5 | Phase 10 begins | Closed test launches, 14-day clock starts |
| 19 | Phase 10 complete | Promote to production |
| 19–26 | Phase 11 | Google review |
| 26 | 🚀 **Public on Play Store** |  |

If you have an existing Play Console account that's published before, the 14-day rule is waived → cut ~2 weeks off this timeline.

---

## What I need from you to advance

**Right now:** pick one (or both in parallel):

- **A)** Reply with a fine-grained PAT → I unblock Phase 1 in 5 minutes
- **B)** Sign into AdMob, create app + 3 ad units, paste 4 IDs → I unblock Phase 2 in 5 minutes

When both are done, we move to Phase 3 (your machine setup).
