// Custom-set validator test.
//
// The load-bearing assertion is the first one: the game's own sets must pass. "Custom sets are
// held to the same structural shape as real sets" is only a true statement if the real sets
// clear the bar, and it is the only thing keeping the limits honest rather than arbitrary.
//
// The second is the frozen economy table. customSets.js deliberately carries its own copy of
// MarketEngine's price ranges, because validate() runs before the engine exists. A copy that
// silently drifts would misprice every authored set, so it is asserted against the live config.
const path = require('path');
const fs = require('fs');

const ROOT = process.env.APP_ROOT || path.join(__dirname, '..');
require(path.join(ROOT, 'main.js'));

const { app, BrowserWindow } = require('electron');
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const errors = [];

app.whenReady().then(async () => {
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

  await wait(4000);

  const results = await win.webContents.executeJavaScript(`(() => {
    const ge = window.gameEngine;
    const me = ge.marketEngine;
    const V = window.CustomSetValidator;
    const S = window.CustomSetStore;
    const FAILURES = [];
    const check = (name, cond, detail) => { if (!cond) FAILURES.push(name + (detail ? ': ' + detail : '')); };

    // ---------- 1. every shipped set passes ----------
    // Scored against its OWN pack price and multiplier. Weekly packs cost $10; judging weekly
    // content at the standard $6 would fail it on an artefact of the comparison.
    const shipped = {};
    Object.keys(window.getAllSets()).forEach(setId => {
      const set = window.getAllSets()[setId];
      const multiplier = (set.isWeekly ? me.config.setMultipliers.weekly : me.config.setMultipliers.standard) *
        (set.isWeekly && set.lifecycle === 'legacy' ? 0.7
          : set.isWeekly && set.lifecycle === 'standard' ? 0.9 : 1.0);

      const asCustom = Object.assign({}, set, {
        id: 'Custom_Shipped_Probe', isCustom: true, customSchema: 1, status: 'published'
      });
      const result = V.validate(asCustom, {
        id: 'Custom_Shipped_Probe', mode: 'load',
        packPrice: me.getPackPrice(setId, 1), setMultiplier: multiplier
      });
      shipped[setId] = {
        ok: result.ok,
        evRatio: result.evRatio === null ? null : +result.evRatio.toFixed(3),
        errors: result.errors.map(e => e.field + ': ' + e.message)
      };
      check('shipped set ' + setId + ' passes validation', result.ok, JSON.stringify(shipped[setId].errors));
      check('shipped set ' + setId + ' is inside the EV band',
            result.evRatio >= V.EV_BAND.min && result.evRatio <= V.EV_BAND.max,
            String(shipped[setId].evRatio));
    });

    // ---------- 2. the frozen economy table still matches the engine ----------
    V.RARITIES.forEach(rarity => {
      const range = me.config.basePriceRanges[rarity];
      check('frozen price range matches engine for ' + rarity,
            V.BASE_PRICE_RANGES[rarity].min === range.min && V.BASE_PRICE_RANGES[rarity].max === range.max,
            JSON.stringify(V.BASE_PRICE_RANGES[rarity]) + ' vs ' + JSON.stringify(range));
      // E[u^1.5] over U(0,1) = 0.4
      const expected = range.min + (range.max - range.min) * 0.4;
      check('RARITY_MEAN is the closed form for ' + rarity,
            Math.abs(V.RARITY_MEAN[rarity] - expected) < 1e-9,
            V.RARITY_MEAN[rarity] + ' vs ' + expected);
    });
    check('frozen standard pack price matches engine',
          V.PACK_PRICE_STANDARD === me.config.packPrices.standard,
          V.PACK_PRICE_STANDARD + ' vs ' + me.config.packPrices.standard);
    const foilMean = (me.config.foilMultiplier.min + me.config.foilMultiplier.max) / 2;
    check('foil bonus matches the engine foil multiplier', Math.abs((foilMean - 1) - 2.0) < 1e-9,
          'engine mean ' + foilMean);

    // ---------- 3. closed form still tracks reality ----------
    // It runs ~8% high by design (see customSets.js). Pinned loosely: this catches the formula
    // drifting away from the engine, not the known bias.
    const probeSet = 'Alpha_Venture';
    const N = 3000;
    let total = 0;
    for (let i = 0; i < N; i++) {
      ge.generatePackContents(probeSet).forEach(card => {
        const cp = me.state.cardPrices[probeSet] && me.state.cardPrices[probeSet][card.name];
        if (cp) total += card.isFoil ? cp.foilPrice : cp.basePrice;
      });
    }
    const empirical = total / N;
    const closed = V.expectedPackValue(window.getAllSets()[probeSet], 1.0);
    const bias = (closed - empirical) / empirical;
    check('closed form is within 20% of 3000 real packs', Math.abs(bias) < 0.20,
          'closed ' + closed.toFixed(2) + ' vs empirical ' + empirical.toFixed(2));

    // ---------- 4. a well-formed set passes, and derived fields are recomputed ----------
    const pool = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + ' ' + (i + 1));
    const base = () => ({
      id: 'Custom_Probe_abcd1234',
      name: 'Probe Set',
      totalCards: 9999,          // deliberately wrong: must be recomputed, not trusted
      packSize: 9999,            // ditto
      boosterBoxSize: 24,
      packComposition: { common: 7, uncommon: 3, rare: 1 },
      mythicChance: 1 / 8,
      foilChance: 1 / 6,
      isWeekly: false,
      cards: { common: pool('C', 15), uncommon: pool('U', 15), rare: pool('R', 15), mythic: pool('M', 8) },
      isCustom: true, customSchema: 1, status: 'draft',
      createdAt: Date.now(), updatedAt: Date.now(), publishedAt: null, quarantine: null
    });

    const good = V.validate(base(), { id: 'Custom_Probe_abcd1234' });
    check('a well-formed set validates', good.ok, JSON.stringify(good.errors));
    check('totalCards is recomputed', good.ok && good.normalized.totalCards === 53,
          good.ok && String(good.normalized.totalCards));
    check('packSize is recomputed', good.ok && good.normalized.packSize === 11,
          good.ok && String(good.normalized.packSize));
    check('isCustom is forced on', good.ok && good.normalized.isCustom === true);
    check('isWeekly is forced off', good.ok && good.normalized.isWeekly === false);
    check('quarantine is cleared', good.ok && good.normalized.quarantine === null);

    // Whitespace and blank lines are the only normalization.
    const messy = base();
    messy.cards.common = ['  Padded Name  ', '', '   ', 'Second'].concat(pool('C', 13));
    const messyResult = V.validate(messy, { id: 'Custom_Probe_abcd1234' });
    check('names are trimmed', messyResult.ok && messyResult.normalized.cards.common[0] === 'Padded Name',
          messyResult.ok && JSON.stringify(messyResult.normalized.cards.common.slice(0, 2)));
    check('blank lines are dropped', messyResult.ok && messyResult.normalized.cards.common.length === 15,
          messyResult.ok && String(messyResult.normalized.cards.common.length));

    // ---------- 5. rejection matrix ----------
    const NUL = String.fromCharCode(0);
    const cases = [
      ['empty mythic pool', (d) => { d.cards.mythic = []; }, 'cards.mythic', {}],
      ['tiny rare pool', (d) => { d.cards.rare = pool('R', 2); }, 'cards.rare', {}],
      ['rare slot larger than its pool',
        (d) => { d.cards.rare = pool('R', 1); d.packComposition.rare = 2; }, 'packComposition.rare', {}],
      ['rare slot count above the limit',
        (d) => { d.packComposition.rare = 3; }, 'packComposition.rare', {}],
      ['mythic chance far too high', (d) => { d.mythicChance = 0.9; }, 'mythicChance', {}],
      ['mythic chance far too low', (d) => { d.mythicChance = 0.001; }, 'mythicChance', {}],
      ['foil chance out of range', (d) => { d.foilChance = 0.95; }, 'foilChance', {}],
      ['same name in two rarities', (d) => { d.cards.rare[0] = d.cards.common[0]; }, 'cards.rare', {}],
      ['set name too long', (d) => { d.name = 'x'.repeat(200); }, 'name', {}],
      ['empty set name', (d) => { d.name = '   '; }, 'name', {}],
      ['control character in a card name', (d) => { d.cards.common[0] = 'Bad' + NUL + 'Name'; }, 'cards.common', {}],
      ['control character in the set name', (d) => { d.name = 'Bad' + NUL + 'Set'; }, 'name', {}],
      ['card name too long', (d) => { d.cards.common[0] = 'y'.repeat(60); }, 'cards.common', {}],
      ['unknown rarity bucket', (d) => { d.cards.legendary = ['Nope']; }, 'cards', {}],
      ['missing rarity list', (d) => { delete d.cards.uncommon; }, 'cards.uncommon', {}],
      ['pack composition out of range', (d) => { d.packComposition.common = 40; }, 'packComposition.common', {}],
      ['non-integer slot count', (d) => { d.packComposition.uncommon = 2.5; }, 'packComposition.uncommon', {}],
      ['booster box too large', (d) => { d.boosterBoxSize = 100; }, 'boosterBoxSize', {}],
      ['wrong schema version', (d) => { d.customSchema = 2; }, 'customSchema', {}],
      ['bogus status', (d) => { d.status = 'live'; }, 'status', {}],
      ['weekly set id', (d) => {}, 'id', { id: 'Weekly_2026_W37' }],
      ['shipped set id', (d) => {}, 'id', { id: 'Alpha_Venture' }],
      ['id with a path separator', (d) => {}, 'id', { id: 'Custom_../../save' }],
      ['id already taken', (d) => {}, 'id', { takenIds: new Set(['Custom_Probe_abcd1234']) }],
      ['duplicate set name', (d) => {}, 'name',
        { takenNames: new Map([['probe set', 'Custom_Someone_Else']]) }],
      ['too many sets', (d) => {}, 'set', { setCount: 20 }],
      // The richest pack the structural rules still allow: every slot and both odds maxed.
      ['money printer',
        (d) => { d.packComposition = { common: 10, uncommon: 5, rare: 2 }; d.mythicChance = 0.25; d.foilChance = 0.40; },
        'economy', {}],
      ['worthless packs',
        (d) => { d.packComposition = { common: 3, uncommon: 1, rare: 1 }; d.mythicChance = 0.02; d.foilChance = 0.02; },
        'economy', {}]
    ];

    const rejections = {};
    cases.forEach(([label, mutate, expectedField, opts]) => {
      const def = base();
      mutate(def);
      const id = opts.id || 'Custom_Probe_abcd1234';
      const result = V.validate(def, Object.assign({ id }, opts));
      const fields = result.errors.map(e => e.field);
      rejections[label] = { ok: result.ok, fields };
      check('rejected: ' + label, result.ok === false, 'was accepted');
      check('rejected: ' + label + ' -> ' + expectedField, fields.indexOf(expectedField) !== -1,
            JSON.stringify(fields));
      check('rejected: ' + label + ' returns no normalized set', result.normalized === null);
    });

    // ---------- 5b. every allowed value is actually reachable ----------
    // A limit the economy band makes impossible is a trap: the editor would offer a slot count
    // that can never validate no matter what else the author changes. This is what caps the rare
    // slot at 2 -- three rare slots scores 2.62 at its cheapest, above the top of the band.
    const L = V.LIMITS;
    const reachability = {};
    for (let rare = L.composition.rare.min; rare <= L.composition.rare.max; rare++) {
      const cheapest = V.expectedPackValue({
        packComposition: { common: L.composition.common.min, uncommon: L.composition.uncommon.min, rare },
        mythicChance: L.mythicChance.min, foilChance: L.foilChance.min
      }) / V.PACK_PRICE_STANDARD;
      const richest = V.expectedPackValue({
        packComposition: { common: L.composition.common.max, uncommon: L.composition.uncommon.max, rare },
        mythicChance: L.mythicChance.max, foilChance: L.foilChance.max
      }) / V.PACK_PRICE_STANDARD;
      reachability[rare] = { cheapest: +cheapest.toFixed(3), richest: +richest.toFixed(3) };
      check('rare slot count ' + rare + ' has a valid configuration',
            cheapest <= V.EV_BAND.max && richest >= V.EV_BAND.min, JSON.stringify(reachability[rare]));
    }

    // ---------- 6. load mode skips the cross-set checks a stored set already passed ----------
    const stored = base();
    const loadResult = V.validate(stored, {
      id: 'Custom_Probe_abcd1234', mode: 'load',
      takenIds: new Set(['Custom_Probe_abcd1234']),
      takenNames: new Map([['probe set', 'Custom_Someone_Else']]),
      setCount: 50
    });
    check('load mode ignores id/name collisions and the set cap', loadResult.ok,
          JSON.stringify(loadResult.errors));

    // ---------- 7. parseCardList ----------
    const parsed = V.parseCardList('Alpha\\n  Beta  \\n\\nalpha\\nGamma\\n');
    check('parseCardList trims and drops blanks',
          JSON.stringify(parsed.names) === JSON.stringify(['Alpha', 'Beta', 'Gamma']),
          JSON.stringify(parsed.names));
    check('parseCardList reports duplicates rather than silently dropping them',
          parsed.duplicates.length === 1 && parsed.duplicates[0] === 'alpha',
          JSON.stringify(parsed.duplicates));

    // ---------- 8. the store's own helpers ----------
    const minted = S.mintSetId('My Cool Set!!', new Set());
    check('minted id matches the id pattern', V.ID_PATTERN.test(minted), minted);
    check('minted id keeps a readable slug', minted.indexOf('My_Cool_Set') !== -1, minted);
    check('minted id avoids collisions',
          S.mintSetId('X', new Set(['Custom_X_aaaaaaaa'])) !== 'Custom_X_aaaaaaaa');
    const weird = S.mintSetId('!!!', new Set());
    check('a name with no usable characters still mints a legal id', V.ID_PATTERN.test(weird), weird);

    // A fresh draft must be structurally sound apart from having no cards yet, so an author who
    // only fills in the card lists ends up with a valid set.
    const draft = S.createDraft('Fresh Draft');
    const draftResult = V.validate(draft, { id: draft.id });
    const draftFields = draftResult.errors.map(e => e.field);
    check('a fresh draft only complains about empty card lists',
          draftFields.every(f => f.indexOf('cards.') === 0), JSON.stringify(draftFields));

    const filled = Object.assign({}, draft, {
      cards: { common: pool('C', 15), uncommon: pool('U', 15), rare: pool('R', 15), mythic: pool('M', 8) }
    });
    const filledResult = V.validate(filled, { id: draft.id });
    check('filling in the card lists makes a draft valid', filledResult.ok,
          JSON.stringify(filledResult.errors));
    check('the default draft shape is inside the EV band',
          filledResult.ok && filledResult.evRatio >= V.EV_BAND.min && filledResult.evRatio <= V.EV_BAND.max,
          filledResult.evRatio && filledResult.evRatio.toFixed(3));

    return {
      FAILURES, shipped, rejections, reachability,
      evBand: V.EV_BAND,
      closedVsEmpirical: { closed: +closed.toFixed(2), empirical: +empirical.toFixed(2),
                           bias: +(bias * 100).toFixed(1) + '%' },
      defaultDraftRatio: filledResult.evRatio && +filledResult.evRatio.toFixed(3)
    };
  })()`);

  results.consoleErrors = errors.filter(e => !/Content Security Policy/i.test(e));
  if (results.consoleErrors.length) results.FAILURES.push('console errors: ' + results.consoleErrors.length);

  console.log(JSON.stringify(results, null, 2));
  console.log(results.FAILURES.length === 0 ? '\nCUSTOM SET TESTS: PASS' : '\nCUSTOM SET TESTS: FAIL');
  app.exit(results.FAILURES.length === 0 ? 0 : 1);
}).catch(err => {
  console.log(JSON.stringify({ fatal: String(err && err.stack || err), errors }, null, 2));
  app.exit(1);
});
