# Play Store Listing — EdgeBook

Copy/paste-ready content for the Google Play Console. Tweak before publishing.

---

## App details

| Field | Value |
|---|---|
| App name | **EdgeBook** |
| Default language | English (United States) — `en-US` |
| App or game | App |
| Free or paid | Free |
| Category | Finance |
| Tags | Finance, Productivity, Investing |
| Email | support@edgebook.app |
| Website | https://joraj2.github.io/edgebook/ *(temp — swap to edgebook.app once domain is registered)* |
| Privacy policy URL | **https://joraj2.github.io/edgebook/privacy.html** ✅ live |

---

## Short description (max 80 chars)

```
Log trades, track P&L, and find your edge. For stocks, options, futures, crypto.
```

(78 chars)

Alternatives:
- `Trading journal with P&L heatmap, pattern playbook, and analytics. 100% private.` (79)
- `Private trading journal: log trades, see edge, fix mistakes. No account required.` (80)

---

## Full description (max 4000 chars)

```
EdgeBook is a private, on-device journal for serious traders. Log every trade across stocks, options, futures, and crypto. See your real edge with P&L heatmaps, equity curves, R-multiple distribution, and per-setup statistics. Build a personal pattern playbook so you stop trading from feel and start trading from data.

WHY TRADERS USE A JOURNAL
You can't fix what you don't measure. The traders who survive are the ones who go back over their trades, find their leaks, and trade their A-setups more often. EdgeBook makes that loop fast: log a trade in 30 seconds, see your stats update instantly, review the week on Sunday, repeat.

EVERYTHING IN ONE PLACE
• Today — greeting, streak badge, today's P&L, goal progress, market note
• Trades — searchable, filterable log; tap a row for full thesis, lesson, screenshots, tags
• Calendar — month/week/year P&L heatmap; tap a day to drill in
• Analytics — equity curve, P&L by day-of-week, by asset class, by setup; R-multiple histogram; top mistakes by dollar impact
• Watchlist — best opportunities with status (watching, triggered, traded, expired); auto-expires
• Patterns — playbook with rules and invalidation; per-pattern win rate, expectancy, average R, computed automatically
• Pre-market plan — bias, levels, catalysts, invalidation; date-keyed so yesterday's plan is preserved
• Review — weekly + monthly reflection: themes, what worked, what failed, repeat mistakes, adjustments
• Mistakes — catalog with count and total dollar impact; ranked by what's costing you the most
• Macro — daily tape note: regime, breadth, VIX, key levels, catalysts
• Help — searchable FAQ for everything in the app

ASSET CLASSES
• Stock — basic price/size
• Option — strike, expiry, type, IV / delta at entry
• Future — contract, tick value, ticks captured
• Crypto — pair, exchange, leverage, perp/spot

TRADING STYLES
Day, swing, or position — selectable per trade. Holding period auto-computed.

KEY METRICS
• Net P&L, gross profits, gross losses
• Win rate, profit factor, expectancy, average R
• Sharpe ratio, max drawdown, win/loss streaks
• Equity curve and daily/weekly/monthly/yearly goal progress
• Per-setup, per-asset-class, per-day-of-week breakdowns

PRIVACY FIRST
Your trades, your screenshots, your strategy — all stay on your device. We don't have a server. We can't see your trades. We can't sell your data. Use Export to back up to your own cloud storage; use Import to restore on a new device.

FREE
Free to use, supported by occasional ads at the bottom of secondary tabs (Calendar, Analytics, Watchlist) — never during trade entry, never as pop-ups while you're reviewing the day.

WHO IT'S FOR
Day traders, swing traders, options traders, futures traders, crypto traders. Anyone who's serious enough to journal but doesn't want to upload their P&L to a third party. New traders welcome — the app is built around the metrics professional traders track.

CONTACT
support@edgebook.app — feature requests and bug reports get read every week.
```

(~2,650 chars — well under the 4,000 limit)

---

## Graphic assets — sizes & checklist

| Asset | Spec | Status |
|---|---|---|
| App icon | 512 × 512 PNG, 32-bit, ≤1 MB | Generate from `assets/icon-source.svg` |
| Feature graphic | 1024 × 500 PNG/JPG | TODO — green-on-black banner with `EdgeBook` + tagline |
| Phone screenshots | 1080 × 1920 (or 9:16), min 2, max 8 | TODO — see screenshot plan below |
| 7" tablet screenshots (optional) | 1200 × 1920 | Skip for v1 |
| 10" tablet screenshots (optional) | 1920 × 1200 | Skip for v1 |
| Promo video (optional) | YouTube URL | Skip for v1 |

### Screenshot plan (8 frames)

Capture these from a phone (or Android Studio emulator at Pixel 6 / 1080 × 1920) with sample data populated:

1. **Today tab** — show greeting, streak badge, today P&L card, goal progress
2. **Calendar P&L heatmap** — colorful month view with mix of green/red days
3. **Trade log with row expanded** — show thesis, lesson, screenshots
4. **Add Trade modal** — show the form with options-specific fields
5. **Analytics — equity curve** — clean rising curve, stat grid below
6. **Analytics — R-multiple distribution** — histogram with green wins, red losses
7. **Patterns — playbook with stats** — pattern card with auto-computed win rate
8. **Mistakes ranked by $ impact** — top mistake with count and dollar figure

Add a 1-line caption overlay on each (e.g. "See every winning and losing day at a glance").

---

## Content rating questionnaire

Most answers are **No**. Specifically flag:
- **Does the app contain ads?** → Yes (AdMob banner + occasional interstitial)
- **Does the app collect or share user data?** → Yes (advertising identifier via AdMob)
- **Financial advice?** → No — it's a journaling tool, not advice

Expected rating: **Everyone** (PEGI 3 / IARC).

---

## Data safety form

Declare in Play Console → App content → Data safety:

| Data type | Collected? | Shared? | Purpose | Optional? |
|---|---|---|---|---|
| Advertising or measurement IDs | Yes | Yes (Google AdMob) | Advertising / marketing | No (required for ads) |
| App activity — app interactions | Yes | Yes (Google AdMob) | Analytics, advertising | No |
| Device or other IDs | Yes | Yes (Google AdMob) | Advertising | No |
| **Financial info, personal info, photos, contacts, location, messages, files, calendar, health & fitness** | **No** | **No** | — | — |

Security practices to declare:
- Data encrypted in transit: **N/A** (no server)
- Users can request data deletion: **Yes** — in-app reset wipes everything
- Independent security review: **No**

---

## Pricing & distribution

- **Countries:** start with NZ + AU + US + UK + CA. Expand globally after first 2 weeks.
- **Pricing:** Free.
- **Contains ads:** Yes (must be checked in Play Console).
- **In-app purchases:** No (for v1).
- **Target audience:** 18+ (recommended given financial nature).

---

## Versioning

| Version code | Version name | Track | Notes |
|---|---|---|---|
| 1 | 1.0.0 | Internal testing | First build, sanity check |
| 1 | 1.0.0 | Closed testing | 12+ testers × 14 days (mandatory for new devs) |
| 2 | 1.0.1 | Production | Public release after closed test passes |
