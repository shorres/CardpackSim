// Verifies pruneWeeklySets: old sets the player owns nothing from are dropped; old sets
// they DO own cards from are kept; recent sets are always kept.
const path = require('path');
const fs = require('fs');
const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');
require(path.join(ROOT, 'main.js'));
const { app, BrowserWindow } = require('electron');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

app.whenReady().then(async () => {
  const userData = app.getPath('userData');
  for (const f of fs.readdirSync(userData).filter(n => n.startsWith('save.'))) fs.unlinkSync(path.join(userData, f));

  let win = null;
  for (let i = 0; i < 40 && !win; i++) { win = BrowserWindow.getAllWindows()[0] || null; if (!win) await wait(100); }
  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3000);

  const out = await win.webContents.executeJavaScript(`(() => {
    const sm = window.storageManager, ge = window.gameEngine;
    const DAY = 24 * 60 * 60 * 1000;

    const mk = (name) => ({
      name, isWeekly: true, packPrice: 4,
      packComposition: { common: 6, uncommon: 5, rare: 3 },
      mythicChance: 0.1, foilChance: 0.2, boosterBoxSize: 24,
      cards: { common: [name + '_c'], uncommon: [], rare: [], mythic: [] }
    });

    sm.saveWeeklySet('old_empty',  mk('old_empty'));
    sm.saveWeeklySet('old_owned',  mk('old_owned'));
    sm.saveWeeklySet('recent_set', mk('recent_set'));

    // backdate the two "old" ones past the 60-day retention window
    const store = sm.loadWeeklySets();
    store['old_empty'].storedDate  = Date.now() - (90 * DAY);
    store['old_owned'].storedDate  = Date.now() - (90 * DAY);
    store['recent_set'].storedDate = Date.now() - (2 * DAY);

    // the player owns a card from old_owned only
    const collection = {
      old_owned:  { 'old_owned_c':  { count: 2, foilCount: 0 } },
      old_empty:  { 'old_empty_c':  { count: 0, foilCount: 0 } },   // present but zero
      recent_set: {}
    };

    const before = Object.keys(sm.loadWeeklySets()).filter(k => k.startsWith('old_') || k.startsWith('recent_'));
    const removed = sm.pruneWeeklySets(collection, 60);
    const after = Object.keys(sm.loadWeeklySets()).filter(k => k.startsWith('old_') || k.startsWith('recent_'));

    // the memoized set list must reflect the prune (revision bump invalidates the cache)
    const setsAfter = Object.keys(window.getAllSets());

    return {
      before, removed, after,
      oldEmptyRemoved:  !after.includes('old_empty'),
      oldOwnedKept:      after.includes('old_owned'),
      recentKept:        after.includes('recent_set'),
      cacheInvalidated: !setsAfter.includes('old_empty')
    };
  })()`);

  console.log('PRUNE_RESULT ' + JSON.stringify(out, null, 2));
  app.exit(0);
}).catch(e => { console.log('PRUNE_RESULT ' + JSON.stringify({ fatal: String(e && e.stack || e) })); app.exit(1); });
