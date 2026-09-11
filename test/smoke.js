// Integration smoke test driving the REAL main.js (its IPC handlers, its BrowserWindow,
// its webPreferences). Verifies renderer health, the net-worth/foil fix, and the save
// round trip including corrupt-save recovery.
const path = require('path');
const fs = require('fs');

const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');

// Registers the app's ipcMain handlers and schedules its createWindow on app.whenReady.
require(path.join(ROOT, 'main.js'));

const { app, BrowserWindow } = require('electron');

const logs = [];
const results = {};
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function attachLogging(win) {
  win.webContents.on('console-message', (...args) => {
    // Electron 38 passes an event object; older signature passes (e, level, message, ...)
    let level, message, sourceId, line;
    if (args.length && args[0] && typeof args[0] === 'object' && 'message' in args[0]) {
      ({ level, message, sourceId, lineNumber: line } = args[0]);
    } else {
      [, level, message, line, sourceId] = args;
      level = ['verbose', 'info', 'warning', 'error'][level] || level;
    }
    if (String(level) === 'error' || /Content Security|Refused|blocked|Save failed|Could not/i.test(String(message))) {
      logs.push(`[${level}] ${message} (${String(sourceId).split(/[\\/]/).pop()}:${line})`);
    }
  });
  win.webContents.on('render-process-gone', (e, d) => logs.push('[FATAL] ' + JSON.stringify(d)));
}

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  results.userData = userData;
  const saveFile = path.join(userData, 'save.json');
  const backupFile = path.join(userData, 'save.bak.json');

  // clean slate
  fs.mkdirSync(userData, { recursive: true });
  for (const f of fs.readdirSync(userData).filter(n => n.startsWith('save.'))) {
    fs.unlinkSync(path.join(userData, f));
  }

  // main.js created the window on ready; wait for it
  let win = null;
  for (let i = 0; i < 40 && !win; i++) {
    win = BrowserWindow.getAllWindows()[0] || null;
    if (!win) await wait(100);
  }
  if (!win) throw new Error('main.js never created a window');
  attachLogging(win);

  // it may still be loading, and the save was just deleted underneath it -> reload clean
  await wait(1500);
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  // ---------- pass 1: play, force a foil-only card, save ----------
  results.pass1 = await win.webContents.executeJavaScript(`(async () => {
    const ge = window.gameEngine;
    const setId = ge.getDefaultSet();

    ge.state.wallet = 500;
    ge.state.selectedSet = setId;
    ge.buyPacks(8);                       // buyPacks(amount) uses state.selectedSet
    for (let i = 0; i < 8; i++) ge.openPack(setId);

    // a card held ONLY as foils: the old updateNetWorth did (count - foilCount) * price
    // and subtracted value for it.
    ge.state.collection[setId]['__FoilOnlyProbe'] = { count: 0, foilCount: 3 };
    ge.marketEngine.state.cardPrices[setId]['__FoilOnlyProbe'] =
        { currentPrice: 10, basePrice: 10, foilPrice: 25, lastChange: 0, trend: 'stable' };
    ge.marketEngine.state.priceHistory[setId]['__FoilOnlyProbe'] = [];

    const nw = ge.updateNetWorth();
    const ps = ge.getPortfolioSummary();
    const portfolioTotal = (ps.cards || []).reduce((s, c) => s + c.totalValue, 0);
    const anyCard = Object.keys(ge.state.collection[setId]).find(n => n !== '__FoilOnlyProbe');

    // Drive the market tick directly. It normally only fires on a 60s interval, so
    // nothing in a short test would otherwise exercise the price-recording path.
    let tickError = null;
    try {
      ge.marketEngine.updateMarketPrices();
      ge.marketEngine.updateMarketPrices();
    } catch (e) { tickError = String(e); }

    ge.saveState();
    await window.StorageManager.flushNow();

    return {
      distinctCards: Object.keys(ge.state.collection[setId]).length,
      tickError,
      wallet: Math.round(ge.state.wallet * 100) / 100,
      netWorth: nw,
      walletPlusPortfolio: Math.round((ge.state.wallet + portfolioTotal) * 100) / 100,
      netWorthAgrees: Math.abs(nw - (ge.state.wallet + portfolioTotal)) < 0.02,
      marketBytes: JSON.stringify(ge.marketEngine.getState()).length,
      chartPoints7d: ge.marketEngine.getPriceHistory(setId, anyCard, 168).length,
      chartPointsStable: (() => {
        const a = ge.marketEngine.getPriceHistory(setId, anyCard, 168).map(p => p.price).join();
        const b = ge.marketEngine.getPriceHistory(setId, anyCard, 168).map(p => p.price).join();
        return a === b;
      })()
    };
  })()`);

  results.saveFileExists = fs.existsSync(saveFile);
  results.saveFileBytes = results.saveFileExists ? fs.statSync(saveFile).size : 0;
  try { results.schemaVersion = JSON.parse(fs.readFileSync(saveFile, 'utf8')).schemaVersion; } catch (e) {}

  // ---------- pass 2: reload, confirm the save round-tripped ----------
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);
  results.pass2 = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const setId = ge.getDefaultSet();
    const c = ge.state.collection[setId] || {};
    return {
      wallet: Math.round(ge.state.wallet * 100) / 100,
      distinctCards: Object.keys(c).length,
      foilProbeSurvived: !!(c['__FoilOnlyProbe'] && c['__FoilOnlyProbe'].foilCount === 3),
      aiBuyers: ge.marketEngine.state.aiBuyers.length
    };
  })()`);
  results.backupExists = fs.existsSync(backupFile);

  // ---------- pass 3: corrupt the primary save, expect backup recovery ----------
  // snapshot what the backup holds BEFORE corrupting anything
  results.backupBefore = (() => {
    try {
      const d = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      return { wallet: d.game && d.game.wallet, hasGame: !!d.game };
    } catch (e) { return { unreadable: String(e.message) }; }
  })();
  results.filesBefore = fs.readdirSync(userData).filter(n => n.startsWith('save'));

  fs.writeFileSync(saveFile, '{"game":{"wallet":42,  <<TRUNCATED', 'utf8');
  results.corruptWritten = fs.readFileSync(saveFile, 'utf8').slice(0, 20);
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);
  results.pass3 = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const setId = ge.getDefaultSet();
    const c = ge.state.collection[setId] || {};
    return {
      distinctCards: Object.keys(c).length,
      wallet: Math.round(ge.state.wallet * 100) / 100,
      recoveredNotFreshGame: Object.keys(c).length > 0
    };
  })()`);
  results.quarantined = fs.readdirSync(userData).filter(n => n.includes('corrupt-'));
  results.filesAfter = fs.readdirSync(userData).filter(n => n.startsWith('save'));
  results.backupAfter = (() => {
    try {
      const d = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      return { wallet: d.game && d.game.wallet, hasGame: !!d.game };
    } catch (e) { return { unreadable: String(e.message) }; }
  })();

  // ---------- CSP enforcement probes ----------
  results.csp = await win.webContents.executeJavaScript(`(async () => {
    const out = {};
    // eval / new Function must be blocked (no 'unsafe-eval')
    try { new Function('return 1')(); out.evalBlocked = false; }
    catch (e) { out.evalBlocked = true; }
    // a remote script tag must fail to load
    out.remoteScriptBlocked = await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      s.onload = () => resolve(false);
      s.onerror = () => resolve(true);
      document.head.appendChild(s);
      setTimeout(() => resolve(true), 2500);
    });
    // a remote fetch must be blocked by connect-src 'none'
    try { await fetch('https://api.github.com/'); out.remoteFetchBlocked = false; }
    catch (e) { out.remoteFetchBlocked = true; }
    return out;
  })()`);

  // ---------- Part 4 performance probes ----------
  results.perf = await win.webContents.executeJavaScript(`(() => {
    const ui = window.uiManager, ge = window.gameEngine;
    const setId = ge.getDefaultSet();

    // getAllSets memoization: same object identity on repeat calls
    const a = window.getAllSets(), b = window.getAllSets();
    const memoized = (a === b);

    // indexed rarity lookup agrees with a brute-force scan
    const names = Object.keys(a[setId].cards).flatMap(r => a[setId].cards[r]);
    const brute = (n) => Object.keys(a[setId].cards).find(r => a[setId].cards[r].includes(n)) || 'common';
    const rarityMismatches = names.filter(n => ge.getCardRarity(setId, n) !== brute(n)).length;

    // art cache: cold then warm collection render
    window.glyphArtGenerator.clearPerformanceCache();
    ui.switchTab('collection');
    let t0 = performance.now(); ui.renderCollection(); const cold = performance.now() - t0;
    t0 = performance.now(); ui.renderCollection(); const warm = performance.now() - t0;
    const artCacheEntries = window.glyphArtGenerator.getCacheStats().artCache;

    // market renders must be skipped while the collection tab is showing
    ui.switchTab('collection');
    t0 = performance.now(); ui.renderMarketViews(); const marketSkipped = performance.now() - t0;
    ui.switchTab('market');
    t0 = performance.now(); ui.renderMarketViews(); const marketRendered = performance.now() - t0;

    return {
      getAllSetsMemoized: memoized,
      rarityMismatches,
      cardsRendered: document.querySelectorAll('#collection-display .card-face').length,
      collectionRenderColdMs: Math.round(cold),
      collectionRenderWarmMs: Math.round(warm),
      artCacheEntries,
      marketSkippedMs: Math.round(marketSkipped),
      marketRenderedMs: Math.round(marketRendered)
    };
  })()`);

  // ---------- layout regression ----------
  // The vendored Tailwind must still win the cascade over styles.css. styles.css declares
  // `.card-face { position:absolute; width:100%; height:100% }` for the pack-opening flip,
  // and the collection grid reuses that class, relying on Tailwind's `relative h-40` to
  // override it. Loading tailwind.css before styles.css silently collapsed every card to a
  // full-width 32px strip -- classes were all present, so a class-coverage check missed it.
  results.layout = await win.webContents.executeJavaScript(`(() => {
    window.uiManager.switchTab('collection');
    const host = document.getElementById('collection-display');
    const kids = [...host.children];
    const first = kids[0];
    const r = first ? first.getBoundingClientRect() : { width: 0, height: 0 };
    const cs = first ? getComputedStyle(first) : {};
    const tops = new Set(kids.slice(0, 16).map(k => Math.round(k.getBoundingClientRect().top)));
    return {
      cardCount: kids.length,
      cardWidth: Math.round(r.width),
      cardHeight: Math.round(r.height),
      cardPosition: cs.position,
      hostDisplay: getComputedStyle(host).display,
      rowsAmongFirst16: tops.size,
      // the failure mode: one full-width card per row, collapsed height
      looksCollapsed: Math.round(r.height) < 100 || Math.round(r.width) > 400
    };
  })()`);

  results.logs = logs;
  console.log('SMOKE2_RESULT ' + JSON.stringify(results, null, 2));
  app.exit(0);
}).catch(err => {
  console.log('SMOKE2_RESULT ' + JSON.stringify({ fatal: String(err && err.stack || err), logs, results }, null, 2));
  app.exit(1);
});
