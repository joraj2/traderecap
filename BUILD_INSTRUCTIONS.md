# Build & Launch — EdgeBook (Android)

Step-by-step from a clean machine to a Play Store listing.

---

## 0. Prerequisites (~1 hour, one-time setup)

You need:

| Tool | Version | Why | Install |
|---|---|---|---|
| **Node.js** | 18 LTS or 20 LTS | Capacitor CLI + build script | https://nodejs.org |
| **Java JDK** | 17 (NOT 21) | Required by current Android Gradle Plugin | https://adoptium.net (Temurin 17) |
| **Android Studio** | Hedgehog or newer | SDK, signing, emulator, debugger | https://developer.android.com/studio |
| **Google Play Console account** | — | $25 USD one-time, where you upload the AAB | https://play.google.com/console |
| **AdMob account** | — | Free, where you create real ad unit IDs | https://admob.google.com |

After Android Studio installs, open it once → **More Actions → SDK Manager** and ensure these are installed:
- **Android 14 (API 34)** platform
- **Android SDK Build-Tools 34.x**
- **Android SDK Platform-Tools**
- **Android SDK Command-line Tools (latest)**

Set environment variables (Windows, PowerShell as admin):
```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot', 'User')
```
Restart your terminal after setting these.

---

## 1. Initialize the Capacitor project (one-time)

From `trading-dashboard/`:

```bash
npm install
npm run build:web                      # creates dist/
npx cap add android                    # creates android/ Gradle project
npm run cap:sync                       # syncs dist/ → android/app/src/main/assets/public
```

You should now have an `android/` folder. Commit it to git.

---

## 2. Day-to-day dev loop

```bash
# 1. Edit files in index.html / styles.css / js/
# 2. Push the change into the Android project
npm run cap:sync

# 3. Run on emulator or attached device
npx cap run android
# or open in Android Studio for full debugger
npx cap open android
```

For pure web testing (faster):
```bash
python -m http.server 8765
# open http://localhost:8765
```

---

## 3. App icon & splash screen

```bash
npm install --save-dev @capacitor/assets

# Place these PNGs at the project root:
#   icon.png            1024×1024  (master icon — convert from assets/icon-source.svg)
#   icon-foreground.png 1024×1024  (transparent foreground for adaptive icon)
#   icon-background.png 1024×1024  (solid bg color)
#   splash.png          2732×2732  (centered logo, dark bg)

npx capacitor-assets generate --android
```

This generates every icon density and adaptive icon Google requires.

To convert the included `assets/icon-source.svg` to a 1024×1024 PNG:
- Inkscape (free): `inkscape assets/icon-source.svg --export-type=png --export-filename=icon.png --export-width=1024`
- Or open in any browser, screenshot, resize to 1024×1024.

---

## 4. AdMob setup (once you have an AdMob account)

1. In AdMob console → **Apps → Add app → Android → Yes (published)** *(do this AFTER first Play Store upload — you'll get a stable package ID)* OR **No** for development.
2. Note the **App ID** — looks like `ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX`.
3. Create three ad units inside that app:
   - **Banner** (Adaptive Banner) — note the Ad Unit ID
   - **Interstitial** — note the Ad Unit ID
   - **Rewarded** — note the Ad Unit ID

4. Edit [`js/ads.js`](js/ads.js) — replace the `PROD_IDS` block with the four real IDs.
5. Edit [`capacitor.config.json`](capacitor.config.json) — replace the test `applicationIdAndroid` with your real App ID.
6. Edit [`android/app/src/main/AndroidManifest.xml`](android/app/src/main/AndroidManifest.xml) — find/insert this inside `<application>`:
   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
   ```
7. In [`js/app.js`](js/app.js) — change `Ads.init({ useTestAds: true })` to `Ads.init({ useTestAds: false })` for production builds.

> ⚠️ **Never publish a build with `useTestAds: true`** — Google AdMob can ban your account for showing live test ads.

---

## 5. Generate a signing key (one-time)

```bash
keytool -genkeypair -v -keystore edgebook-release.jks -alias edgebook -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked for two passwords (use the same for both). **Save the keystore file and passwords somewhere safe — losing them means you can never update the app.** Back up to a password manager.

In `android/key.properties` (create this file, do NOT commit):
```
storeFile=../../edgebook-release.jks
storePassword=YOUR_PASSWORD
keyAlias=edgebook
keyPassword=YOUR_PASSWORD
```

In `android/app/build.gradle`, find `android { ... }` and inside it add (above `buildTypes`):
```gradle
def keystorePropertiesFile = rootProject.file('key.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

---

## 6. Build the production AAB

```bash
npm run android:release
# AAB lands at: android/app/build/outputs/bundle/release/app-release.aab
```

Test it on a real device first:
```bash
# Convert AAB → APK for sideload testing
bundletool build-apks --bundle=app-release.aab --output=test.apks --mode=universal --ks=../../edgebook-release.jks --ks-key-alias=edgebook
unzip test.apks -d test
adb install test/universal.apk
```

---

## 7. First Play Console upload

1. https://play.google.com/console → **Create app**
   - Default language: English (US)
   - App name: EdgeBook
   - App or Game: App
   - Free or Paid: Free
   - Declarations: tick all three (Developer Program Policies, US export laws)
2. Complete the **Dashboard tasks** in this order (Console will gate you):
   - **Set up your app** → Privacy Policy URL, App access (no login needed = "All functionality available without restrictions"), Ads (Yes), Content rating, Target audience (18+), News app (No), COVID-19 contact tracing (No), Data safety form, Government app (No), Financial features (No — it's a journaling tool, not financial services).
   - **Set up your store listing** → paste from [`PLAY_STORE_LISTING.md`](PLAY_STORE_LISTING.md), upload icon + feature graphic + 8 screenshots.
3. **Testing → Internal testing** → Create release → Upload `app-release.aab` → Add yourself as tester. This is fast (~30 min review). Sanity-check the install on your own phone.
4. **Testing → Closed testing → Create new track** → Add 12+ testers (real Gmail accounts). They must opt in via the test link, install, and use the app for **14 consecutive days** before you can promote to production.
   - Find testers: post in trading Discords, Twitter/X, Reddit r/Daytrading. Offer the closed-test link.
   - Track tester activity: Console → Testing → Closed testing → your track → Testers tab.
5. After 14 days of qualifying activity → **Promote release → Production**. Google will review (typically 1–7 days for new apps) → public.

---

## 8. Realistic timeline

| Day | Milestone |
|---|---|
| 0 | Build AAB, internal test track upload, sanity install |
| 1 | Closed test track upload + assemble 12+ testers |
| 1–14 | Closed test runs (cannot skip — Google policy) |
| 15 | Promote to production |
| 15–22 | Production review (Google) |
| 22 | Public on Play Store |

If you have an **existing Play Console developer account that has already published an app**, the 14-day rule doesn't apply and you can go straight to production. New accounts cannot.

---

## 9. Common gotchas

- **`SDK location not found`** → Set `ANDROID_HOME` env var, restart terminal.
- **`JAVA_HOME is not set`** → Install JDK 17 (not 21), set env var.
- **App crashes on launch with AdMob test IDs in production track** → Switch to real ad unit IDs OR pass `useTestAds: true` only in development.
- **Splash screen shows white instead of black** → Check `capacitor.config.json` `SplashScreen.backgroundColor` is set, then rerun `npm run cap:sync`.
- **Status bar overlaps content** → Already handled via `padding-top: env(safe-area-inset-top)` in styles.css. If it regresses, verify `viewport-fit=cover` is in the `<meta name="viewport">` tag.
- **AdMob shows "test" overlay in production** → That's expected when `isTesting: true` is set. Set it to false for the prod build.

---

## 10. Files you must edit before first production upload

- [ ] `js/ads.js` → replace `PROD_IDS` with real AdMob IDs
- [ ] `js/app.js` → change `Ads.init({ useTestAds: true })` to `false`
- [ ] `capacitor.config.json` → real `applicationIdAndroid`
- [ ] `android/app/src/main/AndroidManifest.xml` → real ad app ID meta-data
- [ ] `PRIVACY.md` → host at a public URL, paste URL into Play Console
- [ ] `PLAY_STORE_LISTING.md` → review + paste into Play Console
- [ ] `assets/` → real icon PNGs + feature graphic + 8 screenshots
- [ ] `android/key.properties` → real signing keystore (DO NOT commit)
