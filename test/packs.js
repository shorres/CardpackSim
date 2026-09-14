// Pack-generation regression test.
//
// Guards the change that made generatePackContents honour packComposition.rare. That field was
// decorative for the life of the project -- exactly one rare rolled no matter what a set
// declared -- so the two weekly generators drifted to declaring 3 and 2 without anyone noticing.
// Honouring it naively would have tripled the rares in every weekly pack, including in saves that
// already hold a stored definition a data.js edit cannot reach. These assertions pin both halves:
// the field works now, AND no shipped set's packs changed.
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

  // Clean slate. Deleting save.json is not enough on its own, and doing it first is actively
  // wrong: main.js opens its window during its own whenReady, so a renderer is already live on
  // the previous save: it re-flushes that document on beforeunload, and any legacy localStorage
  // save is migrated straight back in by StorageManager.initialize(). clearAllData() empties the
  // in-memory document, the file, and the legacy keys together, so the reload starts from nothing.
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
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };

    const PACKS = 400;

    // Opens PACKS packs and summarises what came out, so every assertion below reads one shape.
    const sample = (setId) => {
      const set = window.getAllSets()[setId];
      const tally = { common: 0, uncommon: 0, rare: 0, mythic: 0 };
      const rareSlotCounts = new Set();
      const sizes = new Set();
      let strayName = null;
      for (let i = 0; i < PACKS; i++) {
        const pack = ge.generatePackContents(setId);
        sizes.add(pack.length);
        let rareSlots = 0;
        pack.forEach(c => {
          tally[c.rarity]++;
          if (c.rarity === 'rare' || c.rarity === 'mythic') rareSlots++;
          if (!strayName && !(set.cards[c.rarity] || []).includes(c.name)) {
            strayName = c.rarity + '/' + c.name;
          }
        });
        rareSlotCounts.add(rareSlots);
      }
      return { set, tally, sizes: [...sizes], rareSlotCounts: [...rareSlotCounts], strayName };
    };

    // ---------- 1. shipped sets are unchanged ----------
    const shipped = {};
    ['Alpha_Venture', 'Chrono_Clash'].forEach(setId => {
      const s = sample(setId);
      const c = s.set.packComposition;
      shipped[setId] = { composition: c, sizes: s.sizes, rareSlotCounts: s.rareSlotCounts };
      check(setId + ' declares rare: 1', c.rare === 1, JSON.stringify(c));
      check(setId + ' always yields exactly 1 rare-or-mythic',
            s.rareSlotCounts.length === 1 && s.rareSlotCounts[0] === 1, JSON.stringify(s.rareSlotCounts));
      check(setId + ' pack size == sum(composition)',
            s.sizes.length === 1 && s.sizes[0] === c.common + c.uncommon + c.rare, JSON.stringify(s.sizes));
      check(setId + ' commons match composition', s.tally.common === c.common * PACKS, String(s.tally.common));
      check(setId + ' uncommons match composition', s.tally.uncommon === c.uncommon * PACKS, String(s.tally.uncommon));
      check(setId + ' draws only from its own pools', s.strayName === null, s.strayName);
    });

    // ---------- 2. THE REGRESSION GATE: stored weekly sets still yield exactly 1 rare ----------
    // updateSetLifecycle must pin a stored weekly definition to rare: 1 on read, or every existing
    // player's weekly packs silently triple their rares on update day.
    const weeklyId = window.weeklySetGenerator.getWeeklySetId();
    const generated = ge.storageManager.loadWeeklySets()[weeklyId];
    check('weekly set is stored', !!generated);
    check('the generator now emits rare: 1', generated && generated.packComposition.rare === 1,
          generated && JSON.stringify(generated.packComposition));

    // Plant the definition a pre-update save actually holds. Editing data.js does not reach a
    // stored set, so this -- not the freshly generated one -- is the case that matters, and it
    // must be planted rather than assumed: on a clean machine the stored set is already rare: 1.
    const legacyStored = JSON.parse(JSON.stringify(generated));
    legacyStored.packComposition.rare = 3;
    ge.storageManager.saveWeeklySet(weeklyId, legacyStored);
    const storedRaw = ge.storageManager.loadWeeklySets()[weeklyId];

    const w = sample(weeklyId);
    check('planted legacy definition still declares rare: 3', storedRaw.packComposition.rare === 3,
          JSON.stringify(storedRaw.packComposition));
    check('legacy weekly definition is normalized to rare: 1 on read', w.set.packComposition.rare === 1,
          JSON.stringify(w.set.packComposition));
    check('weekly always yields exactly 1 rare-or-mythic',
          w.rareSlotCounts.length === 1 && w.rareSlotCounts[0] === 1, JSON.stringify(w.rareSlotCounts));
    check('weekly pack size unchanged at 12', w.sizes.length === 1 && w.sizes[0] === 12, JSON.stringify(w.sizes));

    // ---------- 3. the field is actually honoured now ----------
    // Injected into TCG_SETS rather than the weekly store, because the weekly store is exactly
    // what section 2 pins to rare: 1.
    const pool = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + ' ' + (i + 1));
    const probe = (mythicChance) => ({
      name: 'Rare Slot Probe', totalCards: 40, packSize: 9, boosterBoxSize: 24,
      packComposition: { common: 4, uncommon: 2, rare: 3 },
      mythicChance: mythicChance, foilChance: 0, isWeekly: false,
      cards: { common: pool('C', 10), uncommon: pool('U', 10), rare: pool('R', 10), mythic: pool('M', 10) }
    });
    window.TCG_SETS['Test_Rare3_NoMythic'] = probe(0);
    window.TCG_SETS['Test_Rare3_AllMythic'] = probe(1);
    // Bump the weekly revision so the memoized getAllSets() picks the injected sets up.
    ge.storageManager.saveWeeklySet(weeklyId, storedRaw);

    const three = sample('Test_Rare3_NoMythic');
    check('rare: 3 yields exactly 3 rare-or-mythic per pack',
          three.rareSlotCounts.length === 1 && three.rareSlotCounts[0] === 3, JSON.stringify(three.rareSlotCounts));
    check('rare: 3 pack size is 9', three.sizes.length === 1 && three.sizes[0] === 9, JSON.stringify(three.sizes));
    check('mythicChance 0 produces no mythics', three.tally.mythic === 0, String(three.tally.mythic));
    check('mythicChance 0 produces 3 rares per pack', three.tally.rare === 3 * PACKS, String(three.tally.rare));

    // Each rare slot rolls its upgrade independently, so mythicChance is per slot, not per pack.
    const allM = sample('Test_Rare3_AllMythic');
    check('mythicChance 1 upgrades every rare slot', allM.tally.mythic === 3 * PACKS, String(allM.tally.mythic));
    check('mythicChance 1 leaves no plain rares', allM.tally.rare === 0, String(allM.tally.rare));

    delete window.TCG_SETS['Test_Rare3_NoMythic'];
    delete window.TCG_SETS['Test_Rare3_AllMythic'];

    // ---------- 4. a malformed set degrades instead of throwing ----------
    let progressThrew = null;
    try {
      window.TCG_SETS['Test_Malformed'] = { name: 'Malformed', cards: { common: ['Only Commons'] } };
      ge.storageManager.saveWeeklySet(weeklyId, storedRaw);
      ge.state.collection['Test_Malformed'] = {};
      const p = ge.getCollectionProgress('Test_Malformed');
      check('getCollectionProgress survives missing rarity keys', p.total === 1, JSON.stringify(p));
    } catch (e) {
      progressThrew = String(e && e.message || e);
    } finally {
      delete window.TCG_SETS['Test_Malformed'];
      delete ge.state.collection['Test_Malformed'];
      // Leave the save holding the real generated definition, not the planted legacy one.
      ge.storageManager.saveWeeklySet(weeklyId, generated);
    }
    check('getCollectionProgress does not throw on a partial set', progressThrew === null, progressThrew);

    return {
      FAILURES,
      shipped,
      weekly: { stored: storedRaw && storedRaw.packComposition, read: w.set.packComposition,
                sizes: w.sizes, rareSlotCounts: w.rareSlotCounts },
      rare3: { rareSlotCounts: three.rareSlotCounts, mythics: three.tally.mythic, rares: three.tally.rare },
      perSlotMythic: { mythics: allM.tally.mythic, rares: allM.tally.rare }
    };
  })()`);

  results.consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (results.consoleErrors.length) results.FAILURES.push('console errors: ' + results.consoleErrors.length);

  console.log(JSON.stringify(results, null, 2));
  console.log(results.FAILURES.length === 0 ? '\nPACK TESTS: PASS' : '\nPACK TESTS: FAIL');
  app.exit(results.FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
