// Set-registry regression test.
//
// Covers the three caches derived from getAllSets() and the two set-selector menus. All of this
// was latent while sets could only appear at load: populateSetSelectors appended without ever
// clearing, and UIManager.cardDatabase had no invalidation at all. Custom sets make sets appear
// and disappear at runtime, so both become live bugs.
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

  // See test/packs.js: clearAllData() rather than unlinking save.json, which alone loses a race
  // against the live renderer's beforeunload flush and the legacy localStorage migration.
  await wait(3000);
  await win.webContents.executeJavaScript('window.gameEngine.storageManager.clearAllData()');
  await wait(500);
  for (const f of fs.readdirSync(userData).filter(n => n.startsWith('save.'))) {
    fs.unlinkSync(path.join(userData, f));
  }
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  const results = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const ui = window.uiManager;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };

    const optionIds = (sel) => [...sel.options].map(o => o.value);
    const dupes = (arr) => arr.filter((v, i) => arr.indexOf(v) !== i);

    // ---------- 1. the cache key is callable without a manager ----------
    check('getAllSetsCacheKey is exported', typeof window.getAllSetsCacheKey === 'function');
    const key0 = window.getAllSetsCacheKey();
    check('getAllSetsCacheKey() works with no argument', typeof key0 === 'string' && key0.length > 0, String(key0));
    check('getAllSetsCacheKey is stable while nothing changes', window.getAllSetsCacheKey() === key0);

    // ---------- 2. repopulating the selectors does not duplicate options ----------
    const setCount = Object.keys(window.getAllSets()).length;
    ui.populateSetSelectors();
    ui.populateSetSelectors();
    ui.populateSetSelectors();
    const packIds = optionIds(ui.setSelector);
    const collIds = optionIds(ui.collectionSetSelector);
    check('pack selector has one option per set', packIds.length === setCount, packIds.length + ' vs ' + setCount);
    check('collection selector has one option per set', collIds.length === setCount, collIds.length + ' vs ' + setCount);
    check('pack selector has no duplicate options', dupes(packIds).length === 0, JSON.stringify(dupes(packIds)));
    check('collection selector has no duplicate options', dupes(collIds).length === 0, JSON.stringify(dupes(collIds)));

    // ---------- 3. a rebuild preserves the player's selection ----------
    // A cleared <select> falls back to its first option, which would silently switch which set
    // the player is looking at every time a set is published.
    const target = packIds[packIds.length - 1];
    check('there is more than one set to choose between', packIds.length > 1 && target !== packIds[0]);
    ui.setSelector.value = target;
    ui.collectionSetSelector.value = target;
    ui.populateSetSelectors();
    check('pack selection survives a rebuild', ui.setSelector.value === target, ui.setSelector.value + ' vs ' + target);
    check('collection selection survives a rebuild', ui.collectionSetSelector.value === target,
          ui.collectionSetSelector.value + ' vs ' + target);

    // ---------- 4. cardDatabase is memoized while nothing changes ----------
    const db1 = ui.createCardDatabase();
    const db2 = ui.createCardDatabase();
    check('cardDatabase is memoized', db1 === db2);
    check('cardDatabase is populated', db1.length > 0, String(db1.length));

    // ---------- 5. ...and rebuilds when the set list changes ----------
    // The real bug: this cache had no invalidation, so autocomplete and the wishlist picker went
    // stale the moment a set appeared at runtime.
    const weeklyId = window.weeklySetGenerator.getWeeklySetId();
    const storedWeekly = ge.storageManager.loadWeeklySets()[weeklyId];
    const NEW_CARD = 'Registry Probe Mythic';
    window.TCG_SETS['Test_Registry_Probe'] = {
      name: 'Registry Probe', totalCards: 4, packSize: 4, boosterBoxSize: 24,
      packComposition: { common: 2, uncommon: 1, rare: 1 },
      mythicChance: 0.1, foilChance: 0.1, isWeekly: false,
      cards: { common: ['Probe C'], uncommon: ['Probe U'], rare: ['Probe R'], mythic: [NEW_CARD] }
    };
    // Bump the revision the same way publishing a set will.
    ge.storageManager.saveWeeklySet(weeklyId, storedWeekly);

    const key1 = window.getAllSetsCacheKey();
    check('cache key changes when the set store mutates', key1 !== key0, key0 + ' -> ' + key1);

    const db3 = ui.createCardDatabase();
    check('cardDatabase rebuilds after a revision bump', db3 !== db1);
    check('cardDatabase contains the new set\\'s card',
          db3.some(c => c.name === NEW_CARD), String(db3.length));
    check('searchCards finds the new card', ui.searchCards(NEW_CARD).length > 0);

    ui.populateSetSelectors();
    const afterIds = optionIds(ui.setSelector);
    check('new set appears in the selector exactly once',
          afterIds.filter(id => id === 'Test_Registry_Probe').length === 1, JSON.stringify(afterIds));
    check('selector still has no duplicates after a new set', dupes(afterIds).length === 0,
          JSON.stringify(dupes(afterIds)));

    // ---------- 6. and rebuilds again when the set goes away ----------
    delete window.TCG_SETS['Test_Registry_Probe'];
    ge.storageManager.saveWeeklySet(weeklyId, storedWeekly);
    const db4 = ui.createCardDatabase();
    check('cardDatabase drops a removed set\\'s cards', !db4.some(c => c.name === NEW_CARD));
    ui.populateSetSelectors();
    check('removed set leaves the selector', optionIds(ui.setSelector).indexOf('Test_Registry_Probe') === -1);

    return { FAILURES, setCount, optionCount: packIds.length, dbSize: db1.length, key0, key1 };
  })()`);

  results.consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (results.consoleErrors.length) results.FAILURES.push('console errors: ' + results.consoleErrors.length);

  console.log(JSON.stringify(results, null, 2));
  console.log(results.FAILURES.length === 0 ? '\nREGISTRY TESTS: PASS' : '\nREGISTRY TESTS: FAIL');
  app.exit(results.FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
