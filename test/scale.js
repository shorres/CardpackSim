// Scale test: simulate ~a year of weekly sets and confirm the save size and the hot paths
// hold up. This is the scenario the audit was actually about.
const path = require('path');
const fs = require('fs');
const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');
require(path.join(ROOT, 'main.js'));
const { app, BrowserWindow } = require('electron');

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const results = {};
const logs = [];

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  for (const f of fs.readdirSync(userData).filter(n => n.startsWith('save.'))) {
    fs.unlinkSync(path.join(userData, f));
  }

  let win = null;
  for (let i = 0; i < 40 && !win; i++) { win = BrowserWindow.getAllWindows()[0] || null; if (!win) await wait(100); }
  win.webContents.on('console-message', (...a) => {
    const o = a[0];
    const msg = (o && typeof o === 'object' && 'message' in o) ? o.message : a[2];
    const lvl = (o && typeof o === 'object' && 'level' in o) ? o.level : a[1];
    if (String(lvl) === 'error' || String(lvl) === '3') logs.push(String(msg).slice(0, 200));
  });

  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3000);

  // Inject 52 synthetic weekly sets (69 cards each) straight into the weekly-set store,
  // then let the market engine price them all, exactly as a year of play would.
  results.scale = await win.webContents.executeJavaScript(`(async () => {
    const sm = window.storageManager, ge = window.gameEngine;
    const WEEKS = 52, PER_SET = 69;

    const t0 = performance.now();
    for (let w = 0; w < WEEKS; w++) {
      const cards = { common: [], uncommon: [], rare: [], mythic: [] };
      const counts = { common: 25, uncommon: 20, rare: 18, mythic: 6 };
      for (const r of Object.keys(counts)) {
        for (let i = 0; i < counts[r]; i++) cards[r].push('W' + w + '_' + r + '_' + i);
      }
      sm.saveWeeklySet('synthetic_week_' + w, {
        name: 'Synthetic Week ' + w, isWeekly: true, packPrice: 4,
        packComposition: { common: 6, uncommon: 5, rare: 3 },
        mythicChance: 0.1, foilChance: 0.2, boosterBoxSize: 24, cards
      });
    }
    const injectMs = performance.now() - t0;

    // price every card in every set, as initializeMarket does
    const t1 = performance.now();
    const allSets = window.getAllSets();
    Object.keys(allSets).forEach(id => ge.marketEngine.initializeSetPrices(id, allSets[id]));
    const priceInitMs = performance.now() - t1;

    const setCount = Object.keys(allSets).length;
    let cardCount = 0;
    Object.keys(allSets).forEach(id => {
      const c = allSets[id].cards || {};
      Object.keys(c).forEach(r => { cardCount += (c[r] || []).length; });
    });

    // hot paths
    const t2 = performance.now();
    for (let i = 0; i < 1000; i++) window.getAllSets();
    const getAllSets1000Ms = performance.now() - t2;

    const names = [];
    Object.keys(allSets).forEach(id => {
      const c = allSets[id].cards || {};
      Object.keys(c).forEach(r => (c[r] || []).forEach(n => names.push([id, n])));
    });
    const t3 = performance.now();
    for (const [id, n] of names) ge.getCardRarity(id, n);
    const rarityAllCardsMs = performance.now() - t3;

    // one full market tick over every card in every set
    const t4 = performance.now();
    ge.marketEngine.updateMarketPrices();
    const marketTickMs = performance.now() - t4;

    // net worth over the whole collection
    const t5 = performance.now();
    ge.updateNetWorth();
    const netWorthMs = performance.now() - t5;

    ge.saveState();
    await window.StorageManager.flushNow();

    return {
      setCount, cardCount,
      injectMs: Math.round(injectMs),
      priceInitMs: Math.round(priceInitMs),
      getAllSets1000Ms: Math.round(getAllSets1000Ms),
      rarityAllCardsMs: Math.round(rarityAllCardsMs),
      marketTickMs: Math.round(marketTickMs),
      netWorthMs: Math.round(netWorthMs),
      marketStateBytes: JSON.stringify(ge.marketEngine.getState()).length
    };
  })()`);

  await wait(1200);
  const saveFile = path.join(userData, 'save.json');
  results.saveFileBytes = fs.existsSync(saveFile) ? fs.statSync(saveFile).size : 0;
  results.quotaPercentIfLocalStorage = Math.round((results.saveFileBytes / 5e6) * 1000) / 10;
  results.errors = logs;

  console.log('SCALE_RESULT ' + JSON.stringify(results, null, 2));
  app.exit(0);
}).catch(e => { console.log('SCALE_RESULT ' + JSON.stringify({ fatal: String(e && e.stack || e), logs })); app.exit(1); });
