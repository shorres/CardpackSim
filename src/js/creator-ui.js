// The set creator: a fourth tab, not a modal.
//
// Authoring 40-300 card names with a live preview is not a task-sized interaction, so it gets a
// pane rather than a dialog like the sell and wishlist flows.
//
// The editing model is one textarea per rarity, one name per line. That is a deliberate choice
// over per-card rows:
//
//   - the realistic input is "I have a list of names" from a document, a spreadsheet or a
//     generator, and paste is the native verb for that;
//   - rarity assignment becomes free, because the column you paste into IS the rarity -- no
//     dropdowns, no bulk select, no drag targets;
//   - moving a card between rarities is cut-and-paste, which is exactly the operation a draft
//     allows and a published set forbids, so the affordance matches the rule;
//   - it is four DOM nodes instead of up to 300 rows, inside a UI that rebuilds lists wholesale.
//
// Lives outside ui.js, which is already 4,400 lines. UIManager owns an instance and this class
// holds a back-reference for the few things it needs from it.

class CreatorUI {
    constructor(uiManager) {
        this.ui = uiManager;
        this.currentSetId = null;
        // The set as currently typed, which is not what is stored until a save succeeds.
        this.working = null;
        this.lastVerdict = null;
        this.confirmAction = null;

        this.cacheElements();
        this.bindStaticListeners();
    }

    // ---- setup -------------------------------------------------------------

    cacheElements() {
        const byId = (id) => document.getElementById(id);

        this.rail = byId('creator-set-rows');
        this.railEmpty = byId('creator-rail-empty');
        this.placeholder = byId('creator-placeholder');
        this.editor = byId('creator-editor');
        this.banner = byId('creator-quarantine-banner');

        this.nameInput = byId('creator-name');
        this.statusPill = byId('creator-status-pill');
        this.cardCount = byId('creator-card-count');

        this.rules = {
            common: byId('cc-common'),
            uncommon: byId('cc-uncommon'),
            rare: byId('cc-rare'),
            mythicOneIn: byId('cc-mythic-one-in'),
            foilOneIn: byId('cc-foil-one-in'),
            boxSize: byId('cc-box-size')
        };
        this.economy = byId('creator-economy');

        this.lists = {
            common: byId('creator-list-common'),
            uncommon: byId('creator-list-uncommon'),
            rare: byId('creator-list-rare'),
            mythic: byId('creator-list-mythic')
        };
        this.counts = {
            common: byId('creator-count-common'),
            uncommon: byId('creator-count-uncommon'),
            rare: byId('creator-count-rare'),
            mythic: byId('creator-count-mythic')
        };

        this.preview = byId('creator-preview');
        this.errorList = byId('creator-errors');

        this.saveBtn = byId('creator-save-btn');
        this.publishBtn = byId('creator-publish-btn');
        this.unpublishBtn = byId('creator-unpublish-btn');
        this.deleteBtn = byId('creator-delete-btn');

        this.confirmModal = byId('creator-confirm-modal');
        this.confirmTitle = byId('creator-confirm-title');
        this.confirmBody = byId('creator-confirm-body');
        this.confirmTyped = byId('creator-confirm-typed');
        this.confirmInput = byId('creator-confirm-input');
        this.confirmOk = byId('creator-confirm-ok');
        this.confirmCancel = byId('creator-confirm-cancel');
    }

    // Static controls get real listeners; only the generated set rows go through the delegated
    // data-action handler in ui.js. Either way there are no inline handlers -- the CSP forbids them.
    bindStaticListeners() {
        const revalidate = () => this.onEdit();

        this.nameInput.addEventListener('input', revalidate);
        Object.keys(this.rules).forEach(key => this.rules[key].addEventListener('input', revalidate));
        Object.keys(this.lists).forEach(rarity => this.lists[rarity].addEventListener('input', revalidate));

        this.saveBtn.addEventListener('click', () => this.saveDraft());
        this.publishBtn.addEventListener('click', () => this.publish());
        this.unpublishBtn.addEventListener('click', () => this.confirmUnpublish());
        this.deleteBtn.addEventListener('click', () => this.confirmDelete());

        this.confirmCancel.addEventListener('click', () => this.closeConfirm());
        this.confirmOk.addEventListener('click', () => this.runConfirm());
        this.confirmInput.addEventListener('input', () => this.updateConfirmOk());
    }

    // ---- rendering ---------------------------------------------------------

    render() {
        this.renderRail();
        if (this.currentSetId && !window.CustomSetStore.get(this.currentSetId)) {
            this.currentSetId = null;
            this.working = null;
        }
        if (this.working) {
            this.renderEditor();
        } else {
            this.editor.classList.add('hidden');
            this.placeholder.classList.remove('hidden');
        }
    }

    renderRail() {
        const sets = window.CustomSetStore.all();
        const ids = Object.keys(sets);

        this.railEmpty.classList.toggle('hidden', ids.length > 0);

        this.rail.innerHTML = ids.map(setId => {
            // Show the open set as it is currently being typed rather than as it was last stored,
            // or the rail sits there saying "Untitled Set - 0 cards" while the editor is full.
            const def = (setId === this.currentSetId && this.working) ? this.working : sets[setId];
            const total = window.CustomSetValidator.RARITIES
                .reduce((sum, r) => sum + ((def.cards && def.cards[r]) || []).length, 0);
            const published = def.status === 'published';
            const broken = !!def.quarantine;
            const pillClass = broken ? 'creator-pill-broken'
                : published ? 'creator-pill-published' : 'creator-pill-draft';
            const pillText = broken ? 'needs fixing' : def.status;

            return `
                <button type="button" data-action="creator-edit" data-set-id="${escapeHtml(setId)}"
                        class="creator-set-row ${setId === this.currentSetId ? 'is-active' : ''}">
                    <span class="creator-set-name">${escapeHtml((def.name || '').trim() || 'Untitled Set')}</span>
                    <span class="creator-pill ${pillClass}">${escapeHtml(pillText)}</span>
                    <span class="creator-set-meta">${total} cards</span>
                </button>`;
        }).join('');
    }

    renderEditor() {
        this.placeholder.classList.add('hidden');
        this.editor.classList.remove('hidden');

        const def = this.working;
        const published = def.status === 'published';

        this.statusPill.textContent = published ? 'published' : 'draft';
        this.statusPill.className = 'creator-pill ' +
            (published ? 'creator-pill-published' : 'creator-pill-draft');
        this.unpublishBtn.classList.toggle('hidden', !published);
        this.publishBtn.textContent = published ? 'Save & Republish' : 'Publish';

        // Published sets lock their card lists. Enforcement is a diff at save time, not a
        // read-only textarea, but making them read-only is the honest visual signal.
        Object.keys(this.lists).forEach(rarity => {
            this.lists[rarity].readOnly = published;
            this.lists[rarity].classList.toggle('is-locked', published);
        });

        this.renderQuarantineBanner(def);
        this.validateAndPaint();
    }

    renderQuarantineBanner(def) {
        if (!def.quarantine) {
            this.banner.classList.add('hidden');
            this.banner.innerHTML = '';
            return;
        }
        const reasons = def.quarantine.errors.map(e => `<li>${escapeHtml(e.message)}</li>`).join('');
        this.banner.classList.remove('hidden');
        this.banner.innerHTML = `
            <strong>This set can't be loaded.</strong>
            <p class="text-sm mt-1">It is published but failed its checks, so it is out of the game
            for now. Your cards from it are safe and will come back when you fix it.</p>
            <ul class="text-sm mt-2 list-disc list-inside">${reasons}</ul>`;
    }

    // Debounced through the existing helper so a fast typist does not revalidate per keystroke.
    onEdit() {
        this.ui.debounceRender('creator-edit', () => {
            this.readForm();
            this.validateAndPaint();
        }, 250);
    }

    // The form is the source of truth while the editor is open.
    readForm() {
        if (!this.working) return;
        const def = this.working;

        def.name = this.nameInput.value;
        def.packComposition = {
            common: this.intFrom(this.rules.common),
            uncommon: this.intFrom(this.rules.uncommon),
            rare: this.intFrom(this.rules.rare)
        };
        // Odds are entered as "1 in N" because that is how players think about pull rates.
        def.mythicChance = this.chanceFrom(this.rules.mythicOneIn);
        def.foilChance = this.chanceFrom(this.rules.foilOneIn);
        def.boosterBoxSize = this.intFrom(this.rules.boxSize);

        // A published set's lists are read-only, so leave the stored ones alone rather than
        // round-tripping them through the parser.
        if (def.status !== 'published') {
            def.cards = def.cards || {};
            Object.keys(this.lists).forEach(rarity => {
                def.cards[rarity] = window.CustomSetValidator.parseCardList(this.lists[rarity].value).names;
            });
        }
    }

    intFrom(input) {
        const value = parseInt(input.value, 10);
        return Number.isNaN(value) ? null : value;
    }

    chanceFrom(input) {
        const n = parseInt(input.value, 10);
        if (Number.isNaN(n) || n <= 0) return null;
        return 1 / n;
    }

    writeForm(def) {
        this.nameInput.value = def.name || '';
        const c = def.packComposition || {};
        this.rules.common.value = c.common == null ? '' : c.common;
        this.rules.uncommon.value = c.uncommon == null ? '' : c.uncommon;
        this.rules.rare.value = c.rare == null ? '' : c.rare;
        this.rules.mythicOneIn.value = def.mythicChance ? Math.round(1 / def.mythicChance) : '';
        this.rules.foilOneIn.value = def.foilChance ? Math.round(1 / def.foilChance) : '';
        this.rules.boxSize.value = def.boosterBoxSize == null ? '' : def.boosterBoxSize;

        Object.keys(this.lists).forEach(rarity => {
            this.lists[rarity].value = ((def.cards && def.cards[rarity]) || []).join('\n');
        });
    }

    validateAndPaint() {
        if (!this.working) return;
        const verdict = window.CustomSetValidator.validate(
            this.working, window.CustomSetStore.validationContext(this.currentSetId));
        this.lastVerdict = verdict;

        const total = window.CustomSetValidator.RARITIES
            .reduce((sum, r) => sum + ((this.working.cards && this.working.cards[r]) || []).length, 0);
        this.cardCount.textContent = total + (total === 1 ? ' card' : ' cards');

        Object.keys(this.counts).forEach(rarity => {
            const list = (this.working.cards && this.working.cards[rarity]) || [];
            const min = window.CustomSetValidator.LIMITS.pool[rarity].min;
            this.counts[rarity].textContent = list.length;
            this.counts[rarity].classList.toggle('is-short', list.length < min);
            this.counts[rarity].title = list.length < min
                ? 'Needs at least ' + min : '';
        });

        this.renderEconomy(verdict);
        this.renderProblems(verdict);
        this.renderPreview();
        this.renderRail();

        // Publishing a set that cannot validate would strand the player's cards in quarantine.
        this.publishBtn.disabled = !verdict.ok;
        this.publishBtn.classList.toggle('is-disabled', !verdict.ok);
    }

    renderEconomy(verdict) {
        const V = window.CustomSetValidator;
        const ratio = verdict.evRatio;
        if (ratio == null) {
            this.economy.innerHTML = '<span class="creator-ev creator-ev-unknown">' +
                'Pack value: set the pack rules to see this</span>';
            return;
        }
        const inBand = ratio >= V.EV_BAND.min && ratio <= V.EV_BAND.max;
        const nearEdge = inBand && (ratio > V.EV_BAND.max - 0.10 || ratio < V.EV_BAND.min + 0.10);
        const tone = !inBand ? 'creator-ev-bad' : nearEdge ? 'creator-ev-warn' : 'creator-ev-good';
        const verdictText = !inBand
            ? (ratio > V.EV_BAND.max ? 'too generous' : 'not worth opening')
            : nearEdge ? 'close to the edge' : 'in line with the game’s sets';

        this.economy.innerHTML = `
            <span class="creator-ev ${tone}">
                A pack would be worth about <strong>$${verdict.packValue.toFixed(2)}</strong>
                and costs $${V.PACK_PRICE_STANDARD.toFixed(2)} &mdash; ${escapeHtml(verdictText)}
            </span>`;
    }

    renderProblems(verdict) {
        const rows = verdict.errors.map(e => ({ tone: 'error', item: e }))
            .concat(verdict.warnings.map(w => ({ tone: 'warning', item: w })));

        if (rows.length === 0) {
            this.errorList.innerHTML = '<p class="creator-ok">Everything checks out.</p>';
            return;
        }

        this.errorList.innerHTML = rows.map(({ tone, item }) => `
            <button type="button" class="creator-problem creator-problem-${tone}"
                    data-action="creator-focus-field" data-field="${escapeHtml(item.field)}">
                ${escapeHtml(item.message)}
            </button>`).join('');
    }

    // Reuses createCardFaceHTML unchanged. Every face is a cached glyph-art string keyed on
    // name + rarity, so repainting the preview on every keystroke is a handful of map lookups.
    renderPreview() {
        const picks = [];
        window.CustomSetValidator.RARITIES.forEach(rarity => {
            const list = (this.working.cards && this.working.cards[rarity]) || [];
            if (list[0]) picks.push({ name: list[0], rarity });
            if (list.length > 1) picks.push({ name: list[list.length - 1], rarity });
        });

        if (picks.length === 0) {
            this.preview.innerHTML = '<p class="text-sm" style="color: var(--text-secondary);">' +
                'Add some cards to see what they look like.</p>';
            return;
        }

        this.preview.innerHTML = picks.slice(0, 8).map(pick => `
            <div class="card-face relative border-4 rounded-lg p-2 h-40 flex flex-col justify-between
                        shadow-md rarity-${escapeHtml(pick.rarity)}">
                ${this.ui.createCardFaceHTML(pick.name, pick.rarity)}
            </div>`).join('');
    }

    focusField(field) {
        const map = {
            name: this.nameInput,
            'packComposition.common': this.rules.common,
            'packComposition.uncommon': this.rules.uncommon,
            'packComposition.rare': this.rules.rare,
            mythicChance: this.rules.mythicOneIn,
            foilChance: this.rules.foilOneIn,
            boosterBoxSize: this.rules.boxSize,
            'cards.common': this.lists.common,
            'cards.uncommon': this.lists.uncommon,
            'cards.rare': this.lists.rare,
            'cards.mythic': this.lists.mythic
        };
        const target = map[field] || (field === 'economy' ? this.economy : null);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof target.focus === 'function') target.focus();
    }

    // ---- actions -----------------------------------------------------------

    newSet() {
        const draft = window.CustomSetStore.createDraft('Untitled Set');
        // Store it straight away, so it shows up in the rail and survives switching tabs. It is
        // a draft, so it is invisible to the game either way.
        window.CustomSetStore.storeDraft(draft.id, draft);
        this.currentSetId = draft.id;
        this.working = draft;
        this.writeForm(draft);
        this.render();
        this.nameInput.focus();
        this.nameInput.select();
    }

    edit(setId) {
        const def = window.CustomSetStore.get(setId);
        if (!def) return;
        this.currentSetId = setId;
        // Work on a copy: nothing the author types reaches the store until a save succeeds.
        this.working = JSON.parse(JSON.stringify(def));
        this.working.id = setId;
        this.writeForm(this.working);
        this.render();
    }

    // Always succeeds: a draft is allowed to be incomplete. Any remaining problems are shown as
    // the list of things to fix before it can be published, not as a reason to refuse the save.
    saveDraft() {
        if (!this.working) return;
        this.readForm();

        // Saving as a draft takes a published set out of the game, so its cards have to be parked
        // rather than left dangling against a set that no longer resolves.
        const wasPublished = (window.CustomSetStore.get(this.currentSetId) || {}).status === 'published';

        window.CustomSetStore.storeDraft(this.currentSetId, this.working);
        this.working.status = 'draft';
        if (wasPublished) {
            this.parkAndRefresh(this.currentSetId);
            this.afterSetListChanged();
        } else {
            this.render();
        }

        const problems = this.lastVerdict && !this.lastVerdict.ok ? this.lastVerdict.errors.length : 0;
        this.ui.showNotification(problems === 0
            ? 'Draft saved.'
            : 'Draft saved. ' + problems + ' thing' + (problems === 1 ? '' : 's') +
              ' to fix before you can publish.', 'success', 4000);
    }

    publish() {
        if (!this.working) return;
        // Read the form first and let the save revalidate it. The disabled Publish button is a
        // UX signal built from the last debounced pass, and clicking fast enough can outrun it.
        this.readForm();

        const stored = window.CustomSetStore.get(this.currentSetId);

        // Published card names are immutable: they key the collection, the price table, the price
        // history and the art cache, and the base price is seeded from the name. Renaming one
        // does not move the player's copies, it strands them. Additions are fine.
        if (stored && stored.status === 'published') {
            const missing = this.findRemovedCards(stored, this.working);
            if (missing) {
                this.ui.showNotification('"' + missing + '" can’t be renamed or removed while ' +
                    'the set is published. Unpublish first — your collection is kept safe.',
                    'error', 6000);
                return;
            }
        }

        const result = window.CustomSetStore.save(this.currentSetId,
            Object.assign({}, this.working, {
                status: 'published',
                publishedAt: (stored && stored.publishedAt) || Date.now()
            }));

        if (!result.ok) {
            this.lastVerdict = result;
            this.renderProblems(result);
            this.ui.showNotification('Could not publish: ' + result.errors[0].message, 'error', 5000);
            return;
        }

        this.working = Object.assign({}, result.normalized, { id: this.currentSetId });
        const def = window.getAllSets()[this.currentSetId];

        if (def) {
            // initializeSetPrices skips cards that already have prices, so this both seeds a new
            // set and fills in cards added to an existing one. Without it new cards get prices
            // only through the lazy fallback, which warns and misses their supply data.
            this.ui.gameEngine.marketEngine.initializeSetPrices(this.currentSetId, def);

            const game = this.ui.gameEngine;
            if (!game.state.collection[this.currentSetId]) game.state.collection[this.currentSetId] = {};
            if (typeof game.state.unopenedPacks[this.currentSetId] === 'undefined') {
                game.state.unopenedPacks[this.currentSetId] = 0;
            }

            const restored = game.storageManager.restoreOrphanedCollection(
                this.currentSetId, game.state.collection, window.CustomSetValidator.cardNameSet(def));
            if (restored.restored > 0) {
                const tail = restored.stillParked > 0
                    ? ' ' + restored.stillParked + ' more no longer exist in this set and are kept in case you add them back.'
                    : '';
                this.ui.showNotification('Published. Restored ' + restored.restored +
                    ' card' + (restored.restored === 1 ? '' : 's') + ' you already had.' + tail, 'success', 6000);
            } else {
                this.ui.showNotification('Published. "' + def.name + '" is now in the game.', 'success');
            }
            game.saveState();
        }

        this.afterSetListChanged();
    }

    // The first stored card name that is gone from the edited set, or null.
    findRemovedCards(stored, edited) {
        const editedNames = window.CustomSetValidator.cardNameSet(edited);
        const storedNames = window.CustomSetValidator.cardNameSet(stored);
        for (const name of storedNames) {
            if (!editedNames.has(name)) return name;
        }
        return null;
    }

    confirmUnpublish() {
        const def = window.CustomSetStore.get(this.currentSetId);
        if (!def) return;
        const held = this.describeHoldings(this.currentSetId);

        this.openConfirm({
            title: 'Unpublish "' + (def.name || this.currentSetId) + '"?',
            body: '<p>It leaves the game and becomes editable again, including renaming cards.</p>' +
                '<p>' + held + ' Your cards are kept safe and come back when you republish.</p>' +
                (this.unopenedPackCount() > 0
                    ? '<p class="creator-warn">You have ' + this.unopenedPackCount() +
                      ' unopened pack(s) of this set. They will be lost.</p>'
                    : ''),
            okLabel: 'Unpublish',
            typedConfirmation: null,
            run: () => this.doUnpublish()
        });
    }

    doUnpublish() {
        const setId = this.currentSetId;
        const stored = window.CustomSetStore.get(setId);
        if (!stored) return;

        const stashed = window.CustomSetStore.storeDraft(setId, stored);
        this.parkAndRefresh(setId);
        this.working = Object.assign({}, stashed, { id: setId });
        this.writeForm(this.working);
        this.afterSetListChanged();
        this.ui.showNotification('Unpublished. Your cards are parked until you publish it again.',
            'success', 5000);
    }

    // Move the player's cards out of the live collection and forget the packs. Market state is
    // deliberately left intact so republishing picks up exactly where it left off.
    parkAndRefresh(setId) {
        const game = this.ui.gameEngine;
        game.storageManager.parkCollection(setId, game.state.collection);
        delete game.state.unopenedPacks[setId];
        if (game.state.selectedSet === setId) game.state.selectedSet = game.getDefaultSet();
        game.updateNetWorth();
        game.saveState();
    }

    confirmDelete() {
        const def = window.CustomSetStore.get(this.currentSetId);
        if (!def) {
            // Never saved: there is nothing to destroy, so just drop it.
            this.currentSetId = null;
            this.working = null;
            this.render();
            return;
        }

        this.openConfirm({
            title: 'Delete "' + (def.name || this.currentSetId) + '" permanently?',
            body: '<p>' + this.describeHoldings(this.currentSetId) + '</p>' +
                '<p class="creator-warn">This cannot be undone. The set, its cards, its prices and ' +
                'its history are all removed.</p>' +
                '<p>If you only want to edit the card names, use <strong>Unpublish</strong> ' +
                'instead — that keeps everything.</p>',
            okLabel: 'Delete Forever',
            typedConfirmation: def.name || this.currentSetId,
            run: () => this.doDelete()
        });
    }

    doDelete() {
        const setId = this.currentSetId;
        const game = this.ui.gameEngine;

        window.CustomSetStore.remove(setId);
        game.storageManager.parkCollection(setId, game.state.collection);
        game.storageManager.discardOrphanedCollection(setId);
        delete game.state.unopenedPacks[setId];
        if (game.state.selectedSet === setId) game.state.selectedSet = game.getDefaultSet();
        game.marketEngine.purgeSet(setId);
        game.updateNetWorth();
        game.saveState();
        // Destructive: do not wait out the 2s debounce.
        window.StorageManager.flushNow();

        this.currentSetId = null;
        this.working = null;
        this.afterSetListChanged();
        this.ui.showNotification('Set deleted.', 'success');
    }

    // Everything that has to happen once the list of sets in the game has changed.
    afterSetListChanged() {
        this.ui.populateSetSelectors();
        this.ui.refreshUI();
        this.render();
    }

    // ---- helpers -----------------------------------------------------------

    unopenedPackCount() {
        return this.ui.gameEngine.state.unopenedPacks[this.currentSetId] || 0;
    }

    describeHoldings(setId) {
        const owned = this.ui.gameEngine.state.collection[setId] || {};
        const names = Object.keys(owned);
        let copies = 0;
        names.forEach(name => {
            copies += (owned[name].count || 0) + (owned[name].foilCount || 0);
        });
        if (copies === 0) return 'You have no cards from this set.';
        return 'You have ' + copies + ' card' + (copies === 1 ? '' : 's') +
            ' from this set, across ' + names.length + ' different card' + (names.length === 1 ? '' : 's') + '.';
    }

    openConfirm({ title, body, okLabel, typedConfirmation, run }) {
        this.confirmTitle.textContent = title;
        this.confirmBody.innerHTML = body;
        this.confirmOk.textContent = okLabel;
        this.confirmAction = run;

        this.confirmExpected = typedConfirmation;
        this.confirmInput.value = '';
        this.confirmTyped.classList.toggle('hidden', !typedConfirmation);
        this.updateConfirmOk();

        this.confirmModal.classList.remove('hidden');
        if (typedConfirmation) this.confirmInput.focus();
    }

    updateConfirmOk() {
        const needsTyping = !!this.confirmExpected;
        const matches = !needsTyping || this.confirmInput.value.trim() === this.confirmExpected;
        this.confirmOk.disabled = !matches;
        this.confirmOk.classList.toggle('is-disabled', !matches);
    }

    closeConfirm() {
        this.confirmModal.classList.add('hidden');
        this.confirmAction = null;
        this.confirmExpected = null;
    }

    runConfirm() {
        const action = this.confirmAction;
        if (!action || this.confirmOk.disabled) return;
        this.closeConfirm();
        action();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CreatorUI };
} else {
    window.CreatorUI = CreatorUI;
}
