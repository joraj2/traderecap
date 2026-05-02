# AdMob Setup Walkthrough — TradeRecap

This is the manual sign-up process. **You** have to do this in a browser — Google does not let third parties create AdMob accounts on your behalf.

Total time: **~15 minutes** for steps 1–4 (everything needed to ship). Steps 5–7 take another ~30 minutes and aren't blockers but maximize revenue.

---

## Step 1 — Create your AdMob account (~5 min)

1. Open https://admob.google.com in your browser.
2. Click **Sign up** (or **Sign in** if you've already signed in to Google).
3. Use the Google account that owns your AdSense or that you want revenue paid to. (If you don't have AdSense yet, AdMob will offer to create one for you in this flow — accept.)
4. Country: **New Zealand**. Time zone: **Pacific/Auckland**. Currency: **USD** (or NZD if you prefer; USD is the standard for ad CPMs).
5. Accept the AdMob and AdSense terms. Submit.

You'll land on the AdMob dashboard with empty cards.

---

## Step 2 — Add the TradeRecap app (~3 min)

1. Left sidebar → **Apps** → **Add app** (top right, blue button).
2. **Have you published your app on Google Play or the App Store?** → **No**.
   *(You haven't yet — this is fine. After Play Store launch you'll come back and link it.)*
3. **Platform** → **Android**.
4. **App name** → `TradeRecap`. Click **Add**.
5. AdMob now shows you a screen with your **App ID**. It looks like:
   ```
   ca-app-pub-1234567890123456~7654321098
   ```
   *(Note the `~` separator — this is the App ID, not an Ad Unit ID.)*

   **→ Copy this and save it. Paste it into your reply to me.**

---

## Step 3 — Create the three ad units (~5 min)

Still inside your TradeRecap app in AdMob, click **Add ad unit** (or sidebar → **Ad units** → **Add ad unit**).

Create these three, one at a time:

### Ad unit 1 — Banner

| Field | Value |
|---|---|
| Ad format | **Banner** |
| Type | **Adaptive Banner** *(this is what `js/ads.js` requests)* |
| Ad unit name | `Banner — secondary tabs` |
| Frequency capping | Leave default |
| eCPM floor | Leave off |

Click **Create ad unit** → AdMob shows the **Ad Unit ID**. Looks like:
```
ca-app-pub-1234567890123456/1111111111
```
*(`/` separator = Ad Unit ID, not App ID.)*

**→ Copy this. Save it.**

### Ad unit 2 — Interstitial

| Field | Value |
|---|---|
| Ad format | **Interstitial** |
| Type | **Standard** (image + video) |
| Ad unit name | `Interstitial — cold start` |

Create → copy the new Ad Unit ID. **Save it.**

### Ad unit 3 — Rewarded

| Field | Value |
|---|---|
| Ad format | **Rewarded** |
| Type | **Standard** |
| Ad unit name | `Rewarded — PDF export` |
| Reward | Item: `pdf_export`, Amount: `1` |
| User must opt in | **Yes** |

Create → copy the new Ad Unit ID. **Save it.**

---

## Step 4 — Send me the four IDs

Paste them in your reply to me in this exact format so I can do a single search-and-replace:

```
APP_ID:           ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
BANNER_ID:        ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
INTERSTITIAL_ID:  ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
REWARDED_ID:      ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

Once you paste these I'll update [js/ads.js](js/ads.js) `PROD_IDS`, [capacitor.config.json](capacitor.config.json), and the `AndroidManifest.xml` meta-data — three edits, one commit.

> ⚠️ **Treat your App ID like a password.** Anyone who knows it can serve ads in their own malicious app under your account, and Google will ban you for it. Don't paste it on Discord/Twitter publicly. The repo is fine since it's yours.

---

## Step 5 — Set up payments (do this within 7 days of first impression — otherwise your earnings are held)

Sidebar → **Payments** → **Set up payment** → fill in:

- **Tax info** (NZ resident → "Individual" → IRD number).
- **Address** (must match your bank's records).
- **Payment method**: bank transfer to a NZ bank account. Add the account.
- **Payment threshold**: default $100 USD (Google won't pay until your earnings cross this).

You don't get paid the first month even after $100 — Google holds the first payment cycle. Plan for ~60 days from first ad impression to first deposit.

---

## Step 6 — Set up Privacy & Messaging (legal requirement, ~10 min)

Without a consent banner, ads served in the EU/UK will be non-personalized (lower revenue). Worse, Google can disable ad serving for non-compliance.

Sidebar → **Privacy & messaging** → **GDPR**:

1. **Create message** → use the auto-generated default.
2. **App** → select TradeRecap.
3. **Languages** → English (add others later).
4. **Vendors** → Accept Google's default IAB TCF v2.2 vendor list.
5. **Publish**.

Repeat for **CCPA** (California / US privacy) — same flow, even simpler.

After publishing, the Capacitor AdMob plugin will surface the consent dialog automatically on first launch. Nothing in `ads.js` needs to change.

---

## Step 7 — Add `app-ads.txt` to your domain (anti-fraud, +revenue ~30%)

Once you have a domain (`traderecap.app` or wherever your privacy policy is hosted), Google requires an `app-ads.txt` file at the root.

In AdMob: **Apps → TradeRecap → App settings → app-ads.txt** → it shows the exact line to publish, e.g.:
```
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

Save this as `app-ads.txt` in the root of the website where your privacy policy lives. AdMob auto-checks once a day. When it shows ✅ **Authorized**, your ads run at full eCPM (without this, advertisers bid lower because they can't verify you).

If your privacy policy is on `joraj2.github.io/traderecap/`, then `app-ads.txt` goes at `joraj2.github.io/traderecap/app-ads.txt`. (GitHub Pages doesn't actually let you put files at the *root* of `joraj2.github.io` unless that's a repo named `joraj2.github.io` — for v1 you can park `app-ads.txt` next to the privacy policy and submit a custom domain later.)

---

## Order of operations (what to do when)

| Phase | When | Why |
|---|---|---|
| Steps 1–4 | **Now** — before first build | Code needs the real IDs, otherwise you're shipping test ads (which is a TOS violation) |
| Step 5 | Within 7 days of step 4 | Otherwise earnings are held |
| Step 6 | Before public launch (after closed test) | Required for EU traffic |
| Step 7 | After public launch + domain | +30% revenue from verified inventory |

---

## What happens if you forget steps 5–7?

- **Skip step 5 (payments)** → ads serve, money accrues, but you can't withdraw.
- **Skip step 6 (consent)** → EU/UK traffic gets non-personalized ads only (~50% revenue loss in those markets); Google may pause serving entirely.
- **Skip step 7 (app-ads.txt)** → CPMs ~30% lower because programmatic buyers can't verify you.

None of these are immediate failures, but they all cost real money.

---

## Realistic earnings expectations

For a niche trading journal app:

| DAU (daily active users) | Monthly revenue (USD) |
|---|---|
| 100 | $5–25 |
| 500 | $25–150 |
| 1,000 | $50–300 |
| 5,000 | $250–1,500 |
| 10,000 | $500–3,000 |

Wide ranges because it depends on geography (US/UK/AU/NZ users earn 5–10× more per impression than emerging markets) and how often users open the app. Trading journals have high engagement (daily logins on trading days), so you'd likely sit toward the upper half of these ranges *if* you can attract US/UK users.
