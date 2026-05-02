# TradeRecap — Trading Journal

A private, on-device trading journal for stocks, options, futures, and crypto. Log every trade, find your real edge with P&L heatmaps and equity curves, build a pattern playbook, and learn from named mistakes.

Wraps as an Android app via Capacitor — see [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md).

## Run locally (web)

Easiest:

```bash
cd trading-dashboard
python -m http.server 8765
```

Then open `http://localhost:8765`.

You can also double-click `index.html` — it works on `file://` because data lives in `localStorage`. Some browsers block `fetch()` of the seed JSON files in `data/` from `file://`, but the app falls back to defaults.

## Build for Android

```bash
npm install
npm run build:web         # → dist/
npx cap add android       # one-time
npm run cap:sync
npx cap open android      # opens Android Studio
```

Full guide: [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md).

## Tabs

1. **Today** — greeting, streak badge, today's P&L, today's trades, watchlist preview, market note, big stat grid, goal-progress bars
2. **Trades** — filterable log (date, asset, side, search). Click a row to expand thesis/lesson/screenshots/tags. Edit + Delete in the expanded view.
3. **Calendar** — month/week/year P&L heatmap. Click a day to drill into that day's trades.
4. **Analytics** — equity curve, P&L by day-of-week, by asset class, by setup; R-multiple distribution; top mistakes by $ impact.
5. **Watchlist** — best opps with status (watching/triggered/traded/expired). Auto-expires past their date.
6. **Patterns** — playbook with rules/invalidation; per-pattern stats auto-computed from linked trades.
7. **Pre-market** — daily plan: bias, levels, catalysts, watchlist, invalidation. Keyed by date.
8. **Review** — weekly + monthly reflection: themes, what worked / didn't, repeat mistakes, adjustments. Top winners + losers in range.
9. **Mistakes** — catalog of named mistakes with count + total $ impact + last seen.
10. **Macro** — daily tape note: regime, breadth, key levels, catalysts.
11. **Help** — searchable FAQ for everything in the app.

## Mobile

- Bottom navigation with the 4 primary tabs (Today, Trades, Calendar, Analytics) + More sheet for the rest
- Floating action button for one-tap add-trade
- Safe-area inset handling for notch / gesture-bar phones
- All forms full-width, touch-target sized inputs
- Tables horizontally scrollable

## Asset classes

- **Stock** — basic price/size fields
- **Option** — strike, expiry, type, IV / delta at entry
- **Future** — contract, tick value, tick size, ticks captured
- **Crypto** — pair, exchange, leverage, perp/spot

## Trading styles

`day` / `swing` / `position` — selectable per trade.

## Keyboard (desktop)

- **N** — new trade
- **/** — jump to Trades + focus search
- **Esc** — close modal

## Data

Everything lives in `localStorage` under the `tr_*` keys. The starter JSON files in `data/` are read on first load only (and only when served over HTTP). Use **Export** in the topbar / More menu to download a full bundle. Use **Import** to load a previously exported bundle.

To version your data with git, periodically Export and replace `data/*.json` with the bundle's contents.

## Privacy

See [PRIVACY.md](PRIVACY.md). TL;DR — your trades stay on your device. We don't have a server.

## License

Private / proprietary. All rights reserved.
