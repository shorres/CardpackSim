// Save/load management.
//
// The save used to be three separate localStorage keys written on every player action.
// Two problems: the market blob alone was ~3MB on a fresh game and silently blew past the
// ~5MB localStorage quota after a few weeks of play (QuotaExceededError was swallowed to
// console, so players lost progress with no indication), and three independent writes meant
// a partial failure left the collection advanced against a stale market.
//
// Now: one versioned document, held in memory, flushed to a single file in the app's
// userData directory through the main process (atomic rename + backup). The public methods
// stay synchronous so callers -- including getAllSets(), which runs on hot paths -- are
// unchanged; only initialize() is async.

const SAVE_SCHEMA_VERSION = 1;
const FLUSH_DEBOUNCE_MS = 2000;

// Single in-memory document shared by every StorageManager instance. data.js constructs
// throwaway instances via `window.storageManager || new StorageManager()`, so this cannot
// live on the instance.
const saveDoc = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    game: null,
    market: null,
    weeklySets: {},
    // Player-authored sets. Deliberately a separate bucket from weeklySets rather than a flag
    // inside it: pruneWeeklySets() deletes by age and updateSetLifecycle() stamps
    // featured/standard/legacy on whatever it finds, and neither should ever touch authored
    // content. Keeping the stores apart makes that structural instead of dependent on every
    // future reader remembering to check a flag.
    customSets: {},
    // Collection entries for sets whose definition is no longer available. Parked here
    // rather than deleted -- see loadState().
    orphanedCollections: {}
};

let docLoaded = false;
// Bumped whenever the weekly-set store changes, so getAllSets() can memoize safely.
let weeklySetsRevision = 0;
// Same, for the custom-set store. Both feed getAllSetsCacheKey().
let customSetsRevision = 0;
let flushTimer = null;
let lastFlushFailed = false;

// Every custom-set mutation goes through here. Missing a bump means getAllSets() and
// lookupCardRarity() keep serving a stale view: at best a published set that does not appear, at
// worst a card whose rarity lookup falls back to 'common' and is then priced at common tier
// permanently, because basePrice is written exactly once.
function bumpCustomSets() {
    customSetsRevision++;
    StorageManager.scheduleFlush();
}

function fileApiAvailable() {
    return !!(window.electronAPI && typeof window.electronAPI.saveGame === 'function');
}

class StorageManager {
    constructor() {
        // Legacy localStorage keys: read once for migration, and still the storage backend
        // when running outside Electron (plain browser / dev).
        this.storageKey = 'tcgSimState';
        this.marketStorageKey = 'tcgSimMarketState';
        this.weeklySetsKey = 'tcgSimWeeklySets';
    }

    // Called once from app.js before the GameEngine is constructed.
    static async initialize() {
        if (docLoaded) return { source: 'already-loaded' };

        if (!fileApiAvailable()) {
            StorageManager.loadFromLocalStorage();
            docLoaded = true;
            return { source: 'localStorage' };
        }

        let result;
        try {
            result = await window.electronAPI.loadGame();
        } catch (error) {
            console.error('load-game IPC failed:', error);
            result = { ok: false, error: String(error) };
        }

        if (result && result.ok && result.data) {
            const validated = StorageManager.validate(result.data);
            if (validated) {
                Object.assign(saveDoc, validated);
                weeklySetsRevision++;
                customSetsRevision++;
                docLoaded = true;
                return { source: result.source, warning: result.warning };
            }
            console.error('Save document failed validation; falling back.');
        }

        // No usable save file: migrate the legacy localStorage save if one is present.
        const migrated = StorageManager.loadFromLocalStorage();
        docLoaded = true;

        if (migrated) {
            weeklySetsRevision++;
            customSetsRevision++;
            console.log('Migrated localStorage save to file-based save.');
            StorageManager.flushNow();
            return { source: 'migrated-from-localStorage' };
        }

        return {
            source: (result && result.ok) ? 'new' : 'error',
            error: (result && result.ok) ? undefined : (result && result.error)
        };
    }

    static loadFromLocalStorage() {
        let found = false;
        try {
            const game = localStorage.getItem('tcgSimState');
            const market = localStorage.getItem('tcgSimMarketState');
            const weekly = localStorage.getItem('tcgSimWeeklySets');
            if (game) { saveDoc.game = JSON.parse(game); found = true; }
            if (market) { saveDoc.market = JSON.parse(market); found = true; }
            if (weekly) { saveDoc.weeklySets = JSON.parse(weekly) || {}; found = true; }
        } catch (error) {
            console.error('Could not read legacy localStorage save:', error);
        }
        return found;
    }

    // Reject a structurally wrong document rather than shallow-merging garbage into
    // live state.
    static validate(doc) {
        if (!doc || typeof doc !== 'object') return null;

        const out = {
            schemaVersion: typeof doc.schemaVersion === 'number' ? doc.schemaVersion : SAVE_SCHEMA_VERSION,
            game: null,
            market: null,
            weeklySets: {},
            customSets: {},
            orphanedCollections: {}
        };

        if (doc.game && typeof doc.game === 'object') {
            if (doc.game.collection && typeof doc.game.collection !== 'object') return null;
            if (doc.game.unopenedPacks && typeof doc.game.unopenedPacks !== 'object') return null;
            out.game = doc.game;
        }
        if (doc.market && typeof doc.market === 'object') out.market = doc.market;
        if (doc.weeklySets && typeof doc.weeklySets === 'object') out.weeklySets = doc.weeklySets;
        // Shape only. Whether a stored custom set is *playable* is CustomSetValidator's job, run
        // at merge time in getAllSets(), so that a single bad set is quarantined instead of
        // rejecting the entire save document.
        if (doc.customSets && typeof doc.customSets === 'object') out.customSets = doc.customSets;
        if (doc.orphanedCollections && typeof doc.orphanedCollections === 'object') {
            out.orphanedCollections = doc.orphanedCollections;
        }

        return out;
    }

    // Hook for the UI to surface write failures.
    static setErrorHandler(fn) {
        StorageManager.onError = fn;
    }

    static scheduleFlush() {
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(() => {
            flushTimer = null;
            StorageManager.flushNow();
        }, FLUSH_DEBOUNCE_MS);
    }

    static flushNow() {
        if (flushTimer) {
            clearTimeout(flushTimer);
            flushTimer = null;
        }

        saveDoc.schemaVersion = SAVE_SCHEMA_VERSION;

        if (!fileApiAvailable()) {
            try {
                localStorage.setItem('tcgSimState', JSON.stringify(saveDoc.game));
                localStorage.setItem('tcgSimMarketState', JSON.stringify(saveDoc.market));
                localStorage.setItem('tcgSimWeeklySets', JSON.stringify(saveDoc.weeklySets));
                lastFlushFailed = false;
            } catch (error) {
                StorageManager.reportFailure(error && error.name === 'QuotaExceededError'
                    ? 'browser storage is full'
                    : String(error));
            }
            return Promise.resolve();
        }

        return Promise.resolve(window.electronAPI.saveGame(saveDoc))
            .then((result) => {
                if (result && result.ok) {
                    if (lastFlushFailed && StorageManager.onError) {
                        StorageManager.onError('Saving is working again.', 'success');
                    }
                    lastFlushFailed = false;
                } else {
                    StorageManager.reportFailure((result && result.error) || 'unknown error');
                }
            })
            .catch((error) => StorageManager.reportFailure(String(error)));
    }

    static reportFailure(message) {
        console.error('Save failed:', message);
        // Only nag once per failure streak.
        if (!lastFlushFailed && StorageManager.onError) {
            StorageManager.onError('Could not save your progress: ' + message, 'error');
        }
        lastFlushFailed = true;
    }

    // ---- synchronous API used by the rest of the app ----

    saveState(state) {
        saveDoc.game = state;
        StorageManager.scheduleFlush();
    }

    loadState() {
        const parsedState = saveDoc.game;
        if (!parsedState) return null;

        // Ensure every known set is represented, and drop sets that no longer exist.
        const allSets = window.getAllSets ? window.getAllSets() : (window.TCG_SETS || {});

        if (!parsedState.unopenedPacks) parsedState.unopenedPacks = {};
        if (!parsedState.collection) parsedState.collection = {};

        Object.keys(allSets).forEach(setId => {
            if (typeof parsedState.unopenedPacks[setId] === 'undefined') parsedState.unopenedPacks[setId] = 0;
            if (!parsedState.collection[setId]) parsedState.collection[setId] = {};
        });

        Object.keys(parsedState.unopenedPacks).forEach(setId => {
            if (!allSets[setId]) delete parsedState.unopenedPacks[setId];
        });

        // A set can disappear from allSets (renamed in an update, or a weekly set whose
        // definition is no longer stored). The cards cannot be shown or priced without it,
        // but this used to *delete* them outright -- permanent, silent loss of things the
        // player earned. Park them instead, so a later version can restore them.
        Object.keys(parsedState.collection).forEach(setId => {
            if (allSets[setId]) return;

            const cardCount = this.parkCollection(setId, parsedState.collection);
            if (cardCount > 0) {
                console.warn(`Set "${setId}" has no definition; parking ${cardCount} ` +
                    'collection entr' + (cardCount === 1 ? 'y' : 'ies') +
                    ' in orphanedCollections instead of deleting them.');
            }
        });

        return parsedState;
    }

    saveMarketState(marketState) {
        saveDoc.market = marketState;
        StorageManager.scheduleFlush();
    }

    loadMarketState() {
        return saveDoc.market || null;
    }

    saveWeeklySet(setId, setData) {
        saveDoc.weeklySets[setId] = {
            ...setData,
            storedDate: Date.now(),
            lifecycle: 'featured',
            featuredUntil: Date.now() + (7 * 24 * 60 * 60 * 1000),
            standardUntil: Date.now() + (30 * 24 * 60 * 60 * 1000),
            rotateDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
        };
        weeklySetsRevision++;
        StorageManager.scheduleFlush();
        console.log('Stored weekly set: ' + setId);
    }

    loadWeeklySets() {
        return saveDoc.weeklySets || {};
    }

    getWeeklySetsRevision() {
        return weeklySetsRevision;
    }

    updateSetLifecycle(setId, newLifecycle) {
        if (saveDoc.weeklySets[setId]) {
            saveDoc.weeklySets[setId].lifecycle = newLifecycle;
            weeklySetsRevision++;
            StorageManager.scheduleFlush();
        }
    }

    // ---- custom sets ----
    //
    // Authored content, not progress: preserved by clearState() and resetGameState(), wiped only
    // by the dev-only clearAllData().

    loadCustomSets() {
        return saveDoc.customSets || {};
    }

    getCustomSetsRevision() {
        return customSetsRevision;
    }

    // Copies in and copies out. A shallow spread would leave the nested cards object shared with
    // the caller, which means the creator's in-progress working copy silently mutates the stored
    // set -- edits appear saved without a save, and the published-name lock can be walked straight
    // past. Sets are a few KB and this runs on explicit saves, not a hot path.
    saveCustomSet(setId, definition) {
        const stored = JSON.parse(JSON.stringify(
            Object.assign({}, definition, { updatedAt: Date.now() })));
        saveDoc.customSets[setId] = stored;
        bumpCustomSets();
        return JSON.parse(JSON.stringify(stored));
    }

    deleteCustomSet(setId) {
        if (!saveDoc.customSets[setId]) return false;
        delete saveDoc.customSets[setId];
        bumpCustomSets();
        return true;
    }

    // ---- collection parking ----

    // Move a set's collection entries into orphanedCollections and remove them from the live
    // collection. Two callers: loadState(), for a set whose definition has vanished, and
    // unpublishing a custom set mid-session. They are the same operation, so there is one
    // implementation -- a second copy is where the divergence bug would live.
    //
    // Returns the number of entries parked.
    parkCollection(setId, collection) {
        const owned = (collection && collection[setId]) || {};
        const cardCount = Object.keys(owned).length;

        if (cardCount > 0) {
            // Merge rather than replace. A set can be parked more than once (unpublish, edit,
            // unpublish again) and anything parked earlier is still the player's property.
            saveDoc.orphanedCollections[setId] = {
                ...(saveDoc.orphanedCollections[setId] || {}),
                ...owned
            };
        }
        if (collection) delete collection[setId];
        if (cardCount > 0) StorageManager.scheduleFlush();

        return cardCount;
    }

    // The inverse, which has never existed -- orphanedCollections has been write-only. Restores
    // entries whose card still exists in the set; anything else stays parked rather than being
    // dropped, because a draft edit may have renamed or removed that card and the player may yet
    // add it back.
    restoreOrphanedCollection(setId, collection, validNames) {
        const parked = saveDoc.orphanedCollections[setId];
        if (!parked || !collection) return { restored: 0, stillParked: 0 };

        if (!collection[setId]) collection[setId] = {};
        let restored = 0;
        let stillParked = 0;

        // Object.keys snapshots, so deleting entries while iterating it is safe.
        Object.keys(parked).forEach(cardName => {
            if (validNames && !validNames.has(cardName)) { stillParked++; return; }
            collection[setId][cardName] = parked[cardName];
            delete parked[cardName];
            restored++;
        });

        if (stillParked === 0) delete saveDoc.orphanedCollections[setId];
        StorageManager.scheduleFlush();

        return { restored, stillParked };
    }

    // Parked entries survive almost everything, because a set can come back. Permanently
    // deleting the set is the one case where they must not: the player asked for the set and
    // everything in it to be gone, and leaving the entries behind would silently resurrect them
    // if a later set ever minted the same id.
    discardOrphanedCollection(setId) {
        if (!saveDoc.orphanedCollections[setId]) return false;
        delete saveDoc.orphanedCollections[setId];
        StorageManager.scheduleFlush();
        return true;
    }

    // Remove old weekly sets the player holds no cards from. Without this the set list grows
    // by one set per week forever, and every price / listing / history structure is keyed
    // off it.
    pruneWeeklySets(collection, keepDays = 60) {
        const now = Date.now();
        const removed = [];

        Object.keys(saveDoc.weeklySets).forEach(setId => {
            const set = saveDoc.weeklySets[setId];
            const age = now - (set.storedDate || now);
            if (age < keepDays * 24 * 60 * 60 * 1000) return;

            const owned = collection && collection[setId];
            const ownsCards = owned && Object.keys(owned).some(cardName => {
                const entry = owned[cardName];
                return entry && ((entry.count || 0) > 0 || (entry.foilCount || 0) > 0);
            });
            if (ownsCards) return;

            delete saveDoc.weeklySets[setId];
            removed.push(setId);
        });

        if (removed.length > 0) {
            console.log('Pruned ' + removed.length + ' empty legacy weekly set(s): ' + removed.join(', '));
            weeklySetsRevision++;
            StorageManager.scheduleFlush();
        }
        return removed;
    }

    clearState() {
        saveDoc.game = null;
        saveDoc.market = null;
        StorageManager.flushNow();
    }

    // Dev-only (app.js gates it on electronAPI.isDev). Its contract is "everything", which
    // includes authored content -- unlike resetGameState(), which a player reaches from the File
    // menu and which must never destroy sets they made.
    clearAllData() {
        saveDoc.game = null;
        saveDoc.market = null;
        saveDoc.weeklySets = {};
        saveDoc.customSets = {};
        saveDoc.orphanedCollections = {};
        weeklySetsRevision++;
        customSetsRevision++;
        try {
            localStorage.removeItem('tcgSimState');
            localStorage.removeItem('tcgSimMarketState');
            localStorage.removeItem('tcgSimWeeklySets');
        } catch (error) {
            console.warn('Could not clear legacy localStorage keys:', error);
        }
        StorageManager.flushNow();
        console.log('All save data cleared');
        return true;
    }

    resetGameState() {
        saveDoc.game = null;
        saveDoc.market = null;
        StorageManager.flushNow();
        console.log('Game state reset (weekly and custom sets preserved)');
        return true;
    }
}

StorageManager.onError = null;

// Last-gasp write on window close. The IPC message is dispatched synchronously even though
// the handler resolves asynchronously, so the main process still receives it.
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (flushTimer) StorageManager.flushNow();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StorageManager };
} else {
    window.StorageManager = StorageManager;
}
