// Set creator UI test.
//
// Drives the creator the way a player does: type into the real inputs, fire real events, click
// the real buttons. That matters more than usual here, because the whole feature is a fourth tab
// bolted onto a 4,400-line god class -- the risk is not the validator (tested elsewhere), it is
// the wiring between the tab, the caches, the set menus and the collection.
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

  // Helpers shared by every step, injected once.
  await win.webContents.executeJavaScript(`
    window.__t = {
      FAILURES: [],
      check(name, cond, detail) { if (!cond) window.__t.FAILURES.push(name + (detail ? ': ' + detail : '')); },
      type(el, value) {
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      pool(prefix, n) { return Array.from({ length: n }, (_, i) => prefix + ' ' + (i + 1)).join('\\n'); },
      creator() { return window.uiManager.creatorUI; }
    };
    true;
  `);

  const step = (js) => win.webContents.executeJavaScript('(() => {' + js + '})()');

  // ---------- 1. the tab exists and opens ----------
  await step(`
    const t = window.__t, ui = window.uiManager;
    t.check('creator tab button exists', !!document.getElementById('creator-tab'));
    t.check('creator pane exists', !!document.getElementById('creator-content'));
    t.check('CreatorUI was instantiated', !!ui.creatorUI);
    document.getElementById('creator-tab').click();
    t.check('creator pane is visible', !document.getElementById('creator-content').classList.contains('hidden'));
    t.check('other panes are hidden', document.getElementById('packs-content').classList.contains('hidden'));
    t.check('editor starts closed', document.getElementById('creator-editor').classList.contains('hidden'));
    t.check('placeholder is shown', !document.getElementById('creator-placeholder').classList.contains('hidden'));
  `);

  // ---------- 2. create a set and fill it in ----------
  await step(`
    const t = window.__t;
    document.getElementById('creator-new-btn').click();
    const c = t.creator();
    t.check('a draft was created', !!c.working);
    t.check('the editor opened', !document.getElementById('creator-editor').classList.contains('hidden'));
    t.check('the draft has a legal id', window.CustomSetValidator.ID_PATTERN.test(c.currentSetId), c.currentSetId);
    t.check('pack rules are prefilled', document.getElementById('cc-common').value === '7',
            document.getElementById('cc-common').value);

    t.type(document.getElementById('creator-name'), 'Creator Probe');
    t.type(document.getElementById('creator-list-common'), t.pool('ProbeC', 15));
    t.type(document.getElementById('creator-list-uncommon'), t.pool('ProbeU', 15));
    t.type(document.getElementById('creator-list-rare'), t.pool('ProbeR', 15));
    t.type(document.getElementById('creator-list-mythic'), t.pool('ProbeM', 8));
  `);
  await wait(600);   // the 250ms revalidation debounce

  // ---------- 3. live feedback reflects what was typed ----------
  await step(`
    const t = window.__t, c = t.creator();
    t.check('card counts updated', document.getElementById('creator-count-common').textContent === '15',
            document.getElementById('creator-count-common').textContent);
    t.check('mythic count updated', document.getElementById('creator-count-mythic').textContent === '8',
            document.getElementById('creator-count-mythic').textContent);
    t.check('the set validates', c.lastVerdict && c.lastVerdict.ok,
            c.lastVerdict && JSON.stringify(c.lastVerdict.errors));
    t.check('the economy readout is healthy',
            document.getElementById('creator-economy').querySelector('.creator-ev-good') !== null,
            document.getElementById('creator-economy').textContent.trim());
    t.check('publish is enabled', document.getElementById('creator-publish-btn').disabled === false);
    t.check('the preview drew cards',
            document.getElementById('creator-preview').querySelectorAll('.card-face').length === 8,
            String(document.getElementById('creator-preview').querySelectorAll('.card-face').length));
    t.check('preview cards carry glyph art',
            document.getElementById('creator-preview').querySelector('.card-art-area') !== null);

    // A draft must stay invisible until it is published.
    t.check('draft is not in the game', window.getAllSets()[c.currentSetId] === undefined);
  `);

  // ---------- 4. the economy band pushes back on a money printer ----------
  await step(`
    const t = window.__t;
    t.type(document.getElementById('cc-mythic-one-in'), '4');
    t.type(document.getElementById('cc-rare'), '2');
  `);
  await wait(600);
  await step(`
    const t = window.__t, c = t.creator();
    t.check('an over-generous set is rejected', c.lastVerdict && !c.lastVerdict.ok);
    t.check('it is rejected for its economy',
            c.lastVerdict.errors.some(e => e.field === 'economy'),
            JSON.stringify(c.lastVerdict.errors.map(e => e.field)));
    t.check('publish is disabled', document.getElementById('creator-publish-btn').disabled === true);
    t.check('the problem is listed and clickable',
            document.querySelector('#creator-errors .creator-problem-error') !== null);
    // Put it back.
    t.type(document.getElementById('cc-mythic-one-in'), '8');
    t.type(document.getElementById('cc-rare'), '1');
  `);
  await wait(600);

  // ---------- 5. publish ----------
  await step(`
    const t = window.__t, c = t.creator();
    const setId = c.currentSetId;
    document.getElementById('creator-publish-btn').click();

    const def = window.getAllSets()[setId];
    t.check('the set is now in the game', !!def);
    t.check('it kept the typed name', def && def.name === 'Creator Probe', def && def.name);
    t.check('derived totals were recomputed', def && def.totalCards === 53, def && String(def.totalCards));
    t.check('the rarity index sees its mythics',
            window.lookupCardRarity(setId, 'ProbeM 1') === 'mythic',
            String(window.lookupCardRarity(setId, 'ProbeM 1')));
    t.check('autocomplete sees its cards', window.uiManager.searchCards('ProbeM 1').length > 0);
    t.check('its cards got prices',
            Object.keys(window.gameEngine.marketEngine.state.cardPrices[setId] || {}).length === 53,
            String(Object.keys(window.gameEngine.marketEngine.state.cardPrices[setId] || {}).length));

    const ids = [...window.uiManager.setSelector.options].map(o => o.value);
    t.check('it appears in the pack menu exactly once', ids.filter(i => i === setId).length === 1);
    t.check('the menu has no duplicates', ids.length === new Set(ids).size, JSON.stringify(ids));

    t.check('the status pill flipped', document.getElementById('creator-status-pill').textContent === 'published');
    t.check('unpublish is offered', !document.getElementById('creator-unpublish-btn').classList.contains('hidden'));
    t.check('card lists are locked', document.getElementById('creator-list-common').readOnly === true);
    window.__setId = setId;
  `);

  // ---------- 6. buy and open a pack of it, for real ----------
  await step(`
    const t = window.__t, game = window.gameEngine;
    const setId = window.__setId;
    game.state.wallet = 100;
    // buyPacks() buys for the currently selected set, the way the Buy button does.
    game.state.selectedSet = setId;
    t.check('the custom set has a pack counter', typeof game.state.unopenedPacks[setId] === 'number',
            String(game.state.unopenedPacks[setId]));
    const bought = game.buyPacks(1);
    t.check('a pack of the custom set can be bought', bought && bought.success === true,
            JSON.stringify(bought));
    t.check('the pack was added', game.state.unopenedPacks[setId] === 1,
            String(game.state.unopenedPacks[setId]));
    const opened = game.openPack(setId);
    t.check('the pack opens', Array.isArray(opened) && opened.length === 11,
            opened && String(opened.length));
    t.check('every card belongs to the set',
            opened.every(card => window.getAllSets()[setId].cards[card.rarity].indexOf(card.name) !== -1));
    t.check('the cards landed in the collection',
            Object.keys(game.state.collection[setId] || {}).length > 0);
    const progress = game.getCollectionProgress(setId);
    t.check('collection progress counts the set', progress.total === 53, JSON.stringify(progress));
  `);

  // ---------- 7. a published card name cannot be renamed ----------
  await step(`
    const t = window.__t, c = t.creator();
    const el = document.getElementById('creator-list-common');
    // The textarea is read-only, so simulate the only way this could still arrive: an edited
    // working copy reaching publish().
    c.working.cards.common = c.working.cards.common.slice();
    c.working.cards.common[0] = 'Renamed Card';
    const before = window.getAllSets()[window.__setId].cards.common[0];
    c.publish();
    const after = window.getAllSets()[window.__setId].cards.common[0];
    t.check('renaming a published card is refused', after === before, before + ' -> ' + after);
    t.check('the stored set was not changed',
            window.CustomSetStore.get(window.__setId).cards.common.indexOf('Renamed Card') === -1);
    // Additions are allowed.
    c.working.cards.common = window.getAllSets()[window.__setId].cards.common.concat(['ProbeC Added']);
    c.publish();
    t.check('adding a card to a published set is allowed',
            window.getAllSets()[window.__setId].cards.common.indexOf('ProbeC Added') !== -1);
    t.check('the added card got a price',
            !!window.gameEngine.marketEngine.state.cardPrices[window.__setId]['ProbeC Added']);
  `);

  // ---------- 8. unpublish parks the collection, republish restores it ----------
  await step(`
    const t = window.__t, c = t.creator(), game = window.gameEngine;
    const setId = window.__setId;
    window.__owned = Object.keys(game.state.collection[setId]).length;
    c.doUnpublish();
    t.check('the set left the game', window.getAllSets()[setId] === undefined);
    t.check('its collection is no longer live', game.state.collection[setId] === undefined);
    t.check('card lists are editable again', document.getElementById('creator-list-common').readOnly === false);
    t.check('it is still listed in the rail',
            document.querySelectorAll('#creator-set-rows .creator-set-row').length === 1);
    const ids = [...window.uiManager.setSelector.options].map(o => o.value);
    t.check('it left the pack menu', ids.indexOf(setId) === -1);
  `);

  await step(`
    const t = window.__t, c = t.creator(), game = window.gameEngine;
    const setId = window.__setId;
    c.publish();
    t.check('republishing brings it back', !!window.getAllSets()[setId]);
    t.check('the collection was restored',
            Object.keys(game.state.collection[setId] || {}).length === window.__owned,
            Object.keys(game.state.collection[setId] || {}).length + ' vs ' + window.__owned);
  `);

  // ---------- 9. delete needs the name typed ----------
  await step(`
    const t = window.__t, c = t.creator();
    c.confirmDelete();
    t.check('the confirm dialog opened',
            !document.getElementById('creator-confirm-modal').classList.contains('hidden'));
    t.check('confirm starts disabled', document.getElementById('creator-confirm-ok').disabled === true);
    t.type(document.getElementById('creator-confirm-input'), 'wrong name');
    t.check('a wrong name keeps it disabled', document.getElementById('creator-confirm-ok').disabled === true);
    t.type(document.getElementById('creator-confirm-input'), 'Creator Probe');
    t.check('the right name enables it', document.getElementById('creator-confirm-ok').disabled === false);
  `);

  await step(`
    const t = window.__t, game = window.gameEngine;
    const setId = window.__setId;
    document.getElementById('creator-confirm-ok').click();

    t.check('the dialog closed', document.getElementById('creator-confirm-modal').classList.contains('hidden'));
    t.check('the set is gone from the game', window.getAllSets()[setId] === undefined);
    t.check('the set is gone from the store', window.CustomSetStore.get(setId) === null);
    t.check('the rail is empty again',
            document.querySelectorAll('#creator-set-rows .creator-set-row').length === 0);
    t.check('the editor closed', document.getElementById('creator-editor').classList.contains('hidden'));

    const me = game.marketEngine;
    ['cardPrices', 'priceHistory', 'supplyData'].forEach(key => {
      t.check('delete purged ' + key, me.state[key][setId] === undefined);
    });
    t.check('delete dropped the collection', game.state.collection[setId] === undefined);
    t.check('delete dropped the packs', game.state.unopenedPacks[setId] === undefined);

    const ids = [...window.uiManager.setSelector.options].map(o => o.value);
    t.check('it left the pack menu', ids.indexOf(setId) === -1);
    t.check('the menu still has no duplicates', ids.length === new Set(ids).size, JSON.stringify(ids));
    t.check('the game still has its own sets', ids.length === 3, JSON.stringify(ids));
  `);

  // ---------- 10. the other tabs still work ----------
  await step(`
    const t = window.__t;
    ['packs', 'collection', 'market', 'creator'].forEach(tab => {
      window.uiManager.switchTab(tab);
      t.check(tab + ' tab still renders', !document.getElementById(tab + '-content').classList.contains('hidden'));
    });
    window.uiManager.refreshUI();
  `);

  const FAILURES = await win.webContents.executeJavaScript('window.__t.FAILURES');
  const consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (consoleErrors.length) FAILURES.push('console errors: ' + consoleErrors.length);

  console.log(JSON.stringify({ FAILURES, consoleErrors }, null, 2));
  console.log(FAILURES.length === 0 ? '\nCREATOR TESTS: PASS' : '\nCREATOR TESTS: FAIL');
  app.exit(FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
