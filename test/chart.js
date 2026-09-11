// Price-chart fidelity tests.
//
// Reproduces the reported symptom: a peak clearly visible on the 1-Day chart was absent
// from the 2-Day chart, and the reported "2d High" came out LOWER than the "24h High" for
// the same card -- impossible for nested windows.
//
// Two causes: the decimator kept whichever point landed first after its interval gate
// elapsed (so extremes were dropped at coarser ranges), and getChartData read its
// high/low/change off that decimated array instead of the full-resolution series.
const path = require('path');
const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');
require(path.join(ROOT, 'main.js'));
const { app, BrowserWindow } = require('electron');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

app.whenReady().then(async () => {
  let win = null;
  for (let i = 0; i < 50 && !win; i++) { win = BrowserWindow.getAllWindows()[0] || null; if (!win) await wait(100); }
  const errors = [];
  win.webContents.on('console-message', (...a) => {
    const o = a[0];
    const msg = (o && typeof o === 'object' && 'message' in o) ? o.message : a[2];
    const lvl = (o && typeof o === 'object' && 'level' in o) ? o.level : a[1];
    if (String(lvl) === 'error') errors.push(String(msg).slice(0, 200));
  });
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  const results = await win.webContents.executeJavaScript(`(() => {
    const me = window.gameEngine.marketEngine;
    const setId = window.gameEngine.getDefaultSet();
    const cardName = Object.keys(me.state.cardPrices[setId])[0];

    const HALF_HOUR = 30 * 60 * 1000;
    const SPIKE = 1.67;
    const base = 1.40;

    // ---------- part 1: decimator comparison, fully deterministic ----------
    // Timestamps are exact multiples of 30 minutes from the epoch, so the 1-hour bucket
    // phase is fixed: the old gate-based sampler, starting at index 0, keeps only the even
    // indices. A spike on an ODD index is therefore provably dropped by it.
    const fixed = [];
    for (let i = 0; i < 48; i++) {
      fixed.push({ timestamp: i * HALF_HOUR, price: base, volume: 0 });
    }
    const SPIKE_INDEX = 45; // odd -> skipped by the old even-index gate
    fixed[SPIKE_INDEX].price = SPIKE;

    const oldDownsample = (hist, intervalMinutes) => {
      const intervalMs = intervalMinutes * 60 * 1000;
      const out = []; let last = 0;
      for (const e of hist) {
        if (out.length === 0) { out.push(e); last = e.timestamp; continue; }
        if (e.timestamp - last >= intervalMs) { out.push(e); last = e.timestamp; }
      }
      const tail = hist[hist.length - 1];
      if (out.length && out[out.length - 1].timestamp !== tail.timestamp) out.push(tail);
      return out;
    };

    const oldSeries = oldDownsample(fixed, 60);                 // what 2-Day used to draw
    const newSeries = me.downsamplePriceHistory(fixed, 48);     // what it draws now
    const hasSpikeIn = (arr) => arr.some(e => Math.abs(e.price - SPIKE) < 1e-9);

    // ---------- part 2: real chart stats across nested windows ----------
    const now = Date.now();
    const history = [];
    for (let i = 0; i < 48; i++) {
      const price = (i === 44) ? SPIKE : Number((base + ((i % 5) - 2) * 0.01).toFixed(2));
      history.push({ timestamp: now - ((47 - i) * HALF_HOUR), price, volume: 0 });
    }
    me.state.priceHistory[setId][cardName] = history;
    me.state.cardPrices[setId][cardName].currentPrice = 1.44;
    me.state.cardPrices[setId][cardName].basePrice = 1.20;

    const d1 = me.getChartData(setId, cardName, 24);
    const d2 = me.getChartData(setId, cardName, 48);
    const d7 = me.getChartData(setId, cardName, 168);
    const hasSpike = (d) => d.data.some(p => Math.abs(p - SPIKE) < 1e-9);

    // ---------- part 3: seam between synthesized fill and real data ----------
    const full48 = me.getPriceHistory(setId, cardName, 48);
    const firstRealTs = history[0].timestamp;
    const seamIdx = full48.findIndex(e => e.timestamp >= firstRealTs);
    let seamJump = 0;
    if (seamIdx > 0) {
      const before = full48[seamIdx - 1].price;
      const after = full48[seamIdx].price;
      seamJump = before > 0 ? Math.abs(after - before) / before : 0;
    }

    return {
      spikeValue: SPIKE,
      decimator: {
        oldKeepsSpike: hasSpikeIn(oldSeries),
        newKeepsSpike: hasSpikeIn(newSeries),
        oldPoints: oldSeries.length,
        newPoints: newSeries.length
      },
      spikeVisible: { day1: hasSpike(d1), day2: hasSpike(d2), week1: hasSpike(d7) },
      highs: { day1: d1.maxPrice, day2: d2.maxPrice, week1: d7.maxPrice },
      lows: { day1: d1.minPrice, day2: d2.minPrice, week1: d7.minPrice },
      nestingHighsOk: d2.maxPrice >= d1.maxPrice - 1e-9 && d7.maxPrice >= d2.maxPrice - 1e-9,
      nestingLowsOk: d2.minPrice <= d1.minPrice + 1e-9 && d7.minPrice <= d2.minPrice + 1e-9,
      pointsDrawn: { day1: d1.data.length, day2: d2.data.length, week1: d7.data.length },
      syntheticPointsIn2d: seamIdx,
      // Nesting must hold for EVERY card, not just the one we injected data into.
      nestingSweep: (() => {
        const names = Object.keys(me.state.cardPrices[setId]).slice(0, 40);
        let checked = 0, highViolations = 0, lowViolations = 0, worst = null;
        for (const n of names) {
          const a = me.getChartData(setId, n, 24);
          const b = me.getChartData(setId, n, 48);
          const c = me.getChartData(setId, n, 168);
          checked++;
          if (!(b.maxPrice >= a.maxPrice - 1e-9 && c.maxPrice >= b.maxPrice - 1e-9)) {
            highViolations++;
            if (!worst) worst = { card: n, kind: 'high', d1: a.maxPrice, d2: b.maxPrice, w1: c.maxPrice };
          }
          if (!(b.minPrice <= a.minPrice + 1e-9 && c.minPrice <= b.minPrice + 1e-9)) {
            lowViolations++;
            if (!worst) worst = { card: n, kind: 'low', d1: a.minPrice, d2: b.minPrice, w1: c.minPrice };
          }
        }
        return { checked, highViolations, lowViolations, worst };
      })(),
      seamJumpPct: Math.round(seamJump * 1000) / 10,
      seamContinuous: seamJump < 0.05
    };
  })()`);

  results.errors = errors;
  const failed = [];
  if (results.decimator.oldKeepsSpike) failed.push('old decimator unexpectedly kept the spike (test is not proving anything)');
  if (!results.decimator.newKeepsSpike) failed.push('new decimator dropped the spike');
  if (!results.spikeVisible.day1 || !results.spikeVisible.day2) failed.push('spike missing from a chart range');
  if (!results.nestingHighsOk) failed.push('a wider window reported a LOWER high');
  if (!results.nestingLowsOk) failed.push('a wider window reported a HIGHER low');
  if (!results.seamContinuous) failed.push('discontinuity at the synthesized/real seam');
  const sweep = results.nestingSweep;
  if (sweep.highViolations || sweep.lowViolations) {
    failed.push('nesting violated on ' + (sweep.highViolations + sweep.lowViolations) + ' of ' + sweep.checked + ' cards: ' + JSON.stringify(sweep.worst));
  }
  results.FAILURES = failed;

  console.log('CHART_RESULT ' + JSON.stringify(results, null, 2));
  app.exit(failed.length ? 1 : 0);
}).catch(e => { console.log('CHART_RESULT ' + JSON.stringify({ fatal: String(e && e.stack || e) })); app.exit(1); });
