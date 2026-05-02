window.Compute = (function () {
  function pnl(t) {
    if (typeof t.net_pnl === 'number') return t.net_pnl;
    const gross = typeof t.gross_pnl === 'number' ? t.gross_pnl : computeGross(t);
    return gross - (t.fees || 0);
  }
  function computeGross(t) {
    const ep = +t.entry_price, xp = +t.exit_price, sz = +t.size;
    if (!isFinite(ep) || !isFinite(xp) || !isFinite(sz)) return 0;
    let mult = 1;
    if (t.asset_class === 'option') mult = 100;
    if (t.asset_class === 'future' && t.asset_specific && t.asset_specific.future) {
      const f = t.asset_specific.future;
      if (f.tick_value && f.tick_size) mult = f.tick_value / f.tick_size;
    }
    const dir = t.side === 'short' ? -1 : 1;
    return (xp - ep) * sz * mult * dir;
  }
  function isWin(t) { return pnl(t) > 0; }
  function isLoss(t) { return pnl(t) < 0; }
  function rMultiple(t) {
    if (typeof t.r_multiple === 'number') return t.r_multiple;
    if (!t.entry_price || !t.stop_loss) return null;
    const risk = Math.abs(+t.entry_price - +t.stop_loss);
    if (!risk) return null;
    const dir = t.side === 'short' ? -1 : 1;
    return ((+t.exit_price - +t.entry_price) * dir) / risk;
  }
  const sum = (arr, fn) => arr.reduce((a, t) => a + (fn ? fn(t) : t), 0);

  function totals(trades) {
    const total = sum(trades, pnl);
    const wins = trades.filter(isWin);
    const losses = trades.filter(isLoss);
    const grossWins = sum(wins, pnl);
    const grossLosses = Math.abs(sum(losses, pnl));
    const winRate = trades.length ? wins.length / trades.length : 0;
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : (grossWins > 0 ? Infinity : 0);
    const avgWin = wins.length ? grossWins / wins.length : 0;
    const avgLoss = losses.length ? -grossLosses / losses.length : 0;
    const rs = trades.map(rMultiple).filter(x => x != null);
    const avgR = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
    const expectancy = trades.length ? total / trades.length : 0;
    const bestTrade = trades.length ? Math.max(...trades.map(pnl)) : 0;
    const worstTrade = trades.length ? Math.min(...trades.map(pnl)) : 0;
    return {
      total, count: trades.length,
      wins: wins.length, losses: losses.length,
      winRate, profitFactor, avgWin, avgLoss, avgR, expectancy,
      bestTrade, worstTrade, grossWins, grossLosses,
      fees: sum(trades, t => t.fees || 0)
    };
  }

  function equityCurve(trades, startBalance = 0) {
    const sorted = [...trades].sort((a, b) =>
      (a.date + ' ' + (a.exit_time || '')).localeCompare(b.date + ' ' + (b.exit_time || '')));
    let bal = startBalance;
    return sorted.map(t => ({ date: t.date, t, balance: (bal += pnl(t)) }));
  }

  function maxDrawdown(curve) {
    let peak = curve.length ? curve[0].balance : 0, mdd = 0;
    for (const p of curve) {
      if (p.balance > peak) peak = p.balance;
      mdd = Math.min(mdd, p.balance - peak);
    }
    return mdd;
  }

  function sharpeRatio(trades) {
    const byD = byDay(trades);
    const arr = byD.map(d => d.pnl);
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (arr.length - 1);
    const sd = Math.sqrt(variance);
    return sd ? (mean / sd) * Math.sqrt(252) : 0;
  }

  function streaks(trades) {
    const byD = byDay(trades);
    let curW = 0, curL = 0, bestW = 0, bestL = 0;
    let lastSign = 0;
    for (const d of byD) {
      if (d.pnl > 0) { curW++; curL = 0; bestW = Math.max(bestW, curW); lastSign = 1; }
      else if (d.pnl < 0) { curL++; curW = 0; bestL = Math.max(bestL, curL); lastSign = -1; }
    }
    let current = { type: '–', n: 0 };
    if (lastSign > 0) current = { type: 'W', n: curW };
    else if (lastSign < 0) current = { type: 'L', n: curL };
    return { current, bestW, bestL };
  }

  function byDay(trades) {
    const map = {};
    for (const t of trades) {
      const k = t.date;
      const m = map[k] || (map[k] = { date: k, pnl: 0, count: 0, wins: 0, losses: 0 });
      m.pnl += pnl(t);
      m.count++;
      if (isWin(t)) m.wins++;
      else if (isLoss(t)) m.losses++;
    }
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }

  function groupBy(trades, keyOrFn) {
    const map = {};
    for (const t of trades) {
      const k = typeof keyOrFn === 'function' ? keyOrFn(t) : t[keyOrFn];
      if (k == null || k === '') continue;
      (map[k] = map[k] || []).push(t);
    }
    return map;
  }

  function tradesInRange(trades, startISO, endISO) {
    return trades.filter(t => t.date >= startISO && t.date <= endISO);
  }
  function tradesForDate(trades, dateISO) { return trades.filter(t => t.date === dateISO); }

  // Formatters
  const CURRENCY_SYMBOLS = {
    USD: '$', EUR: '€', GBP: '£', AUD: 'A$', NZD: 'NZ$',
    CAD: 'C$', JPY: '¥', INR: '₹', SGD: 'S$', HKD: 'HK$'
  };
  function currencySymbol() {
    try {
      const code = (window.Store && Store.get && Store.get('settings') || {}).currency || 'USD';
      return CURRENCY_SYMBOLS[code] || '$';
    } catch (e) { return '$'; }
  }
  function fmtMoney(v, signed = true) {
    const n = Number(v) || 0;
    const sym = currencySymbol();
    if (!signed) return `${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const sign = n < 0 ? '-' : '+';
    return `${sign}${sym}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  function fmtMoneyShort(v) {
    const n = Number(v) || 0;
    const sym = currencySymbol();
    const sign = n < 0 ? '-' : '+';
    const abs = Math.abs(n);
    if (abs >= 1000) return `${sign}${sym}${(abs / 1000).toFixed(2)}K`;
    return `${sign}${sym}${abs.toFixed(0)}`;
  }
  function fmtPct(v, d = 1) { return `${(v * 100).toFixed(d)}%`; }
  function fmtNum(v, d = 2) { return (Number(v) || 0).toFixed(d); }
  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  function dateLong(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  function startOfWeek(iso) {
    const d = new Date(iso + 'T00:00:00');
    const day = d.getDay(); // 0 Sun..6 Sat
    const offset = day === 0 ? -6 : 1 - day; // Monday start
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }
  function startOfMonth(iso) { return iso.slice(0, 7) + '-01'; }
  function startOfYear(iso) { return iso.slice(0, 4) + '-01-01'; }

  // Auto-generated plain-English observations from trade data.
  // Returns up to 4 insights with the highest signal. Empty if < 5 trades.
  function insights(trades) {
    if (!trades || trades.length < 5) return [];
    const out = [];
    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // 1. Best day of week (by win rate, min 3 trades on that day)
    const byDayOfWeek = {};
    trades.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date + 'T00:00:00').getDay();
      if (!byDayOfWeek[d]) byDayOfWeek[d] = { count: 0, wins: 0, pnl: 0 };
      const p = pnl(t);
      byDayOfWeek[d].count++;
      byDayOfWeek[d].pnl += p;
      if (p > 0) byDayOfWeek[d].wins++;
    });
    let bestDay = null, worstDay = null;
    for (const d in byDayOfWeek) {
      const s = byDayOfWeek[d];
      if (s.count < 3) continue;
      s.winRate = s.wins / s.count;
      if (!bestDay || s.winRate > bestDay.winRate) bestDay = Object.assign({ day: dow[d] }, s);
      if (!worstDay || s.winRate < worstDay.winRate) worstDay = Object.assign({ day: dow[d] }, s);
    }
    if (bestDay && bestDay.winRate > 0.5) {
      out.push({
        label: `${bestDay.day}s are your best day`,
        value: `${Math.round(bestDay.winRate * 100)}% win rate over ${bestDay.count} trades · ${fmtMoney(bestDay.pnl)}`,
        tone: 'pos'
      });
    }
    if (worstDay && worstDay.winRate < 0.4 && worstDay.day !== (bestDay && bestDay.day)) {
      out.push({
        label: `${worstDay.day}s are tough`,
        value: `${Math.round(worstDay.winRate * 100)}% win rate over ${worstDay.count} trades · ${fmtMoney(worstDay.pnl)}`,
        tone: 'neg'
      });
    }

    // 2. Best setup by total net P&L (min 3 trades)
    const bySetup = {};
    trades.forEach(t => {
      if (!t.setup) return;
      if (!bySetup[t.setup]) bySetup[t.setup] = { count: 0, pnl: 0 };
      bySetup[t.setup].count++;
      bySetup[t.setup].pnl += pnl(t);
    });
    const setups = Object.entries(bySetup).filter(([, v]) => v.count >= 3).sort((a, b) => b[1].pnl - a[1].pnl);
    if (setups.length) {
      const [name, s] = setups[0];
      if (s.pnl > 0) {
        out.push({
          label: `Your edge: ${name.replace(/_/g, ' ')}`,
          value: `${fmtMoney(s.pnl)} over ${s.count} trades`,
          tone: 'pos'
        });
      }
      if (setups.length > 1) {
        const [worstName, worstS] = setups[setups.length - 1];
        if (worstS.pnl < 0) {
          out.push({
            label: `Cut: ${worstName.replace(/_/g, ' ')}`,
            value: `${fmtMoney(worstS.pnl)} bleed over ${worstS.count} trades`,
            tone: 'neg'
          });
        }
      }
    }

    // 3. Costliest mistake (min 2 occurrences)
    const byMistake = {};
    trades.forEach(t => {
      (t.mistakes || []).forEach(m => {
        if (!byMistake[m]) byMistake[m] = { count: 0, pnl: 0 };
        byMistake[m].count++;
        byMistake[m].pnl += pnl(t);
      });
    });
    const mistakes = Object.entries(byMistake).filter(([, v]) => v.count >= 2).sort((a, b) => a[1].pnl - b[1].pnl);
    if (mistakes.length && mistakes[0][1].pnl < 0) {
      const [name, s] = mistakes[0];
      out.push({
        label: `Costliest mistake: "${name.replace(/_/g, ' ')}"`,
        value: `${fmtMoney(s.pnl)} across ${s.count} flagged trades`,
        tone: 'neg'
      });
    }

    // 4. Recent form vs all-time (last 10 trades)
    if (trades.length >= 15) {
      const sorted = trades.slice().sort((a, b) => (a.date + (a.entry_time || '')).localeCompare(b.date + (b.entry_time || '')));
      const recent = sorted.slice(-10);
      const recentWR = recent.filter(t => pnl(t) > 0).length / recent.length;
      const allWR = trades.filter(t => pnl(t) > 0).length / trades.length;
      const delta = recentWR - allWR;
      if (Math.abs(delta) >= 0.10) {
        out.push({
          label: delta > 0 ? 'Form is improving' : 'Recent form has slipped',
          value: `Last 10: ${Math.round(recentWR * 100)}% WR · all-time: ${Math.round(allWR * 100)}%`,
          tone: delta > 0 ? 'pos' : 'neg'
        });
      }
    }

    return out.slice(0, 4);
  }

  return {
    pnl, isWin, isLoss, rMultiple, computeGross,
    totals, equityCurve, maxDrawdown, sharpeRatio, streaks,
    byDay, groupBy, tradesInRange, tradesForDate,
    fmtMoney, fmtMoneyShort, fmtPct, fmtNum, todayISO, nowTime, dateLong,
    startOfWeek, startOfMonth, startOfYear,
    insights
  };
})();
