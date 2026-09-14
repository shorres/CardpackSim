// Player-authored set definitions: validation and storage.
//
// A custom set has the same shape as a shipped one, so every existing consumer -- pack
// generation, pricing, the collection view, the market -- works on it unchanged. This module is
// what keeps that promise true: nothing reaches getAllSets() without passing validate() first.
//
// Two things to know before changing anything here.
//
// 1. Card names are the primary key. collection[setId][cardName], cardPrices, priceHistory,
//    supplyData, listings, the rarity index, the art cache -- all keyed by name, and the base
//    price is seeded from hashString(setId + cardName + rarity). Renaming a card in a published
//    set does not move the player's copies, it strands them and re-rolls the price. Hence the
//    draft/published split: a draft is invisible to the game and freely editable; publishing
//    locks the names.
//
// 2. The economy numbers below are a deliberate frozen copy of MarketEngine's, not a reference
//    to it. validate() runs from getAllSets(), which runs from the MarketEngine constructor --
//    the engine does not exist yet. test/customsets.js asserts the copy still matches the
//    original, so drift is caught rather than silently mispricing every authored set.

const CUSTOM_SCHEMA_VERSION = 1;
const CUSTOM_ID_PATTERN = /^Custom_[A-Za-z0-9_]{1,48}$/;
// Control characters would let an authored name corrupt a log line, a label, or the save file.
// Built from a string so this file stays readable: writing the class literally puts real control
// bytes in the source.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F]');
const RARITIES = ['common', 'uncommon', 'rare', 'mythic'];

const LIMITS = {
    setNameMax: 48,
    cardNameMax: 40,
    // Pool minimums are what stop a "set" of three mythics. Maximums keep the save, the price
    // table and the collection grid to a sane size.
    pool: {
        common: { min: 10, max: 120 },
        uncommon: { min: 8, max: 120 },
        rare: { min: 6, max: 120 },
        mythic: { min: 3, max: 120 }
    },
    totalCardsMax: 300,
    composition: {
        common: { min: 3, max: 10 },
        uncommon: { min: 1, max: 5 },
        // Capped at 2 because 3 is unreachable, not because 3 is undesirable: the cheapest pack
        // the other limits allow alongside three rare slots still scores 2.62, above the top of
        // EV_BAND. Offering a value in the editor that can never validate, whatever else the
        // author changes, is worse than not offering it. test/customsets.js pins every allowed
        // slot count as reachable, so this stays honest if the band is ever retuned.
        rare: { min: 1, max: 2 }
    },
    mythicChance: { min: 0.02, max: 0.25 },   // 1 in 50 .. 1 in 4
    foilChance: { min: 0.02, max: 0.40 },     // 1 in 50 .. 1 in 2.5
    boosterBoxSize: { min: 12, max: 36 },
    maxSets: 20
};

// ---------------------------------------------------------------------------
// Economy model (frozen copy of MarketEngine's -- see note 2 at the top)
// ---------------------------------------------------------------------------

// Mirrors market.js config.basePriceRanges.
const BASE_PRICE_RANGES = {
    common: { min: 0.05, max: 0.50 },
    uncommon: { min: 0.50, max: 2.00 },
    rare: { min: 2.00, max: 8.00 },
    mythic: { min: 8.00, max: 25.00 }
};
// Mirrors market.js config.packPrices.standard. A custom set is neither weekly nor legacy, so
// this is what one of its packs actually costs.
const PACK_PRICE_STANDARD = 6.00;
// Mirrors market.js config.foilMultiplier {min: 2, max: 4}: mean 3, so a card turning foil adds
// about twice its own value on top of what it was already worth.
const FOIL_VALUE_BONUS = 2.0;

// generateBasePrice draws u ~ U(0,1), applies pow(u, 1.5), and maps it into the rarity's range.
// E[u^1.5] over U(0,1) is 1/2.5 = 0.4 exactly, so the mean base price is closed-form -- no
// sampling needed, and the validator can answer while the author is still typing.
//
// Measured against 4,000 real packs per shipped set, this runs about 8% high: the engine's prices
// come from seededRandom(hashString(...)) rather than a true uniform, and those draws sit
// slightly low. The bias is consistent across every set, and EV_BAND below was calibrated in this
// same closed-form space, so it cancels. Do not "correct" the 0.4 without re-measuring the band;
// the two are one calibration, not two independent numbers.
const POWER_DISTRIBUTION_MEAN = 0.4;

const RARITY_MEAN = RARITIES.reduce((acc, rarity) => {
    const range = BASE_PRICE_RANGES[rarity];
    acc[rarity] = range.min + (range.max - range.min) * POWER_DISTRIBUTION_MEAN;
    return acc;
}, {});

// Expected total base value of one pack, in dollars.
function expectedPackValue(def, setMultiplier) {
    const multiplier = typeof setMultiplier === 'number' ? setMultiplier : 1.0;
    const composition = def.packComposition || {};
    const common = Number(composition.common) || 0;
    const uncommon = Number(composition.uncommon) || 0;
    const rare = Number(composition.rare) || 0;
    const mythicChance = Number(def.mythicChance) || 0;
    const foilChance = Number(def.foilChance) || 0;

    // Each rare slot rolls its mythic upgrade independently -- see generatePackContents.
    const rareSlotMean = (1 - mythicChance) * RARITY_MEAN.rare + mythicChance * RARITY_MEAN.mythic;
    const base = common * RARITY_MEAN.common + uncommon * RARITY_MEAN.uncommon + rare * rareSlotMean;

    const cardsPerPack = common + uncommon + rare;
    if (cardsPerPack <= 0) return 0;

    // One card in the pack may turn foil, chosen uniformly, so the expected uplift is the average
    // card's value times the foil bonus.
    const foilUplift = foilChance * (base / cardsPerPack) * FOIL_VALUE_BONUS;
    return (base + foilUplift) * multiplier;
}

// Calibrated by measurement, not taste. Every shipped set, scored by expectedPackValue against
// its OWN pack price, lands in a tight cluster:
//
//     Alpha_Venture  1.82       Chrono_Clash  1.87       weekly set  1.76
//
// so the band is that cluster with roughly 30% headroom either way. A set is not "balanced" at
// 1.0: opening packs is meant to be worth more than the sticker price, because selling into the
// market pushes prices back down again. The band says "about as generous as the game's own sets".
//
// It does real work at both ends -- the stingiest set the structural rules allow scores about
// 1.08, the most generous about 3.80, and both are rejected.
//
// Scoring each set against its own price is the point. Weekly packs cost $10, and pricing weekly
// content at the standard $6 reads as 2.26 -- an artefact of the comparison, not a property of
// the set. Custom sets are standard-priced, so in practice they are always judged against
// PACK_PRICE_STANDARD; the packPrice option exists so the calibration test can score the shipped
// sets honestly.
const EV_BAND = { min: 1.35, max: 2.35 };
// Within this much of either edge, warn rather than reject.
const EV_WARN_MARGIN = 0.10;

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

const CustomSetValidator = {
    SCHEMA_VERSION: CUSTOM_SCHEMA_VERSION,
    ID_PATTERN: CUSTOM_ID_PATTERN,
    RARITIES: RARITIES,
    LIMITS: LIMITS,
    RARITY_MEAN: RARITY_MEAN,
    BASE_PRICE_RANGES: BASE_PRICE_RANGES,
    PACK_PRICE_STANDARD: PACK_PRICE_STANDARD,
    EV_BAND: EV_BAND,
    expectedPackValue: expectedPackValue,

    // Turns one textarea into a clean list. Blank lines are dropped silently; duplicates are
    // REPORTED rather than quietly removed, because an author who pasted the same name twice
    // wants to know which one to fix.
    parseCardList(text) {
        const seen = new Set();
        const names = [];
        const duplicates = [];
        String(text == null ? '' : text).split('\n').forEach(line => {
            const name = line.trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (seen.has(key)) { duplicates.push(name); return; }
            seen.add(key);
            names.push(name);
        });
        return { names, duplicates };
    },

    // The set's own card names, as a Set -- what restoreOrphanedCollection needs in order to
    // decide which parked entries can come back.
    cardNameSet(def) {
        const names = new Set();
        const cards = (def && def.cards) || {};
        RARITIES.forEach(rarity => {
            (Array.isArray(cards[rarity]) ? cards[rarity] : []).forEach(name => names.add(name));
        });
        return names;
    },

    // options:
    //   id            - the set's key (defaults to def.id)
    //   mode          - 'save' (strict, from the creator) or 'load' (same rules, but skips the
    //                   cross-set uniqueness and set-count checks, which a stored set already
    //                   satisfied when it was saved)
    //   takenIds      - Set of set ids already in use, for collision detection
    //   takenNames    - Map of lowercased set name -> owning id
    //   setCount      - how many custom sets already exist
    //   packPrice     - what one pack of this set costs (default: the standard $6 that every
    //                   custom set is sold at). Only the calibration test passes anything else.
    //   setMultiplier - price multiplier the market would apply (default 1.0, which is what a
    //                   custom set gets). Again, only the calibration test passes anything else.
    //
    // Returns { ok, errors, warnings, normalized }. The `field` on each entry is a stable dotted
    // key the creator maps to a DOM node, so an error can scroll to whatever caused it.
    //
    // normalized NEVER silently clamps. Out-of-range values are errors; the only normalization is
    // trimming, dropping blank lines, and recomputing derived totals.
    validate(def, options) {
        const opts = options || {};
        const mode = opts.mode === 'load' ? 'load' : 'save';
        const errors = [];
        const warnings = [];
        const add = (field, message) => errors.push({ field, message });
        const warn = (field, message) => warnings.push({ field, message });

        if (!def || typeof def !== 'object' || Array.isArray(def)) {
            add('set', 'This set definition is empty or malformed.');
            return { ok: false, errors, warnings, normalized: null };
        }

        // ---- identity ----
        const id = opts.id || def.id;
        if (typeof id !== 'string' || !CUSTOM_ID_PATTERN.test(id)) {
            add('id', 'This set has a malformed internal id.');
        } else if (mode === 'save' && opts.takenIds && opts.takenIds.has(id)) {
            add('id', 'A set with this internal id already exists.');
        }

        if (def.customSchema !== CUSTOM_SCHEMA_VERSION) {
            add('customSchema', 'This set was made by a different version of the set creator ' +
                '(schema ' + def.customSchema + ', expected ' + CUSTOM_SCHEMA_VERSION + ').');
        }
        if (def.status !== 'draft' && def.status !== 'published') {
            add('status', 'Set status must be either draft or published.');
        }

        const name = typeof def.name === 'string' ? def.name.trim() : '';
        if (!name) {
            add('name', 'Give the set a name.');
        } else if (name.length > LIMITS.setNameMax) {
            add('name', 'Set name is too long (' + name.length + ' characters, max ' +
                LIMITS.setNameMax + ').');
        } else if (CONTROL_CHARS.test(name)) {
            add('name', 'Set name contains characters that are not allowed.');
        } else if (mode === 'save' && opts.takenNames) {
            const owner = opts.takenNames.get(name.toLowerCase());
            if (owner && owner !== id) add('name', 'You already have a set called "' + name + '".');
        }

        if (mode === 'save' && typeof opts.setCount === 'number' &&
            opts.setCount >= LIMITS.maxSets && (!opts.takenIds || !opts.takenIds.has(id))) {
            add('set', 'You already have ' + LIMITS.maxSets + ' custom sets, which is the maximum.');
        }

        // ---- cards ----
        const normalizedCards = { common: [], uncommon: [], rare: [], mythic: [] };
        const rawCards = def.cards;

        if (!rawCards || typeof rawCards !== 'object' || Array.isArray(rawCards)) {
            add('cards', 'This set has no card lists.');
        } else {
            const unknown = Object.keys(rawCards).filter(key => RARITIES.indexOf(key) === -1);
            if (unknown.length) {
                add('cards', 'Unknown rarity: ' + unknown.join(', ') + '. A set has exactly ' +
                    'common, uncommon, rare and mythic.');
            }

            // Uniqueness spans all four rarities, not each list on its own.
            // collection[setId][cardName] is a single slot, so the same name in two rarities
            // collapses into one entry whose rarity depends on iteration order -- the player's
            // copies of one card would silently become copies of the other.
            const seen = new Map();

            RARITIES.forEach(rarity => {
                const list = rawCards[rarity];
                if (!Array.isArray(list)) {
                    add('cards.' + rarity, 'The ' + rarity + ' card list is missing.');
                    return;
                }
                const out = [];
                list.forEach(raw => {
                    if (typeof raw !== 'string') {
                        add('cards.' + rarity, 'One of the ' + rarity + ' entries is not text.');
                        return;
                    }
                    const cardName = raw.trim();
                    if (!cardName) return;   // blank lines are dropped, not an error

                    if (cardName.length > LIMITS.cardNameMax) {
                        add('cards.' + rarity, '"' + cardName.slice(0, 20) + '..." is too long ' +
                            '(max ' + LIMITS.cardNameMax + ' characters).');
                        return;
                    }
                    if (CONTROL_CHARS.test(cardName)) {
                        add('cards.' + rarity, 'A ' + rarity + ' card name contains characters ' +
                            'that are not allowed.');
                        return;
                    }
                    const key = cardName.toLowerCase();
                    if (seen.has(key)) {
                        add('cards.' + rarity, '"' + cardName + '" is already in the ' +
                            seen.get(key) + ' list. A card name can only appear once in a set, ' +
                            'because a card is tracked by its name.');
                        return;
                    }
                    seen.set(key, rarity);
                    out.push(cardName);
                });

                normalizedCards[rarity] = out;

                const limit = LIMITS.pool[rarity];
                if (out.length < limit.min) {
                    add('cards.' + rarity, 'Needs at least ' + limit.min + ' ' + rarity +
                        ' cards (has ' + out.length + ').');
                } else if (out.length > limit.max) {
                    add('cards.' + rarity, 'Too many ' + rarity + ' cards (' + out.length +
                        ', max ' + limit.max + ').');
                }
            });

            const totalCards = RARITIES.reduce((sum, r) => sum + normalizedCards[r].length, 0);
            if (totalCards > LIMITS.totalCardsMax) {
                add('cards', 'This set has ' + totalCards + ' cards, and the maximum is ' +
                    LIMITS.totalCardsMax + '.');
            }
        }

        // ---- pack rules ----
        const composition = {};
        const rawComposition = def.packComposition && typeof def.packComposition === 'object'
            ? def.packComposition : null;

        if (!rawComposition) {
            add('packComposition', 'This set has no pack composition.');
        } else {
            ['common', 'uncommon', 'rare'].forEach(rarity => {
                const limit = LIMITS.composition[rarity];
                const value = rawComposition[rarity];
                if (!Number.isInteger(value)) {
                    add('packComposition.' + rarity,
                        'The ' + rarity + ' slot count must be a whole number.');
                    return;
                }
                if (value < limit.min || value > limit.max) {
                    add('packComposition.' + rarity, 'A pack needs between ' + limit.min +
                        ' and ' + limit.max + ' ' + rarity + ' cards (has ' + value + ').');
                    return;
                }
                composition[rarity] = value;
                // A slot cannot draw from a pool too small to fill it.
                if (normalizedCards[rarity].length > 0 && value > normalizedCards[rarity].length) {
                    add('packComposition.' + rarity, 'A pack takes ' + value + ' ' + rarity +
                        ' cards but the set only has ' + normalizedCards[rarity].length + '.');
                }
            });
        }

        const chanceInRange = (field, value, limit, label) => {
            if (typeof value !== 'number' || !isFinite(value)) {
                add(field, label + ' must be a number.');
                return false;
            }
            if (value < limit.min || value > limit.max) {
                add(field, label + ' must be between 1 in ' + Math.round(1 / limit.max) +
                    ' and 1 in ' + Math.round(1 / limit.min) + ' (currently ' +
                    (value > 0 ? '1 in ' + Math.round(1 / value) : 'never') + ').');
                return false;
            }
            return true;
        };
        const mythicOk = chanceInRange('mythicChance', def.mythicChance,
            LIMITS.mythicChance, 'Mythic chance');
        const foilOk = chanceInRange('foilChance', def.foilChance,
            LIMITS.foilChance, 'Foil chance');

        if (!Number.isInteger(def.boosterBoxSize) ||
            def.boosterBoxSize < LIMITS.boosterBoxSize.min ||
            def.boosterBoxSize > LIMITS.boosterBoxSize.max) {
            add('boosterBoxSize', 'A booster box must hold between ' + LIMITS.boosterBoxSize.min +
                ' and ' + LIMITS.boosterBoxSize.max + ' packs (has ' + def.boosterBoxSize + ').');
        }

        // ---- the economy band ----
        // Only meaningful once the numbers it reads are themselves valid; otherwise the author
        // gets a confusing complaint about pack value stacked on top of the real error.
        const compositionComplete = composition.common !== undefined &&
            composition.uncommon !== undefined && composition.rare !== undefined;

        let packValue = null;
        let evRatio = null;

        if (compositionComplete && mythicOk && foilOk) {
            const packPrice = typeof opts.packPrice === 'number' && opts.packPrice > 0
                ? opts.packPrice : PACK_PRICE_STANDARD;
            packValue = expectedPackValue({
                packComposition: composition,
                mythicChance: def.mythicChance,
                foilChance: def.foilChance
            }, opts.setMultiplier);
            evRatio = packValue / packPrice;

            const money = (amount) => '$' + amount.toFixed(2);

            if (evRatio > EV_BAND.max) {
                add('economy', 'A pack of this set would be worth about ' + money(packValue) +
                    ' but costs ' + money(packPrice) + '. Lower the mythic odds, shrink the rare ' +
                    'slot, or add more rare and mythic cards to spread the value out.');
            } else if (evRatio < EV_BAND.min) {
                add('economy', 'A pack of this set would only be worth about ' + money(packValue) +
                    ' against its ' + money(packPrice) + ' price, so opening packs would lose ' +
                    'money. Raise the mythic odds or put more cards in a pack.');
            } else if (evRatio > EV_BAND.max - EV_WARN_MARGIN) {
                warn('economy', 'Packs of this set are on the generous side (about ' +
                    money(packValue) + ' of value for ' + money(packPrice) + ').');
            } else if (evRatio < EV_BAND.min + EV_WARN_MARGIN) {
                warn('economy', 'Packs of this set are on the stingy side (about ' +
                    money(packValue) + ' of value for ' + money(packPrice) + ').');
            }
        }

        if (errors.length > 0) {
            return { ok: false, errors, warnings, normalized: null, packValue, evRatio };
        }

        // Derived fields are recomputed, never taken from the author. totalCards was decorative
        // and wrong in the shipped sets; packSize is declared in all four and read by nothing.
        const totalCards = RARITIES.reduce((sum, r) => sum + normalizedCards[r].length, 0);
        const normalized = {
            name: name,
            totalCards: totalCards,
            packSize: composition.common + composition.uncommon + composition.rare,
            boosterBoxSize: def.boosterBoxSize,
            packComposition: composition,
            mythicChance: def.mythicChance,
            foilChance: def.foilChance,
            isWeekly: false,
            cards: normalizedCards,

            isCustom: true,
            customSchema: CUSTOM_SCHEMA_VERSION,
            status: def.status,
            createdAt: def.createdAt || Date.now(),
            updatedAt: Date.now(),
            publishedAt: def.publishedAt || null,
            quarantine: null
        };

        return { ok: true, errors, warnings, normalized, packValue, evRatio };
    }
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const CustomSetStore = {
    // The id is minted, never author-supplied, and is immutable for the life of the set --
    // including across renames. It keys collection[setId] and cardPrices[setId], so renaming a
    // SET is always free; only renaming a CARD is dangerous.
    mintSetId(name, existingIds) {
        const slug = String(name || '')
            .replace(/[^A-Za-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 24) || 'Set';
        const taken = existingIds || new Set();
        let id;
        do {
            id = 'Custom_' + slug + '_' + Math.random().toString(36).slice(2, 10);
        } while (taken.has(id) || !CUSTOM_ID_PATTERN.test(id));
        return id;
    },

    storage() {
        return window.storageManager || new StorageManager();
    },

    all() {
        return this.storage().loadCustomSets();
    },

    get(setId) {
        return this.all()[setId] || null;
    },

    ids() {
        return new Set(Object.keys(this.all()));
    },

    // Lowercased display name -> owning id, for the uniqueness check.
    names() {
        const map = new Map();
        const sets = this.all();
        Object.keys(sets).forEach(id => {
            const name = sets[id] && sets[id].name;
            if (typeof name === 'string') map.set(name.trim().toLowerCase(), id);
        });
        return map;
    },

    // A brand new empty draft. Deliberately starts with Alpha Venture's pack shape, so an author
    // who changes nothing but the card lists already has a valid, balanced set.
    createDraft(name) {
        const id = this.mintSetId(name, this.ids());
        return {
            id: id,
            name: name,
            boosterBoxSize: 24,
            packComposition: { common: 7, uncommon: 3, rare: 1 },
            mythicChance: 1 / 8,
            foilChance: 1 / 6,
            isWeekly: false,
            cards: { common: [], uncommon: [], rare: [], mythic: [] },
            isCustom: true,
            customSchema: CUSTOM_SCHEMA_VERSION,
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            publishedAt: null,
            quarantine: null
        };
    },

    validationContext(setId) {
        const ids = this.ids();
        ids.delete(setId);
        return {
            id: setId,
            mode: 'save',
            takenIds: ids,
            takenNames: this.names(),
            setCount: Object.keys(this.all()).length
        };
    },

    // Drafts store WITHOUT validation, on purpose. A draft is work in progress and completely
    // inert -- the merge in getAllSets() skips anything not published before it ever reaches the
    // validator -- so refusing to save a half-finished set would just mean an author cannot put
    // one down and come back to it. Publishing is where the rules bite.
    storeDraft(setId, def) {
        if (!CUSTOM_ID_PATTERN.test(setId)) return null;
        return this.storage().saveCustomSet(setId, Object.assign({}, def, {
            id: setId,
            isWeekly: false,
            isCustom: true,
            customSchema: CUSTOM_SCHEMA_VERSION,
            status: 'draft'
        }));
    },

    // Validates, then stores only if valid. Returns the validation result either way, so a caller
    // never has to work out separately whether what it just saved was legal. This is the publish
    // path; see storeDraft for the other one.
    save(setId, def) {
        const result = CustomSetValidator.validate(def, this.validationContext(setId));
        if (!result.ok) return result;
        this.storage().saveCustomSet(setId, result.normalized);
        return result;
    },

    remove(setId) {
        return this.storage().deleteCustomSet(setId);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CustomSetValidator, CustomSetStore };
} else {
    window.CustomSetValidator = CustomSetValidator;
    window.CustomSetStore = CustomSetStore;
}
