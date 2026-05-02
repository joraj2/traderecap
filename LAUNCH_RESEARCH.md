# Launch Research — Trading Journal App

**Research date:** 2026-05-02
**Methodology:** Web research only. NOT a substitute for paid trademark clearance — see Section 4 caveat.

---

## 0. Critical finding — rename required

**"EdgeBook" is already in active commercial use as a trading journal — [edgebook.io](https://www.edgebook.io/).** Same niche (chart-first journal with screenshots, tags, playbooks, mentor links). This is direct industry overlap and effectively disqualifying. Treat the name as burned.

---

## 1. Tradezella Feature Parity

Pricing: **Basic $29/mo (annual $24/mo)** • **Premium $49/mo (annual $33/mo)**. No free tier, no free trial.

**(a) Journaling core**
- Manual + auto trade logging with notes, screenshots, tags
- Up to 3 playbooks (Basic) / unlimited (Premium)
- Mentor invites: limited (Basic) / unlimited (Premium)
- 1GB / 5GB storage
- Custom mistake/strategy/emotional tags

**(b) Analytics**
- 50+ specialized reports
- **Zella Score 2.0** — composite performance grade
- **Zella Insights** (May 2025): instant-insight widgets, multi-layered charts, day/hour/symbol breakdown, cross-analysis of two data points
- Calendar view, equity curve, win-rate by setup, MAE/MFE, time-of-day analysis

**(c) Automation / imports**
- 500+ broker auto-sync (one-click IBKR)
- Unlimited trade imports both tiers
- CSV import; prop-firm support (Topstep, FTMO)
- Economic calendar (Premium)

**(d) AI features**
- **Zella Insights AI** runs automatically on every trade — no prompting (key differentiator vs. TraderSync's chat-style Cypher)
- AI weekly + monthly performance reports
- AI first-import analysis

**(e) Social**
- Mentor view-and-comment (paid)
- Discord community; no in-app social feed

**(f) Education**
- **Zella University** built-in — structured trader education
- Playbook templates from real traders

**(g) Premium UX delights**
- **Trade Replay 2.0** (Dec 2025): tick-by-tick chart replay with executions overlaid, multi-trade replay
- **Backtesting** with 10–11 years of historical data
- Multi-pair (5) and multi-chart (8) layouts
- HTF Po3 indicator in backtester
- **No native mobile app — browser-only.** Frequently cited weakness.

Sources: [Tradezella Pricing](https://www.tradezella.com/pricing), [May 2025 Updates](https://www.tradezella.com/blog/may-2025-updates), [Dec 2024 Updates](https://www.tradezella.com/blog/whats-new-december-2024), [Trader's Second Brain Review 2026](https://traderssecondbrain.com/guides/tradezella-review).

---

## 2. Competitor Scan

| App | Positioning | Pricing | Standout | Common Complaint |
|---|---|---|---|---|
| **Tradezella** | "Best overall" AI-first journal | $29–49/mo | Always-on Zella Insights AI + Trade Replay 2.0 | No native mobile; sync/API bug reports |
| **TraderSync** | AI coach with widest broker net | $29.95–79.95/mo | Cypher AI + 700–950 broker integrations + native iOS/Android | Best AI gated behind $79.95 Elite |
| **Edgewonk** | Psychology-first | $197/yr | Tiltmeter emotional tracking; cheapest premium | Auto-sync limited to MT4/MT5 |
| **TradesViz** | Most generous free tier | Free + paid | 600+ stats, 3,000 free executions/mo, free AI Q&A | Dense UI; mobile is browser-only |
| **TraderVue** | Veteran for US stock/options day traders | Free 30/mo + paid | 100+ drilldown reports; deep MAE/MFE | Dated UI; no AI |
| **Chartlog** | TradingView-native | $14.99–39.99/mo | Built-in TradingView charts + per-strategy auto-tagging | Smaller user base |
| **Trademetria** | Multi-account workhorse | Free 30 orders + $29.95–39.95/mo | 50 accounts on Pro, 200+ broker connects | Lighter analytics |

---

## 3. Naming Candidates + Preliminary TM Check

### ⚠️ Methodology caveat — read first

This is **web-search-level reconnaissance only.** USPTO TESS, IPONZ live database, and live WHOIS were not directly queried (USPTO TESS requires interactive session). Treat every result as a *signal*, not legal clearance.

**Before public launch, pay a NZ or US trademark attorney NZ$300–800 (~US$200–500) for real clearance** covering Nice classes 9 (downloadable software), 36 (financial services), and 41 (education).

### Status legend
- **CLEAR** — no obvious overlap surfaced
- **CAUTION** — same name in adjacent space or unconfirmed
- **CONFLICT** — active same-class use found

| # | Candidate | Status | Specific signal | Domain notes |
|---|---|---|---|---|
| 0 | **EdgeBook** | 🔴 CONFLICT | edgebook.io live trading-journal product. **Do not ship.** | edgebook.io taken |
| 1 | **TradeVault** | 🟡 CAUTION | "Vault" heavy in fintech/crypto custody; class 9 likely has multiple registrants | tradevault.com near-certainly taken |
| 2 | **SetupBook** | 🟢 CLEAR (likely) | No journal hits surfaced. "Setup" is descriptive of trade setups → suggestive/weak mark | .com / .app status unknown |
| 3 | **EntryLog** | 🟢 CLEAR (likely) | No journal product surfaced. Descriptive → weaker mark but registrable | entrylog.com possibly taken |
| 4 | **TradeRecap** | 🟢 CLEAR (likely) | No surfaced same-class product. Some "recap" newsletter brands but not journals | worth a live WHOIS |
| 5 | **PlayLedger** | 🟡 CAUTION | TradeLedger taken; examiners may flag confusion with "Ledger" (crypto wallet, registered class 9 globally) | .com / .app probably free |
| 6 | **JournalPip** | 🟢 CLEAR (likely) | No surfaced conflicts. "Pip" reads forex-adjacent — narrows positioning | likely free |
| 7 | **TradeMargin** | 🟡 CAUTION | "Margin" descriptive in regulated context; examiner pushback risk | trademargin.com possibly taken |
| 8 | **EdgeJot** | 🟢 CLEAR (likely) | No surfaced conflicts. Short, distinctive, brandable. Same "Edge" stem — careful confusion analysis vs. edgebook.io if proceeding | likely free |

### Other names already burned
TradeLedger • PnLog (pnlog.com live) • Tradefolio (™ Tapinger LLC, iOS app) • TradingEdge (tradingedge.app) • StonkJournal • UltraTrader • TradesViz

### 🎯 Recommended shortlist for attorney clearance
**SetupBook • EntryLog • TradeRecap • EdgeJot • JournalPip**

---

## 4. Copyright + Legal-Hygiene Checklist (NZ Solo Dev)

1. **Original code only.** No copy-pasted competitor JS/Kotlin. If using OSS, audit licences (avoid GPL/AGPL in closed-source Android binary; prefer MIT / Apache-2.0 / BSD); keep `LICENSES.md`.
2. **Original copy.** Write your own feature bullets, screenshot captions, store description. Don't paraphrase Tradezella/TraderSync — Google detects this; so do their lawyers.
3. **Original icon + brand assets.** Commission, design yourself, or use clearly-licensed assets (Noun Project Pro, Iconfinder); keep receipts.
4. **No scraped competitor screenshots, charts, or marketing imagery.** Don't include Tradezella/TraderSync UI in blog, ASO, or onboarding.
5. **Functional vs. expressive copying.** Copyright protects *expression*, not *function*. Copy *what* a journal does (log trades, tag setups, equity curve) — never *how* a competitor draws it (specific layout, copy, iconography, colour system, illustrations). If a designer would call it "the same screen", you've crossed the line.
6. **Disclaimers in-app and on store page.** Surface on first launch and in settings:
   > "{{APP_NAME}} is a trade journaling tool. It is not financial advice and does not execute trades. Past performance does not indicate future results. Trading involves risk of loss."
7. **Privacy + Data Safety.** Confirm Play Store Data Safety form matches actual SDK behaviour (analytics, crash reporting, ads SDK identifiers). NZ Privacy Act 2020 compliance; if EU/UK users, add GDPR/UK-GDPR clauses. Avoid storing broker credentials; use OAuth.
8. **ASO keyword hygiene.** **Do not use competitor names** ("Tradezella", "TraderSync", "Edgewonk") in title, descriptions, or developer name — Play's metadata policy treats this as deceptive → rejection. **Avoid superlatives** ("#1", "best", "top-rated") unless provable; spam policy can suspend listing.
9. **No misleading claims.** No "guaranteed profit", "proven edge", "win-rate guarantee", or backtest screenshots presented as live results. NZ FMA has warned firms about retail trading hype.

---

## 5. Play Store Listing Draft

**App name placeholder:** `{{APP_NAME}}` — replace once chosen.

### Short description (79 chars)
```
Trade journal for stocks, options, futures and crypto. Log, tag, review, repeat.
```

### Full description (~1,950 chars)
```
{{APP_NAME}} is a focused trade journal for active traders. Log every trade,
tag your setups, attach chart screenshots, and review what is actually working
across stocks, options, futures, forex, and crypto - all from your phone.

Built by a trader, for traders who want a clean, fast journaling habit instead
of another bloated dashboard.

WHAT YOU CAN DO

- Log trades fast: symbol, side, entry, exit, size, fees, R-multiple, notes.
- Attach screenshots from TradingView, your broker, or your camera roll.
- Tag by setup, mistake, emotion, session, or any custom tag you create.
- Build a playbook of your repeatable setups with rules and examples.
- See your equity curve, win rate, expectancy, average R, and best/worst days.
- Filter performance by tag, symbol, time of day, or day of week to find your
  real edge - and your real leak.
- Review trades in a calendar view to spot streaks and tilt patterns.
- Export your data to CSV any time. Your trades are yours.

WHO IT IS FOR

Active stock, options, futures, forex, and crypto traders who want a
disciplined trade review habit without paying a desktop subscription.
Day traders, swing traders, and prop-firm challenge takers all welcome.

PRIVACY AND DATA

Your journal data stays under your control. We do not sell your trade data.
A full privacy policy is available in-app and on our website. {{APP_NAME}} is
free and supported by non-intrusive ads; an ad-free option is available.

NOT FINANCIAL ADVICE

{{APP_NAME}} is a journaling and analytics tool. It does not place trades and
does not give financial, investment, tax, or legal advice. Trading involves
substantial risk of loss and is not suitable for every investor. Past
performance is not indicative of future results.

KEYWORDS WE COVER NATURALLY

trade journal, trading diary, trading journal app, day trading log, options
journal, futures trading journal, forex journal, crypto trade tracker, trade
review, trader playbook, R-multiple tracker, prop firm journal.

We ship updates often. If you have feedback, tap Settings -> Send feedback.
We read everything.
```

**Compliance check:** No "#1", no "best", no competitor names, no profit guarantees, free + ads disclosed, privacy mentioned, NFA disclaimer present, target user named. ~1,950 chars (within 1,500–2,500 target).

---

## 6. Strategic Wedge — where to compete

**The biggest market gap right now: a genuinely good native Android journal.** Tradezella, TradesViz, TraderVue, and Edgewonk are all browser-only on mobile. Only TraderSync has a real Android app.

**Don't try to catch Tradezella on broker breadth as a solo dev.** Pick a wedge:
- **Mobile-first journaling** (highest leverage — every competitor is desktop-first)
- **NZ/AU broker support** (regional gap — IG, Tiger, Sharesight, ANZ Securities)
- **Chart-first journaling** with TradingView snapshot import

---

## TL;DR

1. **Drop EdgeBook** — edgebook.io is a live competing product.
2. **Best shortlist:** SetupBook, EntryLog, TradeRecap, EdgeJot, JournalPip.
3. **Pay an attorney NZ$300–800** for real clearance before branding spend.
4. **Tradezella's moat:** AI-on-every-trade + Trade Replay + 500+ broker syncs. You won't catch them on broker breadth — pick a wedge.
5. **Your opening:** mobile-first native Android. Every browser-only competitor leaves room here.
