// Custom sets, end to end through the real engines.
//
// This is where a custom set stops being a data structure and becomes a set the game plays with:
// merged into getAllSets(), priced by MarketEngine, opened by generatePackContents, counted by
// getCollectionProgress. The point of the exercise is that none of those needed changing, so the
// assertions here are mostly "the existing code already works on this".
//
// The two that are really about the new code: a draft must be completely invisible (that is what
// makes a draft's card names safe to rename), and an invalid stored set must be quarantined
// rather than deleted or fatal.
const path = require('path');
const fs = require('fs');

const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');
require(path.join(ROOT, 'main.js'));

const { app, BrowserWindow } = require('electron');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [];

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  fs.mkdirSync(userData, { recursive: true });

  let win = null;
  for (let i = 0; i < 40 && !win; i++) {
    win = BrowserWindow.getAllWindows()[0] || null;
    if (!win) await wait(100);
  }
  if (!win) throw new Error('main.js never created a window');

  win.webContents.on('console-message', (...args) => {
    let level, message;
    if (args.length && args[0] && typeof args[0] === 'object' && 'message' in args[0]) {
      ({ level, message } = args[0]);
    } else {
      [, level, message] = args;
      level = ['verbose', 'info', 'warning', 'error'][level] || level;
    }
    if (String(level) === 'error') errors.push(String(message));
  });

  // See test/packs.js for why this is clearAllData() rather than unlinking save.json.
  await wait(3000);
  await win.webContents.executeJavaScript('window.gameEngine.storageManager.clearAllData()');
  await wait(500);
  for (const f of fs.readdirSync(userData).filter(n => n.startsWith('save.'))) {
    fs.unlinkSync(path.join(userData, f));
  }
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  const inPage = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const me = ge.marketEngine;
    const ui = window.uiManager;
    const V = window.CustomSetValidator;
    const S = window.CustomSetStore;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };

    const pool = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + ' ' + (i + 1));
    const MYTHIC = 'Merge Probe Mythic One';

    const draft = S.createDraft('Merge Probe');
    const SET = draft.id;
    draft.cards = {
      common: pool('MergeC', 15), uncommon: pool('MergeU', 15),
      rare: pool('MergeR', 15), mythic: [MYTHIC].concat(pool('MergeM', 7))
    };

    // ---------- 1. a draft is completely invisible to the game ----------
    const savedDraft = S.save(SET, draft);
    check('the draft saves', savedDraft.ok, JSON.stringify(savedDraft.errors));
    check('draft does not appear in getAllSets', window.getAllSets()[SET] === undefined);
    check('draft cards are not in the rarity index', window.lookupCardRarity(SET, MYTHIC) === null);
    check('draft cards are not searchable', ui.searchCards(MYTHIC).length === 0);
    ui.populateSetSelectors();
    check('draft is not in the set menu',
          [...ui.setSelector.options].map(o => o.value).indexOf(SET) === -1);

    // ---------- 2. publishing makes it real, with no reload ----------
    const published = S.save(SET, Object.assign({}, draft, { status: 'published', publishedAt: Date.now() }));
    check('the set publishes', published.ok, JSON.stringify(published.errors));

    const merged = window.getAllSets()[SET];
    check('published set appears in getAllSets', !!merged);
    check('it is flagged custom', merged && merged.isCustom === true);
    check('it is not flagged weekly', merged && merged.isWeekly === false);
    check('it has no lifecycle', merged && merged.lifecycle === undefined, merged && merged.lifecycle);
    check('it has no packPriceMultiplier', merged && merged.packPriceMultiplier === undefined);

    // One revision bump has to invalidate all three caches. If lookupCardRarity were stale, the
    // mythic would resolve as 'common' and be priced at common tier permanently.
    check('rarity index sees the new mythic', window.lookupCardRarity(SET, MYTHIC) === 'mythic',
          String(window.lookupCardRarity(SET, MYTHIC)));
    check('autocomplete sees the new card', ui.searchCards(MYTHIC).length > 0);
    ui.populateSetSelectors();
    const menuIds = [...ui.setSelector.options].map(o => o.value);
    check('published set is in the set menu exactly once',
          menuIds.filter(id => id === SET).length === 1, JSON.stringify(menuIds));

    // ---------- 3. the market prices it like any other set ----------
    me.initializeSetPrices(SET, merged);
    const prices = me.state.cardPrices[SET];
    check('every card got a price', prices && Object.keys(prices).length === 53,
          prices && String(Object.keys(prices).length));

    let outOfRange = null;
    V.RARITIES.forEach(rarity => {
      const range = me.config.basePriceRanges[rarity];
      merged.cards[rarity].forEach(cardName => {
        const p = prices[cardName];
        if (!p) { outOfRange = rarity + '/' + cardName + ': no price'; return; }
        // Custom sets price at multiplier 1.0, so the band is exact.
        if (p.basePrice < range.min || p.basePrice > range.max) {
          outOfRange = rarity + '/' + cardName + ': ' + p.basePrice;
        }
      });
    });
    check('every base price is inside its rarity band', outOfRange === null, outOfRange);
    check('pack price is the standard price', me.getPackPrice(SET, 1) === V.PACK_PRICE_STANDARD,
          String(me.getPackPrice(SET, 1)));
    check('supply data was created', !!me.state.supplyData[SET][MYTHIC]);

    // ---------- 4. packs open correctly ----------
    const PACKS = 400;
    const tally = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
    const sizes = new Set();
    let stray = null;
    let foils = 0;
    for (let i = 0; i < PACKS; i++) {
      const pack = ge.generatePackContents(SET);
      sizes.add(pack.length);
      pack.forEach(card => {
        tally[card.rarity]++;
        if (card.isFoil) foils++;
        if (!stray && merged.cards[card.rarity].indexOf(card.name) === -1) {
          stray = card.rarity + '/' + card.name;
        }
      });
    }
    const c = merged.packComposition;
    check('pack size matches the composition',
          sizes.size === 1 && [...sizes][0] === c.common + c.uncommon + c.rare, JSON.stringify([...sizes]));
    check('commons match the composition', tally.common === c.common * PACKS, String(tally.common));
    check('uncommons match the composition', tally.uncommon === c.uncommon * PACKS, String(tally.uncommon));
    check('rare slots are filled by a rare or a mythic',
          tally.rare + tally.mythic === c.rare * PACKS, String(tally.rare + tally.mythic));
    check('packs only draw from this set', stray === null, stray);
    // 4 sigma on the mythic upgrade rate, so this is noise-proof but still catches a wired-wrong rate.
    const expectedMythics = c.rare * PACKS * merged.mythicChance;
    const sigma = Math.sqrt(c.rare * PACKS * merged.mythicChance * (1 - merged.mythicChance));
    check('mythic rate matches mythicChance', Math.abs(tally.mythic - expectedMythics) < 4 * sigma,
          tally.mythic + ' vs ' + expectedMythics.toFixed(1) + ' +/- ' + (4 * sigma).toFixed(1));
    const expectedFoils = PACKS * merged.foilChance;
    check('foil rate matches foilChance', Math.abs(foils - expectedFoils) < 4 * Math.sqrt(expectedFoils),
          foils + ' vs ' + expectedFoils.toFixed(1));

    // ---------- 5. the collection counts it ----------
    ge.state.collection[SET] = ge.state.collection[SET] || {};
    ge.addCardsToCollection(SET, [{ name: MYTHIC, rarity: 'mythic', isFoil: false }]);
    const progress = ge.getCollectionProgress(SET);
    check('collection progress counts the whole set', progress.total === 53, JSON.stringify(progress));
    check('collection progress counts the owned card', progress.collected === 1, JSON.stringify(progress));

    // ---------- 6. unpublishing hides it again and parks the collection ----------
    S.save(SET, Object.assign({}, merged, { id: SET, status: 'draft' }));
    ge.storageManager.parkCollection(SET, ge.state.collection);
    check('unpublished set leaves getAllSets', window.getAllSets()[SET] === undefined);
    check('unpublished set leaves the rarity index', window.lookupCardRarity(SET, MYTHIC) === null);
    const restored = {};
    const restoreResult = ge.storageManager.restoreOrphanedCollection(SET, restored, V.cardNameSet(merged));
    check('the collection was parked, not lost', restoreResult.restored === 1, JSON.stringify(restoreResult));
    ge.state.collection[SET] = restored[SET];

    // ---------- 7. purgeSet forgets everything about a set ----------
    S.save(SET, Object.assign({}, merged, { id: SET, status: 'published' }));
    me.initializeSetPrices(SET, window.getAllSets()[SET]);
    me.state.wishlist.push({ setId: SET, cardName: MYTHIC, maxPrice: 5 });
    me.state.sellOrders.push({ setId: SET, cardName: MYTHIC, id: 'probe-order' });
    me.purgeSet(SET);
    ['cardPrices', 'priceHistory', 'supplyData', 'marketListings', 'playerListings'].forEach(key => {
      check('purgeSet clears ' + key, me.state[key][SET] === undefined);
    });
    check('purgeSet drops wishlist entries', !me.state.wishlist.some(w => w.setId === SET));
    check('purgeSet drops sell orders', !me.state.sellOrders.some(o => o.setId === SET));

    // ---------- 8. plant an invalid set for the reload half ----------
    // Written straight past the validator, the way a hand-edited save would be.
    const broken = JSON.parse(JSON.stringify(window.CustomSetValidator.validate(
      Object.assign({}, merged, { id: SET, status: 'published' }), { id: SET, mode: 'load' }).normalized));
    broken.id = 'Custom_Broken_Probe_1';
    broken.name = 'Broken Probe';
    broken.cards.rare = [];                       // below the pool minimum
    ge.storageManager.saveCustomSet('Custom_Broken_Probe_1', broken);
    ge.state.collection['Custom_Broken_Probe_1'] = { 'MergeC 1': { count: 4, foilCount: 1 } };

    S.remove(SET);
    ge.storageManager.saveState(ge.state);
    window.StorageManager.flushNow();

    return { FAILURES, setId: SET, packSizes: [...sizes], tally, foils };
  })()`);

  await wait(1200);
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  const afterReload = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };
    const BROKEN = 'Custom_Broken_Probe_1';

    // An invalid stored set must stay out of the game without taking the save down with it.
    check('an invalid set does not reach getAllSets', window.getAllSets()[BROKEN] === undefined);

    const stored = ge.storageManager.loadCustomSets()[BROKEN];
    check('the invalid set is kept, not deleted', !!stored);
    check('it is stamped with why it failed',
          stored && stored.quarantine && stored.quarantine.errors.length > 0,
          stored && JSON.stringify(stored.quarantine));
    check('the quarantine reason names the offending field',
          stored && stored.quarantine.errors.some(e => e.field === 'cards.rare'),
          stored && JSON.stringify(stored.quarantine.errors.map(e => e.field)));

    // And the player's cards for it are parked rather than dropped.
    check('its collection is not live', ge.state.collection[BROKEN] === undefined);
    const restored = {};
    const r = ge.storageManager.restoreOrphanedCollection(BROKEN, restored, new Set(['MergeC 1']));
    check('its collection was parked', r.restored === 1 && restored[BROKEN]['MergeC 1'].count === 4,
          JSON.stringify(r));

    return { FAILURES };
  })()`);

  const FAILURES = inPage.FAILURES.concat(afterReload.FAILURES);
  // The quarantine path logs a console.warn, not an error, so anything here is a real problem.
  const consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (consoleErrors.length) FAILURES.push('console errors: ' + consoleErrors.length);

  console.log(JSON.stringify({ FAILURES, packSizes: inPage.packSizes, tally: inPage.tally,
                               foils: inPage.foils, consoleErrors }, null, 2));
  console.log(FAILURES.length === 0 ? '\nCUSTOM MERGE TESTS: PASS' : '\nCUSTOM MERGE TESTS: FAIL');
  app.exit(FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
