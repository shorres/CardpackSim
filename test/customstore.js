// Custom-set storage test.
//
// Covers the customSets bucket, its revision counter, and the collection parking pair. The
// parking half matters most: parkCollection and restoreOrphanedCollection move things the player
// earned, and orphanedCollections was write-only before this -- nothing had ever read an entry
// back out, so the restore path has no prior art to be consistent with.
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
    const sm = ge.storageManager;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };

    const SET = 'Custom_Store_Probe_aa11bb22';
    const def = () => ({
      name: 'Store Probe', isCustom: true, customSchema: 1, status: 'draft',
      packComposition: { common: 7, uncommon: 3, rare: 1 },
      mythicChance: 0.125, foilChance: 0.1667, boosterBoxSize: 24, isWeekly: false,
      cards: { common: ['SC1', 'SC2'], uncommon: ['SU1'], rare: ['SR1'], mythic: ['SM1'] }
    });

    // ---------- 1. CRUD and revision bumps ----------
    check('starts with no custom sets', Object.keys(sm.loadCustomSets()).length === 0,
          JSON.stringify(Object.keys(sm.loadCustomSets())));

    const rev0 = sm.getCustomSetsRevision();
    const saved = sm.saveCustomSet(SET, def());
    const rev1 = sm.getCustomSetsRevision();
    check('saveCustomSet stores the set', !!sm.loadCustomSets()[SET]);
    check('saveCustomSet stamps updatedAt', typeof saved.updatedAt === 'number');
    check('saveCustomSet bumps the revision', rev1 > rev0, rev0 + ' -> ' + rev1);
    check('custom set is not in the weekly store', !sm.loadWeeklySets()[SET]);

    sm.saveCustomSet(SET, { ...def(), status: 'published' });
    check('saveCustomSet overwrites', sm.loadCustomSets()[SET].status === 'published');
    check('overwrite bumps the revision', sm.getCustomSetsRevision() > rev1);

    // ---------- 2. custom sets survive pruneWeeklySets ----------
    // Structural, not a flag check: pruneWeeklySets only ever walks saveDoc.weeklySets. A future
    // refactor merging the two stores would silently start eating authored content.
    const removed = sm.pruneWeeklySets({}, 0);
    check('pruneWeeklySets does not report the custom set', removed.indexOf(SET) === -1, JSON.stringify(removed));
    check('custom set survives pruneWeeklySets', !!sm.loadCustomSets()[SET]);

    // ---------- 3. parkCollection moves entries out of the live collection ----------
    const collection = { [SET]: { SC1: { count: 3, foilCount: 1 }, SR1: { count: 1, foilCount: 0 } } };
    const parkedCount = sm.parkCollection(SET, collection);
    check('parkCollection reports the entry count', parkedCount === 2, String(parkedCount));
    check('parkCollection clears the live collection', collection[SET] === undefined);

    // ---------- 4. restore brings them back intact ----------
    const live = {};
    const valid = new Set(['SC1', 'SR1']);
    const r1 = sm.restoreOrphanedCollection(SET, live, valid);
    check('restore reports what it restored', r1.restored === 2 && r1.stillParked === 0, JSON.stringify(r1));
    check('restored counts are intact', live[SET].SC1.count === 3 && live[SET].SC1.foilCount === 1,
          JSON.stringify(live[SET] && live[SET].SC1));
    check('restored rare is intact', live[SET].SR1.count === 1, JSON.stringify(live[SET] && live[SET].SR1));

    // ---------- 5. a card the author removed stays parked, it is not dropped ----------
    sm.parkCollection(SET, live);
    const live2 = {};
    const r2 = sm.restoreOrphanedCollection(SET, live2, new Set(['SC1']));
    check('restore skips a card that no longer exists', r2.restored === 1 && r2.stillParked === 1, JSON.stringify(r2));
    check('the surviving card came back', !!live2[SET].SC1);
    check('the removed card did not come back', live2[SET].SR1 === undefined);

    // The whole point: the player's property is kept, not deleted, in case they add it back.
    const r3 = sm.restoreOrphanedCollection(SET, {}, new Set(['SC1']));
    check('the removed card is still parked and restorable later', r3.stillParked === 1, JSON.stringify(r3));
    const live3 = {};
    const r4 = sm.restoreOrphanedCollection(SET, live3, new Set(['SC1', 'SR1']));
    check('re-adding the card makes it restorable again', r4.restored === 1 && !!live3[SET].SR1, JSON.stringify(r4));

    // ---------- 6. parking twice merges rather than replacing ----------
    sm.parkCollection(SET, { [SET]: { A: { count: 1, foilCount: 0 } } });
    sm.parkCollection(SET, { [SET]: { B: { count: 2, foilCount: 0 } } });
    const merged = {};
    const r5 = sm.restoreOrphanedCollection(SET, merged, new Set(['A', 'B']));
    check('parking twice keeps both batches', r5.restored === 2 && !!merged[SET].A && !!merged[SET].B,
          JSON.stringify(r5));

    // ---------- 7. delete ----------
    const revBefore = sm.getCustomSetsRevision();
    check('deleteCustomSet reports success', sm.deleteCustomSet(SET) === true);
    check('deleteCustomSet removes the set', sm.loadCustomSets()[SET] === undefined);
    check('deleteCustomSet bumps the revision', sm.getCustomSetsRevision() > revBefore);
    check('deleting a missing set is a no-op', sm.deleteCustomSet('Custom_Not_There') === false);

    // ---------- 8. persist a set for the reload half of this test ----------
    sm.saveCustomSet(SET, { ...def(), status: 'published', marker: 'survives-reload' });
    ge.state.collection[SET] = { SC1: { count: 5, foilCount: 2 } };
    // saveDoc.game stays null on a fresh game until something actually saves, so hand the state
    // over explicitly rather than assuming the mutation above is already in the document.
    sm.saveState(ge.state);
    sm.parkCollection('Custom_Parked_Probe', { Custom_Parked_Probe: { Ghost: { count: 9, foilCount: 0 } } });
    window.StorageManager.flushNow();

    return { FAILURES, setId: SET };
  })()`);

  // ---------- 9. the bucket survives a real save/load round trip ----------
  await wait(1200);
  const raw = JSON.parse(fs.readFileSync(path.join(userData, 'save.json'), 'utf8'));
  const onDisk = {
    hasCustomSets: !!raw.customSets,
    marker: raw.customSets && raw.customSets[inPage.setId] && raw.customSets[inPage.setId].marker,
    parkedGhost: !!(raw.orphanedCollections && raw.orphanedCollections.Custom_Parked_Probe),
    gameCollectionSets: raw.game ? Object.keys(raw.game.collection || {}) : null,
    probeEntries: raw.game && raw.game.collection && raw.game.collection[inPage.setId]
  };
  if (!onDisk.hasCustomSets) inPage.FAILURES.push('save.json has no customSets bucket');
  if (onDisk.marker !== 'survives-reload') inPage.FAILURES.push('custom set did not reach save.json');
  if (!onDisk.parkedGhost) inPage.FAILURES.push('parked collection did not reach save.json');
  if (!onDisk.probeEntries) inPage.FAILURES.push('live collection entries did not reach save.json');

  win.webContents.reload();
  await new Promise(r => win.webContents.once('did-finish-load', r));
  await wait(3500);

  const afterReload = await win.webContents.executeJavaScript(`(() => {
    const sm = window.gameEngine.storageManager;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };
    const SET = ${JSON.stringify(inPage.setId)};

    const def = sm.loadCustomSets()[SET];
    check('custom set survives a reload', !!def);
    check('its cards survive', def && def.cards && def.cards.common.length === 2,
          def && JSON.stringify(def.cards));
    check('its composition survives', def && def.packComposition.common === 7,
          def && JSON.stringify(def.packComposition));
    check('its status survives', def && def.status === 'published', def && def.status);

    // loadState() reconciles against getAllSets(). The custom set is not merged in yet (that is
    // the next commit), so its collection entries must be PARKED, never deleted.
    const parked = window.gameEngine.state.collection[SET];
    check('an unmergeable set does not keep live collection entries', parked === undefined);

    const restored = {};
    const r = sm.restoreOrphanedCollection(SET, restored, new Set(['SC1']));
    check('the parked entries came through the reload', r.restored === 1 && restored[SET].SC1.count === 5,
          JSON.stringify(r) + ' ' + JSON.stringify(restored[SET]));

    return { FAILURES };
  })()`);

  const FAILURES = inPage.FAILURES.concat(afterReload.FAILURES);
  const consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (consoleErrors.length) FAILURES.push('console errors: ' + consoleErrors.length);

  console.log(JSON.stringify({ FAILURES, onDisk, consoleErrors }, null, 2));
  console.log(FAILURES.length === 0 ? '\nCUSTOM STORE TESTS: PASS' : '\nCUSTOM STORE TESTS: FAIL');
  app.exit(FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
