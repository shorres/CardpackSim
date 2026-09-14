// Sell-path and market-shock tests.
//
// Covers the sell flows, which had no coverage at all, and pins the properties the
// market-shock mechanic depends on:
//   * the sell-all preview is EXACTLY what the player is paid (they confirm on that number)
//   * selling feeds sell pressure, which depresses price and then decays away
//   * dumping a lot gets a worse per-card rate than trickling it out
//   * the payout does not depend on the order Object.keys walks the collection
//   * a triggered auto-sell does not cascade off its own market impact
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
    const ge = window.gameEngine;
    const me = ge.marketEngine;
    const setId = ge.getDefaultSet();
    const names = Object.keys(me.state.cardPrices[setId]);
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };
    const round = (v) => Math.round(v * 100) / 100;

    // Deterministic starting point: no locks, a known collection, no leftover pressure.
    const seed = (per) => {
      Object.keys(ge.state.cardLockSettings).forEach(k => { ge.state.cardLockSettings[k] = false; });
      ge.state.collection[setId] = {};
      names.forEach(n => { ge.state.collection[setId][n] = { count: per, foilCount: 0 }; });
      names.forEach(n => { me.state.supplyData[setId][n].marketSupply = 0; });
      ge.updateNetWorth();
    };

    // ---------- 1. the preview must equal the payout ----------
    seed(10);
    const preview = ge.previewSellAllPortfolio();
    const sold = ge.sellAllPortfolioCards();
    check('preview.success', preview.success === true);
    check('sale.success', sold.success === true);
    check('preview gross == payout gross', preview.grossValue === sold.grossValue,
          preview.grossValue + ' vs ' + sold.grossValue);
    check('preview net == payout net', preview.netValue === sold.netValue,
          preview.netValue + ' vs ' + sold.netValue);
    check('preview fee == payout fee', preview.fee === sold.fee);
    check('preview impact == payout impact', round(preview.impactPct) === round(sold.impactPct));
    const previewPayoutMatch = {
      gross: sold.grossValue, net: sold.netValue,
      impactPct: round(sold.impactPct), slippageLost: sold.slippageLost
    };

    // dumping the lot has to actually cost something
    check('dump has market impact', sold.impactPct > 5, 'impactPct=' + sold.impactPct);
    check('collection emptied', names.every(n => ge.state.collection[setId][n].count === 0));

    // ---------- 2. selling depresses price, decay restores it ----------
    seed(40);
    const probe = names[0];
    const priceBefore = me.getCardPrice(setId, probe, false);
    ge.sellCard(setId, probe, 40, false);
    const priceAfter = me.getCardPrice(setId, probe, false);
    check('sale depresses price', priceAfter < priceBefore, priceBefore + ' -> ' + priceAfter);
    check('sale records pressure', me.getSellPressure(setId, probe) > 0);

    const pressurePeak = me.getSellPressure(setId, probe);
    for (let t = 0; t < 60; t++) me.processSupplyChanges();
    const pressureLater = me.getSellPressure(setId, probe);
    check('pressure decays', pressureLater < pressurePeak * 0.5,
          pressurePeak.toFixed(2) + ' -> ' + pressureLater.toFixed(2));
    const recovery = { pressurePeak: round(pressurePeak), after60Ticks: round(pressureLater) };

    // ---------- 3. dumping is worse per-card than trickling ----------
    seed(40);
    const one = me.quoteSale(setId, probe, false, 1, { bulkMultiplier: 1 });
    const many = me.quoteSale(setId, probe, false, 40, { bulkMultiplier: 1 });
    check('bulk fill is worse than single fill', many.fillRatio < one.fillRatio,
          many.fillRatio.toFixed(4) + ' vs ' + one.fillRatio.toFixed(4));
    check('single sale is near-free', one.slippagePct < 2, 'slippage=' + one.slippagePct);
    const volumeDiscount = {
      singleSlippagePct: round(one.slippagePct), bulkSlippagePct: round(many.slippagePct)
    };

    // ---------- 4. payout must not depend on iteration order ----------
    seed(10);
    const entries = ge.collectSellableEntries();
    const reversed = entries.slice().reverse();
    const portfolio = ge.getPortfolioSummary().totalValue;
    const forward = me.quoteBatch(entries, portfolio);
    const backward = me.quoteBatch(reversed, portfolio);
    check('batch payout is order-independent', forward.gross === backward.gross,
          forward.gross + ' vs ' + backward.gross);

    // ---------- 5. sellCard result shape (auto-sell reads .proceeds) ----------
    seed(5);
    const single = ge.sellCard(setId, probe, 2, false);
    check('sellCard succeeds', single.success === true, single.message);
    check('sellCard returns proceeds', typeof single.proceeds === 'number',
          'proceeds=' + single.proceeds);
    check('proceeds == netValue', single.proceeds === single.netValue);

    // ---------- 6. auto-sell does not cascade off its own impact ----------
    // Arm a stop-loss on every card well above the current price so all of them are
    // eligible, then run one tick. Each order may fire once; none may re-fire, and the
    // tick must not throw (executeSellOrder reads saleResult.proceeds).
    seed(20);
    me.state.sellOrders = [];
    names.slice(0, 10).forEach(n => {
      ge.createSellOrder(setId, n, 5, 'price_below', me.getCardPrice(setId, n, false) * 10, false);
    });
    const armed = me.state.sellOrders.filter(o => o.isActive).length;
    let tickThrew = null;
    try { me.evaluateSellOrders(); } catch (e) { tickThrew = String(e && e.message); }
    const stillActive = me.state.sellOrders.filter(o => o.isActive).length;
    check('auto-sell tick does not throw', tickThrew === null, tickThrew);
    check('auto-sell orders resolved once', stillActive === 0, stillActive + ' still active of ' + armed);
    const autoSell = { armed, stillActive, tickThrew };

    // ---------- 7. locks are still respected ----------
    seed(3);
    ge.state.cardLockSettings.keepOne = true;
    const lockedEntries = ge.collectSellableEntries();
    const lockedLine = lockedEntries.find(e => e.cardName === probe && !e.isFoil);
    check('keepOne leaves one behind', lockedLine && lockedLine.quantity === 2,
          'quantity=' + (lockedLine && lockedLine.quantity));

    // ---------- 8. legacy saves must not load as a market-wide crash ----------
    // Pre-shock saves incremented marketSupply on every pack opened, so a returning
    // player would otherwise load into a collection-wide price collapse.
    seed(1);
    const legacy = JSON.parse(JSON.stringify(me.getState()));
    delete legacy.sellPressureMigrated;
    names.forEach(n => { legacy.supplyData[setId][n].marketSupply = 120; });
    const legacyReduction = me.getSellReduction(120);
    me.setState(legacy);
    const migratedPressure = names.reduce((max, n) =>
      Math.max(max, me.getSellPressure(setId, n)), 0);
    check('legacy marketSupply is cleared on load', migratedPressure === 0,
          'max pressure=' + migratedPressure);
    check('legacy save is flagged migrated', me.state.sellPressureMigrated === true);
    const migration = {
      wouldHaveCutPricesTo: round(legacyReduction * 100) + '%',
      pressureAfterLoad: migratedPressure
    };

    return {
      FAILURES,
      migration,
      previewPayoutMatch,
      recovery,
      volumeDiscount,
      orderIndependent: { forward: forward.gross, backward: backward.gross },
      autoSell
    };
  })()`);

  results.consoleErrors = errors.filter(e => !/Content Security Policy|api\\.github\\.com/i.test(e));
  if (results.consoleErrors.length) results.FAILURES.push('console errors: ' + results.consoleErrors.length);

  console.log(JSON.stringify(results, null, 2));
  console.log(results.FAILURES.length === 0 ? '\nSELL TESTS: PASS' : '\nSELL TESTS: FAIL');
  app.exit(results.FAILURES.length === 0 ? 0 : 1);
});
