// UI Rendering and Interaction Management
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentOpeningPack = null;
        
        // Set up callback for listing sales
        this.gameEngine.onListingSoldCallback = (buyer, listing, result, proceeds) => {
            this.handleListingSold(buyer, listing, result, proceeds);
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupPackTearing();
        this.initializeThemes();
    }

    initializeElements() {
        // Tab elements
        this.packsTab = document.getElementById('packs-tab');
        this.collectionTab = document.getElementById('collection-tab');
        this.marketTab = document.getElementById('market-tab');
        this.packsContent = document.getElementById('packs-content');
        this.collectionContent = document.getElementById('collection-content');
        this.marketContent = document.getElementById('market-content');
        
        // DOM elements
        this.setSelector = document.getElementById('set-selector');
        this.collectionSetSelector = document.getElementById('collection-set-selector');
        this.buyPackBtn = document.getElementById('buy-pack-btn');
        this.buyBoxBtn = document.getElementById('buy-box-btn');
        this.unopenedPacksDisplay = document.getElementById('unopened-packs-display');
        this.openedPackDisplay = document.getElementById('opened-pack-display');
        this.collectionDisplay = document.getElementById('collection-display');
        this.collectionProgress = document.getElementById('collection-progress');
        
        // Player stats elements
        this.playerWallet = document.getElementById('player-wallet');
        this.playerNetworth = document.getElementById('player-networth');
        this.playerTitle = document.getElementById('player-title');
        this.playerProfit = document.getElementById('player-profit');
        
        // Market elements
        this.portfolioDisplay = document.getElementById('portfolio-display');
        this.portfolioValue = document.getElementById('portfolio-value');
        this.portfolioSearch = document.getElementById('portfolio-search');
        this.portfolioSort = document.getElementById('portfolio-sort');
        this.portfolioFilter = document.getElementById('portfolio-filter');
        this.marketSummary = document.getElementById('market-summary');
        this.hotCardsList = document.getElementById('hot-cards-list');
        
        // Price chart modal elements
        this.priceChartModal = document.getElementById('price-chart-modal');
        this.chartCardName = document.getElementById('chart-card-name');
        this.chartCardDetails = document.getElementById('chart-card-details');
        this.closeChartBtn = document.getElementById('close-chart-btn');
        
        // Trading market elements
        this.marketSearch = document.getElementById('market-search');
        this.marketSetFilter = document.getElementById('market-set-filter');
        this.marketRarityFilter = document.getElementById('market-rarity-filter');
        this.marketListings = document.getElementById('market-listings');
        this.cardDetailsPanel = document.getElementById('card-details-panel');
        this.wishlistDisplay = document.getElementById('wishlist-display');
        this.addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
        this.marketActivityFeed = document.getElementById('market-activity-feed');
        this.wishlistModal = document.getElementById('wishlist-modal');
        this.wishlistCardInput = document.getElementById('wishlist-card-input');
        this.wishlistSetSelect = document.getElementById('wishlist-set-select');
        
        // Selected card for purchase
        this.selectedCard = null;
        this.priceChart = document.getElementById('price-chart');
        this.chartStats = document.getElementById('chart-stats');
        this.chartTimeframeBtns = document.querySelectorAll('.chart-timeframe-btn');
        
        // Modal elements
        this.packOpeningModal = document.getElementById('pack-opening-modal');
        this.packArtTearable = document.getElementById('pack-art-tearable');
        this.packArtSetName = document.getElementById('pack-art-set-name');
        this.packArtTearOff = document.getElementById('pack-art-tear-off');
        this.packArtSetNameTorn = document.getElementById('pack-art-set-name-torn');
        
        // Sell modal elements
        this.sellCardModal = document.getElementById('sell-card-modal');
        this.sellCardInfo = document.getElementById('sell-card-info');
        this.sellQuantity = document.getElementById('sell-quantity');
        this.sellFoilOnly = document.getElementById('sell-foil-only');
        this.sellInstant = document.getElementById('sell-instant');
        this.sellListing = document.getElementById('sell-listing');
        this.customPriceSection = document.getElementById('custom-price-section');
        this.sellCustomPrice = document.getElementById('sell-custom-price');
        this.priceGuidance = document.getElementById('price-guidance');
        this.salePreview = document.getElementById('sale-preview');
        this.confirmSellBtn = document.getElementById('confirm-sell-btn');
        this.cancelSellBtn = document.getElementById('cancel-sell-btn');
        
        // Buy modal elements
        this.buyCardModal = document.getElementById('buy-card-modal');
        this.buyCardInfo = document.getElementById('buy-card-info');
        this.buyQuantityDisplay = document.getElementById('buy-quantity-display');
        this.buyPreview = document.getElementById('buy-preview');
        this.confirmBuyBtn = document.getElementById('confirm-buy-btn');
        this.cancelBuyBtn = document.getElementById('cancel-buy-btn');
        

        
        // Player listings display
        this.playerListingsDisplay = document.getElementById('player-listings-display');
        this.listingsCount = document.getElementById('listings-count');
        
        // Buyer stats display
        this.buyerStatsDisplay = document.getElementById('buyer-stats-display');
        this.buyerStatsToggle = document.getElementById('buyer-stats-toggle');
        
        // Achievement notification
        this.achievementNotification = document.getElementById('achievement-notification');
        this.achievementText = document.getElementById('achievement-text');
        
        // Profile modal elements
        this.profileModal = document.getElementById('profile-modal');
        this.profileBtn = document.getElementById('profile-btn');
        this.closeProfileBtn = document.getElementById('close-profile-btn');
        this.networthTimeframeBtns = null; // Will be initialized when modal opens
        this.currentNetworthTimeframe = 24; // Default to 24 hours
        
        // Collection filter elements
        this.collectionSearch = document.getElementById('collection-search');
        this.collectionSort = document.getElementById('collection-sort');
        this.collectionFilter = document.getElementById('collection-filter');
        this.collectionLockSettingsBtn = document.getElementById('collection-lock-settings');
        
        // Lock settings modal elements
        this.lockSettingsModal = document.getElementById('lock-settings-modal');
        this.closeLockSettingsBtn = document.getElementById('close-lock-settings-btn');
        this.cancelLockSettingsBtn = document.getElementById('cancel-lock-settings-btn');
        this.saveLockSettingsBtn = document.getElementById('save-lock-settings-btn');
        this.lockKeepOne = document.getElementById('lock-keep-one');
        this.lockKeepFoils = document.getElementById('lock-keep-foils');
        this.lockKeepOneFoil = document.getElementById('lock-keep-one-foil');
        this.lockKeepMythics = document.getElementById('lock-keep-mythics');
        this.lockKeepRares = document.getElementById('lock-keep-rares');
        
        this.currentSellCard = null;
        this.currentTab = 'packs'; // Default tab
        this.currentChart = null;
        this.currentChartCard = null;
        this.portfolioFilters = {
            search: '',
            sort: 'value-desc',
            filter: 'all'
        };
        this.collectionFilters = {
            search: '',
            sort: 'rarity-asc',
            filter: 'all'
        };

        // Populate selectors
        this.populateSetSelectors();
    }

    populateSetSelectors() {
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            const set = allSets[setId];
            
            // Create display name with lifecycle status
            let displayName = set.name;
            if (set && set.isWeekly && set.lifecycle) {
                const statusBadge = set.lifecycle === 'featured' ? ' ⭐ FEATURED' :
                                   set.lifecycle === 'standard' ? ' 📦 STANDARD' :
                                   set.lifecycle === 'legacy' ? ' 🏛️ LEGACY' : '';
                displayName = set.name + statusBadge;
            }
            
            const option = new Option(displayName, setId);
            const collectionOption = new Option(displayName, setId);
            
            // Add special styling for weekly sets based on lifecycle
            if (set && set.isWeekly) {
                if (set.lifecycle === 'featured') {
                    option.style.background = 'linear-gradient(90deg, #9333ea, #ec4899)';
                    option.style.color = 'white';
                    option.style.fontWeight = 'bold';
                    collectionOption.style.background = 'linear-gradient(90deg, #9333ea, #ec4899)';
                    collectionOption.style.color = 'white';
                    collectionOption.style.fontWeight = 'bold';
                } else if (set.lifecycle === 'standard') {
                    option.style.background = 'linear-gradient(90deg, #059669, #0891b2)';
                    option.style.color = 'white';
                    collectionOption.style.background = 'linear-gradient(90deg, #059669, #0891b2)';
                    collectionOption.style.color = 'white';
                } else if (set.lifecycle === 'legacy') {
                    option.style.background = 'linear-gradient(90deg, #92400e, #a16207)';
                    option.style.color = 'white';
                    collectionOption.style.background = 'linear-gradient(90deg, #92400e, #a16207)';
                    collectionOption.style.color = 'white';
                }
            }
            
            this.setSelector.add(option);
            this.collectionSetSelector.add(collectionOption);
        });
    }

    // Card Auto-Suggestion System
    createCardDatabase() {
        if (this.cardDatabase) return this.cardDatabase;
        
        const allSets = window.getAllSets();
        this.cardDatabase = [];
        
        Object.keys(allSets).forEach(setId => {
            const setData = allSets[setId];
            if (!setData || !setData.cards) return;
            
            Object.keys(setData.cards).forEach(rarity => {
                const cardsInRarity = setData.cards[rarity];
                if (!Array.isArray(cardsInRarity)) return;
                
                cardsInRarity.forEach(cardName => {
                    this.cardDatabase.push({
                        name: cardName,
                        setId: setId,
                        setName: setData.name || setId,
                        rarity: rarity,
                        searchText: `${cardName} ${setData.name} ${rarity}`.toLowerCase()
                    });
                });
            });
        });
        
        return this.cardDatabase;
    }
    
    searchCards(query, limit = 10, setFilter = null) {
        if (!query || query.length < 2) return [];
        
        const cards = this.createCardDatabase();
        const searchTerm = query.toLowerCase();
        const results = [];
        
        // Apply set filter if provided
        const filteredCards = setFilter ? 
            cards.filter(card => card.setId === setFilter) : 
            cards;
        
        // Exact matches first
        const exactMatches = filteredCards.filter(card => 
            card.name.toLowerCase().includes(searchTerm)
        );
        
        // Set name matches
        const setMatches = filteredCards.filter(card => 
            !exactMatches.includes(card) && 
            card.setName.toLowerCase().includes(searchTerm)
        );
        
        // Fuzzy matches (word starts)
        const fuzzyMatches = filteredCards.filter(card => 
            !exactMatches.includes(card) && 
            !setMatches.includes(card) &&
            card.searchText.split(' ').some(word => word.startsWith(searchTerm))
        );
        
        // Combine results
        results.push(...exactMatches, ...setMatches, ...fuzzyMatches);
        
        return results.slice(0, limit);
    }
    
    createAutoCompleteDropdown(inputElement, onSelect, placeholder = "Search cards...") {
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper relative';
        
        // Replace the input with our wrapped version
        const parent = inputElement.parentNode;
        parent.insertBefore(wrapper, inputElement);
        wrapper.appendChild(inputElement);
        
        // Set placeholder
        inputElement.placeholder = placeholder;
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-b-lg max-h-60 overflow-y-auto z-50 hidden';
        wrapper.appendChild(dropdown);
        
        let currentFocus = -1;
        
        const showDropdown = () => {
            dropdown.classList.remove('hidden');
        };
        
        const hideDropdown = () => {
            dropdown.classList.add('hidden');
            currentFocus = -1;
        };
        
        const updateDropdown = (results) => {
            dropdown.innerHTML = '';
            currentFocus = -1;
            
            if (results.length === 0) {
                dropdown.innerHTML = '<div class="p-3 text-gray-400 text-sm">No cards found</div>';
                showDropdown();
                return;
            }
            
            results.forEach((card, index) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0';
                
                const rarityColor = {
                    common: 'text-gray-300',
                    uncommon: 'text-green-400',
                    rare: 'text-blue-400',
                    mythic: 'text-purple-400'
                }[card.rarity] || 'text-gray-300';
                
                item.innerHTML = `
                    <div class="font-medium text-white">${card.name}</div>
                    <div class="text-xs text-gray-400 mt-1">
                        <span class="${rarityColor} font-medium">${card.rarity.toUpperCase()}</span>
                        <span class="mx-2">•</span>
                        <span>${card.setName}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    onSelect(card);
                    hideDropdown();
                });
                
                dropdown.appendChild(item);
            });
            
            showDropdown();
        };
        
        // Input event handling
        inputElement.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length < 2) {
                hideDropdown();
                return;
            }
            
            const results = this.searchCards(query);
            updateDropdown(results);
        });
        
        // Keyboard navigation
        inputElement.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus = Math.min(currentFocus + 1, items.length - 1);
                updateFocus(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus = Math.max(currentFocus - 1, -1);
                updateFocus(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus >= 0 && items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });
        
        const updateFocus = (items) => {
            items.forEach((item, index) => {
                if (index === currentFocus) {
                    item.classList.add('bg-gray-700');
                } else {
                    item.classList.remove('bg-gray-700');
                }
            });
        };
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                hideDropdown();
            }
        });
        
        return {
            wrapper,
            dropdown,
            hideDropdown,
            showDropdown
        };
    }

    setupMarketSearchAutoComplete() {
        const autocomplete = this.createAutoCompleteDropdown(
            this.marketSearch,
            (selectedCard) => {
                // When a card is selected from suggestions
                this.marketSearch.value = selectedCard.name;
                
                // Set filters to match the selected card
                if (this.marketSetFilter) {
                    this.marketSetFilter.value = selectedCard.setId;
                }
                if (this.marketRarityFilter) {
                    this.marketRarityFilter.value = selectedCard.rarity;
                }
                
                // Re-render marketplace with filters applied
                this.renderMarketListings();
                
                // Optionally select the card for purchase if available
                setTimeout(() => {
                    const cardElement = document.querySelector(`[data-card="${selectedCard.name}"][data-set="${selectedCard.setId}"]`);
                    if (cardElement) {
                        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        cardElement.classList.add('bg-yellow-900');
                        setTimeout(() => cardElement.classList.remove('bg-yellow-900'), 2000);
                    }
                }, 100);
            },
            "Search cards in marketplace..."
        );
        
        // Add a debounced re-render to the input event
        let searchTimeout;
        this.marketSearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.renderMarketListings();
            }, 300); // 300ms debounce
        });
    }

    setupWishlistAutoComplete() {
        // Create a custom autocomplete for wishlist that respects set filtering
        const wrapper = document.createElement('div');
        wrapper.className = 'autocomplete-wrapper relative';
        
        // Replace the input with our wrapped version
        const parent = this.wishlistCardInput.parentNode;
        parent.insertBefore(wrapper, this.wishlistCardInput);
        wrapper.appendChild(this.wishlistCardInput);
        
        // Set placeholder
        this.wishlistCardInput.placeholder = "Type card name...";
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 rounded-b-lg max-h-60 overflow-y-auto z-50 hidden';
        wrapper.appendChild(dropdown);
        
        let currentFocus = -1;
        
        const showDropdown = () => dropdown.classList.remove('hidden');
        const hideDropdown = () => {
            dropdown.classList.add('hidden');
            currentFocus = -1;
        };
        
        const updateDropdown = (results) => {
            dropdown.innerHTML = '';
            currentFocus = -1;
            
            if (results.length === 0) {
                dropdown.innerHTML = '<div class="p-3 text-gray-400 text-sm">No cards found</div>';
                showDropdown();
                return;
            }
            
            results.forEach((card, index) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0';
                
                const rarityColor = {
                    common: 'text-gray-300',
                    uncommon: 'text-green-400',
                    rare: 'text-blue-400',
                    mythic: 'text-purple-400'
                }[card.rarity] || 'text-gray-300';
                
                item.innerHTML = `
                    <div class="font-medium text-white">${card.name}</div>
                    <div class="text-xs text-gray-400 mt-1">
                        <span class="${rarityColor} font-medium">${card.rarity.toUpperCase()}</span>
                        <span class="mx-2">•</span>
                        <span>${card.setName}</span>
                    </div>
                `;
                
                item.addEventListener('click', () => {
                    // Select the card
                    this.wishlistCardInput.value = card.name;
                    
                    // Auto-select the set
                    if (this.wishlistSetSelect) {
                        this.wishlistSetSelect.value = card.setId;
                    }
                    
                    // Focus next input
                    const priceInput = document.getElementById('wishlist-price-input');
                    if (priceInput) {
                        setTimeout(() => priceInput.focus(), 100);
                    }
                    
                    hideDropdown();
                });
                
                dropdown.appendChild(item);
            });
            
            showDropdown();
        };
        
        // Input event handling
        this.wishlistCardInput.addEventListener('input', (e) => {
            const query = e.target.value;
            if (query.length < 2) {
                hideDropdown();
                return;
            }
            
            const selectedSet = this.wishlistSetSelect?.value || null;
            const results = this.searchCards(query, 10, selectedSet);
            updateDropdown(results);
        });
        
        // Keyboard navigation
        this.wishlistCardInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                currentFocus = Math.min(currentFocus + 1, items.length - 1);
                updateFocus(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                currentFocus = Math.max(currentFocus - 1, -1);
                updateFocus(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus >= 0 && items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else if (e.key === 'Escape') {
                hideDropdown();
            }
        });
        
        const updateFocus = (items) => {
            items.forEach((item, index) => {
                if (index === currentFocus) {
                    item.classList.add('bg-gray-700');
                } else {
                    item.classList.remove('bg-gray-700');
                }
            });
        };
        
        // Re-search when set changes
        if (this.wishlistSetSelect) {
            this.wishlistSetSelect.addEventListener('change', () => {
                if (this.wishlistCardInput.value.length >= 2) {
                    const event = new Event('input');
                    this.wishlistCardInput.dispatchEvent(event);
                }
            });
        }
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    setupEventListeners() {
        // Tab navigation
        this.packsTab.addEventListener('click', () => this.switchTab('packs'));
        this.collectionTab.addEventListener('click', () => this.switchTab('collection'));
        this.marketTab.addEventListener('click', () => this.switchTab('market'));
        
        this.setSelector.addEventListener('change', (e) => {
            this.gameEngine.setSelectedSet(e.target.value);
            this.updateBuyBoxButtonText();
            this.updatePackPrices();
        });
        
        this.collectionSetSelector.addEventListener('change', () => {
            this.renderCollection();
        });
        
        this.buyPackBtn.addEventListener('click', () => {
            const result = this.gameEngine.buyPacks(1);
            this.handlePurchaseResult(result);
        });
        
        this.buyBoxBtn.addEventListener('click', () => {
            const allSets = window.getAllSets();
            const set = allSets[this.gameEngine.state.selectedSet];
            const result = this.gameEngine.buyPacks(set.boosterBoxSize);
            this.handlePurchaseResult(result);
        });
        
        // Sell modal event listeners
        this.cancelSellBtn.addEventListener('click', () => {
            this.closeSellModal();
        });
        
        this.confirmSellBtn.addEventListener('click', () => {
            this.executeSale();
        });
        
        this.sellQuantity.addEventListener('input', () => {
            this.updateSalePreview();
        });
        
        this.sellFoilOnly.addEventListener('change', () => {
            this.updateSalePreview();
        });
        
        // Sell type radio button listeners
        this.sellInstant.addEventListener('change', () => {
            this.handleSellTypeChange();
        });
        
        this.sellListing.addEventListener('change', () => {
            this.handleSellTypeChange();
        });
        
        this.sellCustomPrice.addEventListener('input', () => {
            this.updateSalePreview();
        });

        // Portfolio filter/search/sort listeners
        this.portfolioSearch.addEventListener('input', (e) => {
            this.portfolioFilters.search = e.target.value.toLowerCase();
            this.renderPortfolio();
        });
        
        this.portfolioSort.addEventListener('change', (e) => {
            this.portfolioFilters.sort = e.target.value;
            this.renderPortfolio();
        });
        
        this.portfolioFilter.addEventListener('change', (e) => {
            this.portfolioFilters.filter = e.target.value;
            this.renderPortfolio();
        });

        // Collection filter/search/sort listeners
        this.collectionSearch.addEventListener('input', (e) => {
            this.collectionFilters.search = e.target.value.toLowerCase();
            this.renderCollection();
        });
        
        this.collectionSort.addEventListener('change', (e) => {
            this.collectionFilters.sort = e.target.value;
            this.renderCollection();
        });
        
        this.collectionFilter.addEventListener('change', (e) => {
            this.collectionFilters.filter = e.target.value;
            this.renderCollection();
        });

        // Lock settings modal listeners
        this.collectionLockSettingsBtn.addEventListener('click', () => {
            this.openLockSettingsModal();
        });
        
        this.closeLockSettingsBtn.addEventListener('click', () => {
            this.closeLockSettingsModal();
        });
        
        this.cancelLockSettingsBtn.addEventListener('click', () => {
            this.closeLockSettingsModal();
        });
        
        this.saveLockSettingsBtn.addEventListener('click', () => {
            this.saveLockSettings();
        });
        
        this.lockSettingsModal.addEventListener('click', (e) => {
            if (e.target === this.lockSettingsModal) {
                this.closeLockSettingsModal();
            }
        });

        // Price chart modal listeners
        this.closeChartBtn.addEventListener('click', () => this.closePriceChart());
        this.priceChartModal.addEventListener('click', (e) => {
            if (e.target === this.priceChartModal) {
                this.closePriceChart();
            }
        });
        
        this.chartTimeframeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const timeframe = parseInt(e.target.dataset.timeframe);
                this.updateChartTimeframe(timeframe);
            });
        });
        
        // Click outside modal to close
        this.sellCardModal.addEventListener('click', (e) => {
            if (e.target === this.sellCardModal) {
                this.closeSellModal();
            }
        });
        
        // Buy modal event listeners
        this.cancelBuyBtn.addEventListener('click', () => {
            this.closeBuyModal();
        });
        
        this.confirmBuyBtn.addEventListener('click', () => {
            this.confirmPurchase();
        });
        
        this.buyCardModal.addEventListener('click', (e) => {
            if (e.target === this.buyCardModal) {
                this.closeBuyModal();
            }
        });



        // Profile modal event listeners
        this.profileBtn.addEventListener('click', () => {
            this.openProfileModal();
        });
        
        this.closeProfileBtn.addEventListener('click', () => {
            this.closeProfileModal();
        });
        
        this.profileModal.addEventListener('click', (e) => {
            if (e.target === this.profileModal) {
                this.closeProfileModal();
            }
        });
        
        // Trading market event listeners
        if (this.marketSearch) {
            this.setupMarketSearchAutoComplete();
        }
        if (this.marketSetFilter) {
            this.marketSetFilter.addEventListener('change', () => this.renderMarketListings());
        }
        if (this.marketRarityFilter) {
            this.marketRarityFilter.addEventListener('change', () => this.renderMarketListings());
        }
        if (this.addToWishlistBtn) {
            this.addToWishlistBtn.addEventListener('click', () => this.showAddToWishlistModal());
        }
        if (this.wishlistCardInput) {
            this.setupWishlistAutoComplete();
        }

        // Theme selector event listeners
        this.setupThemeEventListeners();

        // Start the countdown timer for weekly sets
        this.startWeeklyCountdown();
        
        // Start market update timer
        this.startMarketUpdates();
        
        // Initial updates
        this.updateBuyBoxButtonText();
        this.updatePackPrices();
    }

    handlePurchaseResult(result) {
        if (result.success) {
            this.renderUnopenedPacks();
            this.updatePlayerStats(); // Immediately update cash display
            this.showNotification(result.message, 'success');
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg text-white font-medium z-50 ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
        this.currentTab = tabName;
        
        if (tabName === 'packs') {
            this.packsTab.classList.add('active');
            this.packsContent.classList.remove('hidden');
        } else if (tabName === 'collection') {
            this.collectionTab.classList.add('active');
            this.collectionContent.classList.remove('hidden');
            this.renderCollection(); // Refresh collection when switching to tab
        } else if (tabName === 'market') {
            this.marketTab.classList.add('active');
            this.marketContent.classList.remove('hidden'); // Update stats first
            this.renderPortfolio(); // Refresh portfolio when switching to tab
            this.renderMarketSummary();
            this.renderHotCards();
            this.renderPlayerListings(); // Show player's active listings
        }
    }

    updatePackPrices() {
        const selectedSetId = this.gameEngine.state.selectedSet;
        const packPrice = this.gameEngine.marketEngine.getPackPrice(selectedSetId, 1);
        const allSets = window.getAllSets();
        const set = allSets[selectedSetId];
        const boxPrice = this.gameEngine.marketEngine.getPackPrice(selectedSetId, set.boosterBoxSize);
        
        this.buyPackBtn.textContent = `Buy 1 Pack ($${packPrice.toFixed(2)})`;
        this.buyBoxBtn.textContent = `Buy Booster Box ($${boxPrice.toFixed(2)})`;
    }

    updateBuyBoxButtonText() {
        const allSets = window.getAllSets();
        const selectedSet = allSets[this.gameEngine.state.selectedSet];
        if (selectedSet) {
            this.buyBoxBtn.textContent = `Buy Booster Box (${selectedSet.boosterBoxSize} Packs)`;
        }
    }

    startWeeklyCountdown() {
        // Prevent multiple intervals
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Update countdown every 5 seconds (less aggressive)
        this.countdownInterval = setInterval(() => {
            this.updateWeeklyCountdown();
        }, 5000);
        
        // Initial update
        this.updateWeeklyCountdown();
    }

    updateWeeklyCountdown() {
        const countdownElements = document.querySelectorAll('#weekly-countdown');
        if (countdownElements.length === 0) return;

        const timeUntilNext = window.weeklySetGenerator.getTimeUntilNextWeek();
        
        // Only show notification if time is very low, don't auto-reload
        if (timeUntilNext <= 0) {
            countdownElements.forEach(element => {
                element.textContent = 'New set available! Refresh to see it.';
                element.style.color = '#fbbf24'; // yellow color
                element.style.fontWeight = 'bold';
            });
            return;
        }

        // Safety check for reasonable time values
        if (timeUntilNext > 1000 * 60 * 60 * 24 * 8) { // More than 8 days
            countdownElements.forEach(element => {
                element.textContent = 'Calculating...';
            });
            return;
        }

        const days = Math.floor(timeUntilNext / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeUntilNext % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilNext % (1000 * 60)) / 1000);

        const timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        countdownElements.forEach(element => {
            element.textContent = timeString;
            element.style.color = '';
            element.style.fontWeight = '';
        });
    }

    renderUnopenedPacks() {
        this.unopenedPacksDisplay.innerHTML = '';
        let totalPacks = Object.values(this.gameEngine.state.unopenedPacks).reduce((a, b) => a + b, 0);
        
        const allSets = window.getAllSets();
        Object.keys(this.gameEngine.state.unopenedPacks).forEach(setId => {
            const count = this.gameEngine.state.unopenedPacks[setId];
            if (count > 0) {
                const set = allSets[setId];
                
                // Skip if set no longer exists (e.g., old weekly sets)
                if (!set) {
                    console.warn(`Set ${setId} no longer exists, removing from state`);
                    this.gameEngine.state.unopenedPacks[setId] = 0;
                    return;
                }
                
                const packElement = document.createElement('div');
                
                if (set.isWeekly) {
                    // Get lifecycle status for styling
                    let badgeText = '⏰ WEEKLY';
                    let bgClass = 'from-purple-600 to-pink-600';
                    let borderClass = 'border-yellow-400';
                    
                    if (set.lifecycle === 'featured') {
                        badgeText = '⭐ FEATURED';
                        bgClass = 'from-purple-600 to-pink-600';
                        borderClass = 'border-yellow-400';
                    } else if (set.lifecycle === 'standard') {
                        badgeText = '📦 STANDARD';
                        bgClass = 'from-emerald-600 to-cyan-600';
                        borderClass = 'border-emerald-400';
                    } else if (set.lifecycle === 'legacy') {
                        badgeText = '🏛️ LEGACY';
                        bgClass = 'from-amber-700 to-yellow-700';
                        borderClass = 'border-amber-400';
                    }
                    
                    // Special styling for weekly sets
                    packElement.className = `pack p-4 bg-gradient-to-br ${bgClass} rounded-lg text-center shadow-lg border-2 ${borderClass} relative`;
                    packElement.innerHTML = `
                        <div class="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-1">
                            ${badgeText}
                        </div>
                        <div class="font-bold text-lg text-white">${set.name}</div>
                        <div class="text-2xl text-white">${count}x</div>
                        <div class="text-sm text-yellow-200">Click to Open</div>
                        ${set.lifecycle === 'featured' ? `
                        <div class="text-xs text-yellow-300 mt-1">
                            Time Left: <span id="weekly-countdown">Loading...</span>
                        </div>
                        ` : ''}
                    `;
                } else {
                    // Normal styling for regular sets
                    packElement.className = 'pack p-4 rounded-lg text-center shadow-md';
                    packElement.innerHTML = `
                        <div class="font-bold text-lg">${set.name}</div>
                        <div class="text-2xl">${count}x</div>
                        <div class="text-sm text-gray-400">Click to Open</div>
                    `;
                }
                
                packElement.onclick = () => this.showPackOpeningModal(setId);
                this.unopenedPacksDisplay.appendChild(packElement);
            }
        });

        if (totalPacks === 0) {
            this.unopenedPacksDisplay.innerHTML = `<p class="text-gray-500">No packs to open. Buy some from a set!</p>`;
        }
    }

    showPackOpeningModal(setId) {
        if (this.gameEngine.state.unopenedPacks[setId] <= 0) return;
        
        const allSets = window.getAllSets();
        const set = allSets[setId];
        
        if (!set) {
            console.error(`Cannot show pack opening modal for undefined set: ${setId}`);
            return;
        }
        
        const setName = set.name;
        this.packArtSetName.textContent = setName;
        this.packOpeningModal.style.display = 'flex';
        
        // Store the pack data for when it's opened
        this.currentOpeningPack = { setId };
    }

    setupPackTearing() {
        let isDragging = false;
        let startX = 0;
        const tearThreshold = 100; // pixels to drag before it opens

        const handleDragStart = (clientX) => {
            isDragging = true;
            startX = clientX;
            this.packArtTearable.style.cursor = 'grabbing';
            // Remove transitions for smooth dragging
            this.packArtTearable.style.transition = 'none';
            this.packArtTearOff.style.transition = 'none';
            this.packArtTearOff.style.transform = 'translateX(0)';
        };

        const handleDragMove = (clientX) => {
            if (!isDragging) return;
            const deltaX = Math.max(0, clientX - startX);
            const tearPercent = Math.min(100, (deltaX / this.packArtTearable.clientWidth) * 100);

            // The main pack front gets clipped from the left
            this.packArtTearable.style.clipPath = `inset(0 0 0 ${tearPercent}%)`;
            
            // The torn-off piece only shows the part that's been torn...
            this.packArtTearOff.style.clipPath = `inset(0 ${100 - tearPercent}% 0 0)`;
            // ...and it moves with the mouse
            this.packArtTearOff.style.transform = `translateX(${deltaX}px)`;
        };
        
        const handleDragEnd = (clientX) => {
            if (!isDragging) return;
            isDragging = false;
            this.packArtTearable.style.cursor = 'grab';

            // Add transitions back for smooth animations
            this.packArtTearable.style.transition = 'clip-path 0.2s ease-out';
            this.packArtTearOff.style.transition = 'transform 0.3s ease-out, clip-path 0.2s ease-out';

            const deltaX = clientX - startX;
            if (deltaX > tearThreshold) {
                // SUCCESSFUL TEAR: Animate torn piece flying away
                this.packArtTearOff.style.transform = `translateX(${this.packArtTearable.clientWidth * 1.5}px) rotate(25deg)`;
                // Animate main pack front disappearing completely
                this.packArtTearable.style.clipPath = 'inset(0 0 0 100%)';
                
                // After animation, finish the process
                setTimeout(() => this.finishOpening(), 300);
            } else {
                // FAILED TEAR - Reset everything back to start
                this.packArtTearable.style.clipPath = 'inset(0 0 0 0)';
                this.packArtTearOff.style.clipPath = 'inset(0 100% 0 0)';
                this.packArtTearOff.style.transform = 'translateX(0px)';
            }
        };
        
        // Mouse events
        this.packArtTearable.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
        window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
        window.addEventListener('mouseup', (e) => handleDragEnd(e.clientX));

        // Touch events
        this.packArtTearable.addEventListener('touchstart', (e) => handleDragStart(e.touches[0].clientX), { passive: true });
        window.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientX), { passive: true });
        window.addEventListener('touchend', (e) => handleDragEnd(e.changedTouches[0].clientX));
    }

    finishOpening() {
        const { setId } = this.currentOpeningPack;
        const cards = this.gameEngine.openPack(setId);
        
        if (!cards) return;

        // Hide modal and reset elements for the next opening
        this.packOpeningModal.style.display = 'none';
        
        // Reset the visual state of the tearable elements without animation
        this.packArtTearable.style.transition = 'none';
        this.packArtTearOff.style.transition = 'none';
        
        this.packArtTearable.style.clipPath = `inset(0 0 0 0)`;
        this.packArtTearOff.style.clipPath = `inset(0 100% 0 0)`;
        this.packArtTearOff.style.transform = 'translateX(0px)';

        // Render cards and update UI
        setTimeout(() => {
            this.renderOpenedPack(cards);
            this.renderUnopenedPacks();
            this.renderCollection();
        }, 10);
    }

    renderOpenedPack(cards) {
        this.openedPackDisplay.innerHTML = '';
        cards.forEach((card, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container h-40';
            cardContainer.style.opacity = 0;
            cardContainer.style.transform = 'translateY(20px)';
            cardContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                <div class="card-face card-back"><div class="card-back-logo">?</div></div>
                <div class="card-face card-front"></div>
            `;

            cardContainer.appendChild(cardEl);
            this.openedPackDisplay.appendChild(cardContainer);
            
            // Add staggered animation for cards appearing
            setTimeout(() => {
                cardContainer.style.opacity = 1;
                cardContainer.style.transform = 'translateY(0)';
            }, index * 50);

            cardContainer.addEventListener('click', () => {
                if (cardContainer.classList.contains('flipped')) return;

                const cardFront = cardEl.querySelector('.card-front');
                const rarity = this.gameEngine.getCardRarity(this.currentOpeningPack.setId, card.name);

                cardFront.innerHTML = this.createCardFaceHTML(card.name, rarity);
                if (card.isFoil) {
                    cardFront.classList.add('foil');
                }
                cardFront.classList.add(`rarity-${rarity}`, 'border-4', 'rounded-lg', 'p-2', 'h-full', 'flex', 'flex-col', 'justify-between', 'shadow-md');
                cardContainer.classList.add('flipped');
            }, { once: true });
        });
    }

    renderCollection() {
        const selectedSetId = this.collectionSetSelector.value;
        if (!selectedSetId) return;

        this.collectionDisplay.innerHTML = '';
        const progress = this.gameEngine.getCollectionProgress(selectedSetId);
        const collectionSet = this.gameEngine.state.collection[selectedSetId];

        // Prepare card data with additional information needed for filtering/sorting
        let cardData = progress.allCards.map(cardInfo => {
            const data = collectionSet[cardInfo.name];
            const count = data ? data.count : 0;
            const foilCount = data ? data.foilCount : 0;
            const totalOwned = count + foilCount;
            const regularPrice = this.gameEngine.marketEngine.getCardPrice(selectedSetId, cardInfo.name, false);
            const foilPrice = this.gameEngine.marketEngine.getCardPrice(selectedSetId, cardInfo.name, true);
            const totalValue = (count * regularPrice) + (foilCount * foilPrice);
            const isLocked = this.isCardLocked(selectedSetId, cardInfo.name, count, foilCount, cardInfo.rarity);
            
            return {
                ...cardInfo,
                count,
                foilCount,
                totalOwned,
                totalValue,
                isLocked
            };
        });

        // Apply filters
        cardData = this.filterCollectionCards(cardData);
        
        // Apply sorting
        cardData = this.sortCollectionCards(cardData);

        // Render filtered and sorted cards
        cardData.forEach(card => {
            const cardElement = this.createCollectionCardElement(
                card.name, 
                card.rarity, 
                card.foilCount > 0, 
                card.count, 
                card.foilCount, 
                selectedSetId,
                card.isLocked
            );
            this.collectionDisplay.appendChild(cardElement);
        });
        
        this.collectionProgress.textContent = `${progress.collected} / ${progress.total} (${progress.percentage}%)`;
    }

    createCardFaceHTML(name, rarity, enableSmartOptimization = false) {
        // Generate glyph art for this card (with fallback if not loaded)
        let artHTML = '';
        if (window.glyphArtGenerator) {
            if (enableSmartOptimization) {
                // Use smart screenshot optimization for collection views
                artHTML = window.glyphArtGenerator.generateScreenshotWhenNeeded(name, rarity, 300, 200);
                if (typeof artHTML === 'object' && artHTML.then) {
                    // Handle promise - use DOM version while screenshot processes
                    const artData = window.glyphArtGenerator.generateArt(name, rarity);
                    artHTML = window.glyphArtGenerator.renderArtHTML(artData);
                }
            } else {
                // Use regular DOM rendering for pack opening and single cards
                const artData = window.glyphArtGenerator.generateArt(name, rarity);
                artHTML = window.glyphArtGenerator.renderArtHTML(artData);
            }
        } else {
            // Fallback placeholder
            artHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.3); font-size: 2em;">✨</div>';
        }
        
        return `
            <div class="card-art-area" style="
                flex: 1;
                position: relative;
                min-height: 80px;
                margin-bottom: 8px;
                border-radius: 6px;
                overflow: hidden;
                background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            " data-card-rarity="${rarity}">
                ${artHTML}
            </div>
            <div class="card-text-area">
                <div class="font-semibold text-sm leading-tight">${name}</div>
                <div class="text-xs self-end capitalize text-gray-400">${rarity}</div>
            </div>
        `;
    }

    createCollectionCardElement(name, rarity, isFoil, count, foilCount, setId = null, isLocked = false) {
        const element = document.createElement('div');
        const foilClass = isFoil ? 'foil' : '';
        // Fix: Check if player has ANY version of the card (regular OR foil)
        const totalOwned = count + foilCount;
        const ownedClass = totalOwned === 0 ? 'opacity-40' : '';
        const lockedClass = isLocked ? 'ring-2 ring-yellow-400' : '';
        element.className = `card-face relative border-4 rounded-lg p-2 h-40 flex flex-col justify-between shadow-md rarity-${rarity} ${foilClass} ${ownedClass} ${lockedClass} cursor-pointer hover:transform hover:scale-105 transition-transform`;
        
        let countDisplay = `
            <div class="absolute top-1 right-1 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-1">
                ${isFoil ? `<span class="text-yellow-400">★${foilCount}</span> / ` : ''} ${count}x
            </div>
        `;
        
        // Add lock indicator if card is locked
        if (isLocked) {
            countDisplay += `
                <div class="absolute top-1 left-1 bg-yellow-600 text-white text-xs font-bold rounded-full px-2 py-1">
                    🔒
                </div>
            `;
        }
        
        // Fix: Add sell button if player owns ANY version of the card (regular OR foil)
        if (totalOwned > 0) {
            countDisplay += `
                <div class="absolute bottom-1 right-1 flex gap-1">
                    <button class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2 py-1 rounded sell-card-btn" 
                            data-set-id="${setId || this.collectionSetSelector.value}" 
                            data-card-name="${name}">
                        💰 Sell
                    </button>
                </div>
            `;
        }

        element.innerHTML = this.createCardFaceHTML(name, rarity, true) + countDisplay; // Enable optimization for collection
        
        // Add data attributes for screenshot optimization
        element.setAttribute('data-card-name', name);
        element.setAttribute('data-card-rarity', rarity);
        
        // Add event listener for sell button
        const sellBtn = element.querySelector('.sell-card-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openSellModal(sellBtn.dataset.setId, sellBtn.dataset.cardName);
            });
        }
        
        return element;
    }

    // Market and Trading Methods

    startMarketUpdates() {
        // Update market data every 30 seconds
        this.marketUpdateInterval = setInterval(() => {
            this.updatePlayerStats();
            this.renderPortfolio();
            this.renderMarketSummary();
            this.renderHotCards();
            this.renderMarketListings();
            this.renderWishlist();
            this.renderMarketActivity();
            this.renderPlayerListings();
        }, 30000);
        
        // Initial render
        this.updatePlayerStats();
        this.renderPortfolio();
        this.renderMarketSummary();
        this.renderHotCards();
        this.populateSetFilters();
        this.renderMarketListings();
        this.renderWishlist();
        this.renderMarketActivity();
        this.renderPlayerListings();
    }

    onMarketUpdate() {
        // Called by market engine when prices update
        this.updatePlayerStats();
        this.renderPortfolio();
        this.renderMarketSummary();
        this.renderHotCards();
        this.renderMarketListings();
        this.renderWishlist();
        this.renderMarketActivity();
        this.renderPlayerListings();
        if (this.selectedCard) {
            this.renderCardDetailsPanel();
        }
    }

    updatePlayerStats() {
        const stats = this.gameEngine.getPlayerStats();
        
        this.playerWallet.textContent = stats.wallet.toFixed(2);
        this.playerNetworth.textContent = stats.netWorth.toFixed(2);
        this.playerTitle.textContent = stats.currentTitle;
        this.playerProfit.textContent = stats.profit.toFixed(2);
        
        // Update profit color
        if (stats.profit > 0) {
            this.playerProfit.className = 'text-green-400';
        } else if (stats.profit < 0) {
            this.playerProfit.className = 'text-red-400';
        } else {
            this.playerProfit.className = 'text-gray-400';
        }
    }

    renderPortfolio() {
        const portfolio = this.gameEngine.getPortfolioSummary();
        
        //this.portfolioValue.textContent = portfolio.totalValue.toFixed(2);
        this.portfolioDisplay.innerHTML = '';
        
        if (portfolio.cards.length === 0) {
            this.portfolioDisplay.innerHTML = '<p class="text-gray-500 text-center">No cards in portfolio. Open some packs!</p>';
            return;
        }
        
        // Apply filters
        let filteredCards = this.filterPortfolioCards(portfolio.cards);
        
        // Apply sorting
        filteredCards = this.sortPortfolioCards(filteredCards);
        
        if (filteredCards.length === 0) {
            this.portfolioDisplay.innerHTML = '<p class="text-gray-500 text-center">No cards match your filters.</p>';
            return;
        }
        
        filteredCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'portfolio-card flex justify-between items-center p-3 rounded-lg mb-2 transition-colors';
            
            const trendIcon = card.trend.trend === 'rising' ? '📈' : 
                             card.trend.trend === 'falling' ? '📉' : '➡️';
            const trendColor = card.trend.trend === 'rising' ? 'text-green-400' : 
                              card.trend.trend === 'falling' ? 'text-red-400' : 'text-gray-400';
            
            // Get set info to show week number for weekly sets
            const allSets = window.getAllSets();
            const setData = allSets[card.setId];
            const weekDisplay = setData && setData.isWeekly && setData.weekNumber ? ` (#${setData.weekNumber})` : '';
            
            cardElement.innerHTML = `
                <div class="flex-1 cursor-pointer chart-card-trigger" data-set-id="${card.setId}" data-card-name="${card.cardName}">
                    <div class="font-medium text-sm">${card.cardName}${weekDisplay}</div>
                    <div class="text-xs text-gray-400">
                        ${card.regularCount > 0 ? `${card.regularCount}x regular ` : ''}
                        ${card.foilCount > 0 ? `${card.foilCount}x foil ` : ''}
                        | ${card.rarity}
                    </div>
                </div>
                <div class="text-right mx-3">
                    <div class="font-medium">$${card.individualPrice.toFixed(2)}</div>
                    <div class="text-xs ${trendColor}">
                        ${trendIcon} ${card.trend.change > 0 ? '+' : ''}${card.trend.change.toFixed(1)}%
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="chart-btn bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-2 py-1 rounded"
                            data-set-id="${card.setId}" 
                            data-card-name="${card.cardName}">
                        📊
                    </button>
                    <button class="sell-portfolio-btn bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2 py-1 rounded"
                            data-set-id="${card.setId}" 
                            data-card-name="${card.cardName}">
                        💰
                    </button>
                </div>
            `;
            
            // Add event listeners
            const sellBtn = cardElement.querySelector('.sell-portfolio-btn');
            const chartBtn = cardElement.querySelector('.chart-btn');
            const cardTrigger = cardElement.querySelector('.chart-card-trigger');
            
            sellBtn.addEventListener('click', () => {
                this.openSellModal(card.setId, card.cardName);
            });
            
            chartBtn.addEventListener('click', () => {
                this.openPriceChart(card.setId, card.cardName);
            });
            
            cardTrigger.addEventListener('click', () => {
                this.openPriceChart(card.setId, card.cardName);
            });
            
            this.portfolioDisplay.appendChild(cardElement);
        });
        
        // Update portfolio stats after rendering
        this.updatePlayerStats();
    }

    filterPortfolioCards(cards) {
        return cards.filter(card => {
            // Search filter - enhanced to search in multiple fields
            if (this.portfolioFilters.search) {
                const searchTerm = this.portfolioFilters.search.toLowerCase();
                const cardName = card.cardName.toLowerCase();
                const rarity = card.rarity.toLowerCase();
                
                // Get set name for searching
                const allSets = window.getAllSets();
                const setData = allSets[card.setId];
                const setName = setData ? setData.name.toLowerCase() : '';
                
                // Search in card name, rarity, and set name
                const searchText = `${cardName} ${rarity} ${setName}`;
                
                if (!searchText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Rarity filter
            if (this.portfolioFilters.filter !== 'all') {
                switch (this.portfolioFilters.filter) {
                    case 'common':
                    case 'uncommon':
                    case 'rare':
                    case 'mythic':
                        if (card.rarity !== this.portfolioFilters.filter) return false;
                        break;
                    case 'foil':
                        if (card.foilCount === 0) return false;
                        break;
                    case 'rising':
                        if (card.trend.trend !== 'rising') return false;
                        break;
                    case 'falling':
                        if (card.trend.trend !== 'falling') return false;
                        break;
                }
            }
            
            return true;
        });
    }

    sortPortfolioCards(cards) {
        return cards.sort((a, b) => {
            switch (this.portfolioFilters.sort) {
                case 'value-desc':
                    return b.totalValue - a.totalValue;
                case 'value-asc':
                    return a.totalValue - b.totalValue;
                case 'name-asc':
                    return a.cardName.localeCompare(b.cardName);
                case 'name-desc':
                    return b.cardName.localeCompare(a.cardName);
                case 'rarity-desc':
                    const rarityOrder = { mythic: 4, rare: 3, uncommon: 2, common: 1 };
                    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                case 'change-desc':
                    return b.trend.change - a.trend.change;
                case 'change-asc':
                    return a.trend.change - b.trend.change;
                default:
                    return 0;
            }
        });
    }

    filterCollectionCards(cards) {
        return cards.filter(card => {
            // Search filter
            if (this.collectionFilters.search) {
                const searchTerm = this.collectionFilters.search.toLowerCase();
                const cardName = card.name.toLowerCase();
                const rarity = card.rarity.toLowerCase();
                
                // Search in card name and rarity
                const searchText = `${cardName} ${rarity}`;
                
                if (!searchText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Filter by type
            if (this.collectionFilters.filter !== 'all') {
                switch (this.collectionFilters.filter) {
                    case 'owned':
                        if (card.totalOwned === 0) return false;
                        break;
                    case 'missing':
                        if (card.totalOwned > 0) return false;
                        break;
                    case 'common':
                    case 'uncommon':
                    case 'rare':
                    case 'mythic':
                        if (card.rarity !== this.collectionFilters.filter) return false;
                        break;
                    case 'foil':
                        if (card.foilCount === 0) return false;
                        break;
                    case 'locked':
                        if (!card.isLocked) return false;
                        break;
                }
            }
            
            return true;
        });
    }

    sortCollectionCards(cards) {
        return cards.sort((a, b) => {
            switch (this.collectionFilters.sort) {
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'rarity-desc':
                    const rarityOrder = { mythic: 4, rare: 3, uncommon: 2, common: 1 };
                    return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
                case 'rarity-asc':
                    const rarityOrderAsc = { mythic: 4, rare: 3, uncommon: 2, common: 1 };
                    return (rarityOrderAsc[a.rarity] || 0) - (rarityOrderAsc[b.rarity] || 0);
                case 'count-desc':
                    return b.totalOwned - a.totalOwned;
                case 'count-asc':
                    return a.totalOwned - b.totalOwned;
                case 'value-desc':
                    return b.totalValue - a.totalValue;
                case 'value-asc':
                    return a.totalValue - b.totalValue;
                default:
                    return 0;
            }
        });
    }

    isCardLocked(setId, cardName, count, foilCount, rarity) {
        const settings = this.gameEngine.state.cardLockSettings;
        
        // Check if any lock setting would protect this card
        if (settings.keepOne && count > 0) return true;
        if (settings.keepFoils && foilCount > 0) return true;
        if (settings.keepOneFoil && foilCount > 0) return true;
        if (settings.keepMythics && rarity === 'mythic') return true;
        if (settings.keepRares && rarity === 'rare') return true;
        
        return false;
    }

    renderMarketSummary() {
        const summary = this.gameEngine.marketEngine.getMarketSummary();
        
        const sentimentText = summary.sentiment > 1.1 ? 'Bullish 🐂' : 
                             summary.sentiment < 0.9 ? 'Bearish 🐻' : 'Neutral ⚖️';
        const sentimentColor = summary.sentiment > 1.1 ? 'text-green-400' : 
                              summary.sentiment < 0.9 ? 'text-red-400' : 'text-gray-400';
        
        this.marketSummary.innerHTML = `
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Market Sentiment</div>
                    <div class="${sentimentColor} font-medium">${sentimentText}</div>
                </div>
                <div>
                    <div class="text-gray-400">Active Events</div>
                    <div class="text-yellow-400 font-medium">${summary.activeEvents} ongoing</div>
                </div>
                <div>
                    <div class="text-gray-400">Gainers/Losers</div>
                    <div class="font-medium">
                        <span class="text-green-400">${summary.gainers}</span> / 
                        <span class="text-red-400">${summary.losers}</span>
                    </div>
                </div>
                <div>
                    <div class="text-gray-400">Total Cards</div>
                    <div class="font-medium">${summary.totalCards}</div>
                </div>
            </div>
        `;
    }

    renderHotCards() {
        const hotCards = this.gameEngine.marketEngine.getHotCards(5);
        
        this.hotCardsList.innerHTML = '';
        
        if (hotCards.length === 0) {
            this.hotCardsList.innerHTML = '<p class="text-gray-500 text-sm">No trending cards right now</p>';
            return;
        }
        
        hotCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'hot-card-item flex justify-between items-center p-2 rounded mb-2 transition-colors';
            
            const eventBadge = card.event ? `<span class="hot-card-event text-xs px-1 rounded mr-1">Event: ${card.event}</span>` : '';
            
            cardElement.innerHTML = `
                <div class="flex-1 cursor-pointer" data-set-id="${card.setId}" data-card-name="${card.cardName}">
                    <div class="text-sm font-medium">${card.cardName}</div>
                    <div class="text-xs text-gray-400">${eventBadge}</div>
                </div>
                <div class="text-right mx-2">
                    <div class="text-sm">$${card.price.toFixed(2)}</div>
                    <div class="text-xs text-green-400">+${card.change.toFixed(1)}%</div>
                </div>
                <button class="hot-card-chart-btn bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded"
                        data-set-id="${card.setId}" 
                        data-card-name="${card.cardName}">
                    📊
                </button>
            `;
            
            // Add event listeners
            const chartBtn = cardElement.querySelector('.hot-card-chart-btn');
            const cardDiv = cardElement.querySelector('[data-set-id]');
            
            const openChart = () => this.openPriceChart(card.setId, card.cardName);
            chartBtn.addEventListener('click', openChart);
            cardDiv.addEventListener('click', openChart);
            
            this.hotCardsList.appendChild(cardElement);
        });
    }

    // Sell Modal Methods

    openSellModal(setId, cardName) {
        const collectionSet = this.gameEngine.state.collection[setId];
        const cardData = collectionSet[cardName];
        
        // Fix: Check if player has ANY version of the card (regular OR foil)
        const totalOwned = cardData ? (cardData.count + cardData.foilCount) : 0;
        if (!cardData || totalOwned === 0) {
            this.showNotification("You don't own this card", 'error');
            return;
        }
        
        this.currentSellCard = { setId, cardName };
        
        const rarity = this.gameEngine.getCardRarity(setId, cardName);
        const regularPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        const foilPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, true);
        const trend = this.gameEngine.marketEngine.getCardTrend(setId, cardName);
        
        const regularCount = cardData.count;
        const foilCount = cardData.foilCount;
        
        // Get available quantities considering locks
        const availableRegular = this.gameEngine.getAvailableQuantityForSale(setId, cardName, false);
        const availableFoil = this.gameEngine.getAvailableQuantityForSale(setId, cardName, true);
        
        // Check if card is locked
        const isLocked = this.isCardLocked(setId, cardName, regularCount, foilCount, rarity);
        
        this.sellCardInfo.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-lg">${cardName} ${isLocked ? '🔒' : ''}</h4>
                <p class="text-sm text-gray-400 capitalize">${rarity} | ${trend.trend} ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Regular Copies</div>
                    <div>${regularCount} owned | ${availableRegular} sellable @ $${regularPrice.toFixed(2)} each</div>
                    ${regularCount > availableRegular ? '<div class="text-yellow-400 text-xs">🔒 Some cards are locked</div>' : ''}
                </div>
                <div>
                    <div class="text-gray-400">Foil Copies</div>
                    <div>${foilCount} owned | ${availableFoil} sellable @ $${foilPrice.toFixed(2)} each</div>
                    ${foilCount > availableFoil ? '<div class="text-yellow-400 text-xs">🔒 Some cards are locked</div>' : ''}
                </div>
            </div>
        `;
        
        // Set max sellable quantity (will be updated in updateSalePreview based on foil checkbox)
        this.sellQuantity.max = Math.max(availableRegular, 1);
        this.sellQuantity.value = Math.min(1, availableRegular);
        this.sellFoilOnly.checked = false;
        
        // Disable foil checkbox if no foils available for sale
        this.sellFoilOnly.disabled = availableFoil === 0;
        
        // Reset to instant sell by default
        this.sellInstant.checked = true;
        this.sellListing.checked = false;
        this.customPriceSection.classList.add('hidden');
        
        // Update price guidance for listing option
        this.updatePriceGuidance(regularPrice, foilPrice);
        
        this.updateSalePreview();
        this.sellCardModal.classList.remove('hidden');
    }

    closeSellModal() {
        this.sellCardModal.classList.add('hidden');
        this.currentSellCard = null;
    }

    handleSellTypeChange() {
        const isListing = this.sellListing.checked;
        
        if (isListing) {
            this.customPriceSection.classList.remove('hidden');
            this.confirmSellBtn.textContent = 'Create Listing';
        } else {
            this.customPriceSection.classList.add('hidden');
            this.confirmSellBtn.textContent = 'Sell';
        }
        
        this.updateSalePreview();
    }

    updatePriceGuidance(regularPrice, foilPrice) {
        const minPrice = Math.min(regularPrice, foilPrice) * 0.5;
        const maxPrice = Math.max(regularPrice, foilPrice) * 2;
        
        this.priceGuidance.innerHTML = `
            Market prices: Regular $${regularPrice.toFixed(2)}, Foil $${foilPrice.toFixed(2)}<br>
            Suggested range: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}
        `;
    }

    updateSalePreview() {
        if (!this.currentSellCard) return;
        
        const quantity = parseInt(this.sellQuantity.value);
        const isFoil = this.sellFoilOnly.checked;
        const isListing = this.sellListing.checked;
        const { setId, cardName } = this.currentSellCard;
        
        // Get available quantity considering locks
        const availableQuantity = this.gameEngine.getAvailableQuantityForSale(setId, cardName, isFoil);
        
        // Update max quantity for the input
        this.sellQuantity.max = Math.max(availableQuantity, 1);
        
        if (quantity > availableQuantity) {
            this.salePreview.innerHTML = `
                <div class="text-red-400">
                    ❌ Not enough ${isFoil ? 'foil' : 'regular'} cards available for sale! You have ${availableQuantity} sellable copies.
                    ${availableQuantity === 0 ? '<br><small>🔒 All copies are locked by your protection settings.</small>' : ''}
                </div>
            `;
            this.confirmSellBtn.disabled = true;
            return;
        }
        
        if (isListing) {
            // Handle custom listing preview
            const customPrice = parseFloat(this.sellCustomPrice.value) || 0;
            if (customPrice <= 0) {
                this.salePreview.innerHTML = `
                    <div class="text-yellow-400">
                        ⚠️ Please enter a valid price per card
                    </div>
                `;
                this.confirmSellBtn.disabled = true;
                return;
            }
            
            const totalValue = customPrice * quantity;
            
            this.salePreview.innerHTML = `
                <div class="space-y-2">
                    <div class="text-sm text-gray-400 mb-2">📦 Listing Preview</div>
                    <div class="flex justify-between">
                        <span>Quantity:</span>
                        <span>${quantity}x ${isFoil ? 'Foil ' : ''}${cardName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Price per card:</span>
                        <span>$${customPrice.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between font-bold border-t pt-2">
                        <span>Total Value:</span>
                        <span class="text-blue-400">$${totalValue.toFixed(2)}</span>
                    </div>
                    <div class="text-xs text-gray-400 mt-2">
                        💡 Cards will be removed from your collection and listed for other players to buy
                    </div>
                </div>
            `;
        } else {
            // Handle instant sale preview
            const salePrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, isFoil);
            const totalValue = salePrice * quantity;
            const fee = totalValue * 0.05;
            const netValue = totalValue - fee;
            
            this.salePreview.innerHTML = `
                <div class="space-y-2">
                    <div class="text-sm text-gray-400 mb-2">⚡ Instant Sale Preview</div>
                    <div class="flex justify-between">
                        <span>Gross Value:</span>
                        <span>$${totalValue.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-red-400">
                        <span>Trading Fee (5%):</span>
                        <span>-$${fee.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between font-bold border-t pt-2">
                        <span>Net Proceeds:</span>
                        <span class="text-green-400">$${netValue.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }
        
        this.confirmSellBtn.disabled = false;
    }

    executeSale() {
        if (!this.currentSellCard) return;
        
        const quantity = parseInt(this.sellQuantity.value);
        const isFoil = this.sellFoilOnly.checked;
        const isListing = this.sellListing.checked;
        const { setId, cardName } = this.currentSellCard;
        
        let result;
        
        if (isListing) {
            // Create a listing
            const customPrice = parseFloat(this.sellCustomPrice.value);
            if (!customPrice || customPrice <= 0) {
                this.showNotification('Please enter a valid price', 'error');
                return;
            }
            
            result = this.gameEngine.createPlayerListing(setId, cardName, quantity, customPrice, isFoil);
        } else {
            // Instant sell
            result = this.gameEngine.sellCard(setId, cardName, quantity, isFoil);
        }
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.closeSellModal();
            
            // Immediate UI updates for better UX
            this.updatePlayerStats(); // Update cash/net worth immediately
            this.renderPortfolio(); // Update portfolio immediately
            
            // Update collection if we're on that tab
            if (this.currentTab === 'collection') {
                this.renderCollection();
            }
            
            // Update player listings if we created a listing
            if (isListing) {
                this.renderPlayerListings();
            }
            
            // If there's an open chart for this card, update it
            if (this.currentChartCard && 
                this.currentChartCard.setId === setId && 
                this.currentChartCard.cardName === cardName) {
                const timeframe = document.querySelector('.chart-timeframe-btn.active')?.dataset.timeframe || 1;
                this.updateChart(parseInt(timeframe));
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Buy Modal Methods

    openBuyModal(setId, cardName, isFoil, listingIndex) {
        const listings = this.gameEngine.marketEngine.getAvailableListings(setId, cardName, isFoil);
        
        if (!listings || listingIndex >= listings.length) {
            this.showNotification('Listing not available', 'error');
            return;
        }
        
        const listing = listings[listingIndex];
        const rarity = this.gameEngine.getCardRarity(setId, cardName);
        const trend = this.gameEngine.marketEngine.getCardTrend(setId, cardName);
        const regularPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        const foilPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, true);
        
        // Store purchase details for confirmation
        this.pendingPurchase = { setId, cardName, isFoil, listingIndex, listing };
        
        // Check if player has enough funds
        const currentWallet = this.gameEngine.state.wallet;
        const canAfford = currentWallet >= listing.price;
        
        // Match the sell modal's card info structure
        this.buyCardInfo.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-lg">${cardName}</h4>
                <p class="text-sm text-gray-400 capitalize">${rarity} | ${trend.trend} ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Regular Price</div>
                    <div>$${regularPrice.toFixed(2)} each</div>
                </div>
                <div>
                    <div class="text-gray-400">Foil Price</div>
                    <div>$${foilPrice.toFixed(2)} each</div>
                </div>
            </div>
        `;
        
        // Show purchase details (similar to sell quantity input)
        this.buyQuantityDisplay.innerHTML = `
            <div class="flex justify-between items-center">
                <span>Purchasing:</span>
                <span class="font-medium">1x ${isFoil ? 'Foil ' : ''}${cardName}</span>
            </div>
            <div class="flex justify-between items-center mt-1 text-xs text-gray-400">
                <span>From seller:</span>
                <span>${listing.sellerId}</span>
            </div>
        `;
        
        // Match the sell modal's preview structure
        this.buyPreview.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-gray-400">Price per card:</span>
                    <span class="font-medium">$${listing.price.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Quantity:</span>
                    <span>1</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-400">Available in stock:</span>
                    <span>${listing.quantity}x</span>
                </div>
                <hr style="border-color: var(--border-primary); margin: 8px 0;">
                <div class="flex justify-between font-bold">
                    <span>Total Cost:</span>
                    <span class="${!canAfford ? 'text-red-400' : 'text-green-400'}">$${listing.price.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-400">Your wallet:</span>
                    <span class="${!canAfford ? 'text-red-400' : ''}">$${currentWallet.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-gray-400">After purchase:</span>
                    <span class="${!canAfford ? 'text-red-400' : ''}">$${(currentWallet - listing.price).toFixed(2)}</span>
                </div>
                ${!canAfford ? '<div class="text-red-400 text-sm mt-2 text-center">⚠️ Insufficient funds</div>' : ''}
            </div>
        `;
        
        // Disable buy button if can't afford (same as sell modal behavior)
        this.confirmBuyBtn.disabled = !canAfford;
        this.confirmBuyBtn.style.opacity = canAfford ? '1' : '0.5';
        this.confirmBuyBtn.style.cursor = canAfford ? 'pointer' : 'not-allowed';
        
        this.buyCardModal.classList.remove('hidden');
    }

    closeBuyModal() {
        this.buyCardModal.classList.add('hidden');
        this.pendingPurchase = null;
    }

    confirmPurchase() {
        if (!this.pendingPurchase) return;
        
        const { setId, cardName, isFoil, listingIndex } = this.pendingPurchase;
        
        // Execute the purchase
        this.purchaseListing(setId, cardName, isFoil, listingIndex);
        
        // Close the modal
        this.closeBuyModal();
    }

    purchaseFromPlayer(setId, cardName, isFoil, listingId) {
        const result = this.gameEngine.purchaseFromPlayerListing(listingId, 1);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            
            // Update displays
            this.updatePlayerStats();
            this.renderCardDetailsPanel(); // Refresh the panel
            this.renderMarketListings(); // Refresh marketplace
            this.renderPlayerListings(); // Update player listings display
            
            // Update collection if on that tab
            if (this.currentTab === 'collection') {
                this.renderCollection();
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    // Listing Modal Methods (deprecated - now consolidated into Sell modal)
    
    openListingModal(setId, cardName) {
        // DEPRECATED: This functionality has been moved to the consolidated sell modal
        this.showNotification('This feature has been moved to the Sell button', 'info');
        this.openSellModal(setId, cardName);
        return;
        
        const collectionSet = this.gameEngine.state.collection[setId];
        const cardData = collectionSet[cardName];
        
        // Check if player has ANY version of the card
        const totalOwned = cardData ? (cardData.count + cardData.foilCount) : 0;
        if (!cardData || totalOwned === 0) {
            this.showNotification("You don't own this card", 'error');
            return;
        }
        
        this.currentListingCard = { setId, cardName };
        
        const rarity = this.gameEngine.getCardRarity(setId, cardName);
        const regularPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        const foilPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, true);
        const trend = this.gameEngine.marketEngine.getCardTrend(setId, cardName);
        
        const regularCount = cardData.count;
        const foilCount = cardData.foilCount;
        
        // Get available quantities considering locks
        const availableRegular = this.gameEngine.getAvailableQuantityForSale(setId, cardName, false);
        const availableFoil = this.gameEngine.getAvailableQuantityForSale(setId, cardName, true);
        
        // Check if card is locked
        const isLocked = this.isCardLocked(setId, cardName, regularCount, foilCount, rarity);
        
        this.listingCardInfo.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-lg">${cardName} ${isLocked ? '🔒' : ''}</h4>
                <p class="text-sm text-gray-400 capitalize">${rarity} | ${trend.trend} ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Regular Copies</div>
                    <div>${regularCount} owned | ${availableRegular} available</div>
                    <div class="text-xs text-gray-500">MSRP: $${regularPrice.toFixed(2)}</div>
                </div>
                <div>
                    <div class="text-gray-400">Foil Copies</div>
                    <div>${foilCount} owned | ${availableFoil} available</div>
                    <div class="text-xs text-gray-500">MSRP: $${foilPrice.toFixed(2)}</div>
                </div>
            </div>
        `;
        
        // Set max listable quantity
        this.listingQuantity.max = Math.max(availableRegular, 1);
        this.listingQuantity.value = Math.min(1, availableRegular);
        this.listingFoilOnly.checked = false;
        this.listingPrice.value = regularPrice.toFixed(2);
        
        // Disable foil checkbox if no foils available
        this.listingFoilOnly.disabled = availableFoil === 0;
        
        this.updateListingPreview();
        this.createListingModal.classList.remove('hidden');
    }

    closeListingModal() {
        this.createListingModal.classList.add('hidden');
        this.currentListingCard = null;
    }

    updateListingPreview() {
        if (!this.currentListingCard) return;
        
        const quantity = parseInt(this.listingQuantity.value) || 1;
        const price = parseFloat(this.listingPrice.value) || 0;
        const isFoil = this.listingFoilOnly.checked;
        const { setId, cardName } = this.currentListingCard;
        
        // Get available quantity considering locks
        const availableQuantity = this.gameEngine.getAvailableQuantityForSale(setId, cardName, isFoil);
        
        // Update max quantity for the input
        this.listingQuantity.max = Math.max(availableQuantity, 1);
        
        // Get market price for comparison
        const marketPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, isFoil);
        const priceComparison = price / marketPrice;
        
        let comparisonText = '';
        let comparisonColor = '';
        if (priceComparison > 1.2) {
            comparisonText = `📈 ${((priceComparison - 1) * 100).toFixed(0)}% above market`;
            comparisonColor = 'text-red-400';
        } else if (priceComparison < 0.8) {
            comparisonText = `📉 ${((1 - priceComparison) * 100).toFixed(0)}% below market`;
            comparisonColor = 'text-green-400';
        } else {
            comparisonText = '💰 Near market price';
            comparisonColor = 'text-blue-400';
        }
        
        this.priceGuidance.innerHTML = `
            <div class="${comparisonColor}">${comparisonText}</div>
            <div>Market price: $${marketPrice.toFixed(2)}</div>
        `;
        
        if (quantity > availableQuantity) {
            this.listingPreview.innerHTML = `
                <div class="text-red-400">
                    ❌ Not enough ${isFoil ? 'foil' : 'regular'} cards available! You have ${availableQuantity} available.
                </div>
            `;
            this.confirmListingBtn.disabled = true;
            return;
        }
        
        if (price <= 0) {
            this.listingPreview.innerHTML = `
                <div class="text-red-400">
                    ❌ Price must be greater than $0.00
                </div>
            `;
            this.confirmListingBtn.disabled = true;
            return;
        }
        
        const totalValue = price * quantity;
        
        this.listingPreview.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span>Listing ${quantity}x ${cardName}${isFoil ? ' (Foil)' : ''}</span>
                </div>
                <div class="flex justify-between">
                    <span>Price per card:</span>
                    <span>$${price.toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-bold border-t pt-2">
                    <span>Total if sold:</span>
                    <span class="text-green-400">$${totalValue.toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-400">
                    Cards will be removed from your collection when listed
                </div>
            </div>
        `;
        
        this.confirmListingBtn.disabled = false;
    }

    executeCreateListing() {
        if (!this.currentListingCard) return;
        
        const quantity = parseInt(this.listingQuantity.value);
        const price = parseFloat(this.listingPrice.value);
        const isFoil = this.listingFoilOnly.checked;
        const { setId, cardName } = this.currentListingCard;
        
        const result = this.gameEngine.createPlayerListing(setId, cardName, quantity, price, isFoil);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.closeListingModal();
            
            // Update displays
            this.updatePlayerStats();
            this.renderPortfolio();
            this.renderPlayerListings();
            
            // Update collection if on that tab
            if (this.currentTab === 'collection') {
                this.renderCollection();
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    showAchievementNotification(achievement) {
        this.achievementText.textContent = `${achievement.title}${achievement.reward > 0 ? ` (+$${achievement.reward})` : ''}`;
        this.achievementNotification.classList.remove('hidden');
        
        setTimeout(() => {
            this.achievementNotification.classList.add('hidden');
        }, 5000);
    }

    openProfileModal() {
        this.populateProfileModal();
        this.setupNetworthTimeframeButtons();
        this.profileModal.classList.remove('hidden');
    }

    setupNetworthTimeframeButtons() {
        this.networthTimeframeBtns = document.querySelectorAll('.chart-timeframe-btn');
        
        this.networthTimeframeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                this.networthTimeframeBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                e.target.classList.add('active');
                
                // Update timeframe and refresh chart
                const range = e.target.dataset.range;
                this.currentNetworthTimeframe = range === 'all' ? 'all' : parseInt(range);
                this.refreshNetworthChart();
            });
        });
    }

    refreshNetworthChart() {
        const stats = this.gameEngine.getPlayerStats();
        this.createNetWorthChart(stats.netWorthHistory);
    }

    closeProfileModal() {
        this.profileModal.classList.add('hidden');
        // Destroy chart if it exists
        if (this.netWorthChart) {
            this.netWorthChart.destroy();
            this.netWorthChart = null;
        }
    }

    // Lock Settings Modal Methods
    
    openLockSettingsModal() {
        const settings = this.gameEngine.state.cardLockSettings;
        
        // Populate current settings
        this.lockKeepOne.checked = settings.keepOne;
        this.lockKeepFoils.checked = settings.keepFoils;
        this.lockKeepOneFoil.checked = settings.keepOneFoil;
        this.lockKeepMythics.checked = settings.keepMythics;
        this.lockKeepRares.checked = settings.keepRares;
        
        this.lockSettingsModal.classList.remove('hidden');
    }

    closeLockSettingsModal() {
        this.lockSettingsModal.classList.add('hidden');
    }

    saveLockSettings() {
        // Update game state with new settings
        this.gameEngine.state.cardLockSettings = {
            keepOne: this.lockKeepOne.checked,
            keepFoils: this.lockKeepFoils.checked,
            keepOneFoil: this.lockKeepOneFoil.checked,
            keepMythics: this.lockKeepMythics.checked,
            keepRares: this.lockKeepRares.checked
        };
        
        // Save to localStorage
        this.gameEngine.saveState();
        
        // Refresh collection to show updated lock states
        this.renderCollection();
        
        this.showNotification('Lock settings saved!', 'success');
        this.closeLockSettingsModal();
    }

    populateProfileModal() {
        const stats = this.gameEngine.getPlayerStats();
        
        // Update basic info
        document.getElementById('profile-title').textContent = stats.currentTitle;
        document.getElementById('profile-portrait').textContent = stats.selectedPortrait;
        document.getElementById('profile-networth').textContent = stats.netWorth.toFixed(2);
        document.getElementById('profile-sales-count').textContent = stats.salesCount;
        
        // Update stats cards
        document.getElementById('profile-cash').textContent = stats.wallet.toFixed(2);
        document.getElementById('profile-highest-sale').textContent = stats.highestSale.toFixed(2);
        document.getElementById('profile-total-earnings').textContent = stats.totalEarnings.toFixed(2);
        document.getElementById('profile-total-spent').textContent = stats.totalSpent.toFixed(2);
        
        // Create net worth chart
        this.createNetWorthChart(stats.netWorthHistory);
    }

    createNetWorthChart(netWorthHistory) {
        const canvas = document.getElementById('networth-chart');
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.netWorthChart) {
            this.netWorthChart.destroy();
        }
        
        // Get theme colors
        const colors = this.getThemeColors();
        
        // Prepare data and ensure we have current time as endpoint
        const now = Date.now();
        const currentNetWorth = this.gameEngine.getPlayerStats().netWorth;
        
        // Create a copy of the history and ensure current net worth is included
        let historyData = [...netWorthHistory];
        const lastEntry = historyData[historyData.length - 1];
        
        // If the last entry is not recent (more than 1 minute old), add current value
        if (!lastEntry || (now - lastEntry.timestamp) > 60000) {
            historyData.push({ timestamp: now, value: currentNetWorth });
        }
        
        // Calculate time range based on selected timeframe
        let minTime, maxTime;
        if (this.currentNetworthTimeframe === 'all') {
            // Show all data
            const timestamps = historyData.map(entry => entry.timestamp);
            minTime = new Date(Math.min(...timestamps));
            maxTime = new Date(now);
        } else {
            // Show specific hours
            const timeRange = this.currentNetworthTimeframe * 60 * 60 * 1000; // hours to milliseconds
            minTime = new Date(now - timeRange);
            maxTime = new Date(now);
        }
        
        const chartData = historyData.map(entry => ({
            x: new Date(entry.timestamp),
            y: entry.value
        }));
        
        this.netWorthChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Net Worth',
                    data: chartData,
                    borderColor: colors.accentPrimary,
                    backgroundColor: colors.accentPrimary + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: colors.bgTertiary,
                        titleColor: colors.textPrimary,
                        bodyColor: colors.textPrimary,
                        borderColor: colors.borderSecondary,
                        borderWidth: 1,
                        callbacks: {
                            title: function(context) {
                                const date = new Date(context[0].parsed.x);
                                return date.toLocaleString();
                            },
                            label: function(context) {
                                return `Net Worth: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        min: minTime,
                        max: maxTime,
                        time: {
                            displayFormats: {
                                hour: 'MMM dd HH:mm',
                                day: 'MMM dd',
                                week: 'MMM dd',
                                month: 'MMM yyyy'
                            }
                        },
                        grid: {
                            color: colors.borderPrimary
                        },
                        ticks: {
                            color: colors.textSecondary
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: colors.borderPrimary
                        },
                        ticks: {
                            color: colors.textSecondary,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    // Price Chart Methods

    openPriceChart(setId, cardName) {
        this.currentChartCard = { setId, cardName };
        
        const rarity = this.gameEngine.getCardRarity(setId, cardName);
        const currentPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        const foilPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, true);
        const trend = this.gameEngine.marketEngine.getCardTrend(setId, cardName);
        
        this.chartCardName.textContent = cardName;
        this.chartCardDetails.textContent = `${rarity} | $${currentPrice.toFixed(2)} (foil: $${foilPrice.toFixed(2)}) | ${trend.trend} ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%`;
        
        this.updateChart(1); // Default to 1 day
        this.priceChartModal.classList.remove('hidden');
    }

    showPriceChart(setId, cardName) {
        // Store current card for reference
        this.currentChartCard = { setId, cardName };
        
        // Update modal title and details
        if (this.chartCardName) {
            this.chartCardName.textContent = cardName;
        }
        
        if (this.chartCardDetails) {
            const allSets = window.getAllSets();
            const setData = allSets[setId];
            const setName = setData ? setData.name : setId;
            
            // Get current price and rarity
            const currentPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName);
            const rarity = this.gameEngine.getCardRarity(setId, cardName);
            
            this.chartCardDetails.innerHTML = `
                <div class="text-sm text-gray-400">
                    <span class="font-medium">${setName}</span> • 
                    <span class="capitalize text-${this.getRarityColor(rarity)}-400">${rarity}</span>
                </div>
                <div class="text-lg font-bold text-white mt-1">
                    Current Price: $${currentPrice?.toFixed(2) || 'N/A'}
                </div>
            `;
        }
        
        // Show modal
        this.priceChartModal.classList.remove('hidden');
        
        // Load default timeframe (24 hours)
        this.updateChartTimeframe(1);
    }
    
    getRarityColor(rarity) {
        const colors = {
            common: 'gray',
            uncommon: 'green',
            rare: 'blue',
            mythic: 'purple'
        };
        return colors[rarity] || 'gray';
    }

    closePriceChart() {
        this.priceChartModal.classList.add('hidden');
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        this.currentChartCard = null;
    }

    updateChartTimeframe(timeframeDays) {
        // Update button states
        this.chartTimeframeBtns.forEach(btn => {
            btn.classList.remove('active', 'bg-blue-600', 'text-white');
            btn.classList.add('bg-gray-700', 'text-gray-300');
        });
        
        const activeBtn = document.querySelector(`[data-timeframe="${timeframeDays}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
            activeBtn.classList.remove('bg-gray-700', 'text-gray-300');
        }
        
        this.updateChart(timeframeDays);
    }

    updateChart(timeframeDays) {
        if (!this.currentChartCard) return;
        
        const { setId, cardName } = this.currentChartCard;
        const hours = timeframeDays * 24;
        const chartData = this.gameEngine.marketEngine.getChartData(setId, cardName, hours);
        
        // Debug logging to help understand chart data
        console.log(`Chart data for ${cardName} (${timeframeDays} days / ${hours} hours):`, {
            dataPoints: chartData.dataPoints,
            labels: chartData.labels.length,
            currentPrice: chartData.currentPrice,
            change24h: chartData.change24h,
            changePercent: chartData.changePercent,
            timeRange: chartData.labels.length > 0 ? {
                from: chartData.labels[0],
                to: chartData.labels[chartData.labels.length - 1]
            } : 'No data'
        });
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        // Get theme colors
        const colors = this.getThemeColors();
        this.currentTimeframeDays = timeframeDays;
        
        const ctx = this.priceChart.getContext('2d');
        
        // Prepare chart data
        const labels = chartData.labels.map(date => {
            if (timeframeDays === 1) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        });
        
        // Use theme-aware colors for trend
        const lineColor = chartData.changePercent > 0 ? colors.accentPrimary : 
                         chartData.changePercent < 0 ? '#ef4444' : colors.textMuted;
        
        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price ($)',
                    data: chartData.data,
                    borderColor: lineColor,
                    backgroundColor: lineColor + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: colors.borderPrimary
                        },
                        ticks: {
                            color: colors.textSecondary,
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: colors.borderPrimary
                        },
                        ticks: {
                            color: colors.textSecondary,
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        backgroundColor: lineColor,
                        borderColor: colors.textPrimary,
                        borderWidth: 1
                    }
                }
            }
        });
        
        // Update chart stats
        this.updateChartStats(chartData, timeframeDays);
    }

    updateChartStats(chartData, timeframeDays) {
        const timeframeName = timeframeDays === 1 ? '24h' : 
                             timeframeDays === 2 ? '2d' : 
                             timeframeDays === 7 ? '1w' : `${timeframeDays}d`;
        
        this.chartStats.innerHTML = `
            <div class="text-center">
                <div class="text-gray-400 text-xs">Current Price</div>
                <div class="font-bold">$${chartData.currentPrice.toFixed(2)}</div>
            </div>
            <div class="text-center">
                <div class="text-gray-400 text-xs">${timeframeName} Change</div>
                <div class="font-bold ${chartData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${chartData.changePercent >= 0 ? '+' : ''}${chartData.changePercent.toFixed(1)}%
                </div>
            </div>
            <div class="text-center">
                <div class="text-gray-400 text-xs">${timeframeName} High</div>
                <div class="font-bold">$${chartData.maxPrice.toFixed(2)}</div>
            </div>
            <div class="text-center">
                <div class="text-gray-400 text-xs">${timeframeName} Low</div>
                <div class="font-bold">$${chartData.minPrice.toFixed(2)}</div>
            </div>
        `;
    }

    // Theme Management Methods
    
    initializeThemes() {
        // Load saved theme or default to 'default'
        const savedTheme = this.loadTheme() || 'default';
        this.applyTheme(savedTheme);
        this.updateThemeSelector(savedTheme);
    }
    
    getThemeColors() {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
            textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
            textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
            textMuted: computedStyle.getPropertyValue('--text-muted').trim(),
            bgPrimary: computedStyle.getPropertyValue('--bg-primary').trim(),
            bgSecondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
            bgTertiary: computedStyle.getPropertyValue('--bg-tertiary').trim(),
            accentPrimary: computedStyle.getPropertyValue('--accent-primary').trim(),
            accentSecondary: computedStyle.getPropertyValue('--accent-secondary').trim(),
            borderPrimary: computedStyle.getPropertyValue('--border-primary').trim(),
            borderSecondary: computedStyle.getPropertyValue('--border-secondary').trim()
        };
    }
    
    setupThemeEventListeners() {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.setTheme(theme);
            });
        });
    }
    
    setTheme(themeName) {
        this.applyTheme(themeName);
        this.saveTheme(themeName);
        this.updateThemeSelector(themeName);
        
        // Recreate charts with new theme colors
        if (this.netWorthChart) {
            const stats = this.gameEngine.getPlayerStats();
            this.createNetWorthChart(stats.netWorthHistory);
        }
        
        if (this.currentChart && this.currentChartCard) {
            // Recreate price chart if it's open
            this.updateChart(this.currentTimeframeDays || 1);
        }
    }
    
    applyTheme(themeName) {
        // Remove existing theme data attributes
        document.documentElement.removeAttribute('data-theme');
        
        // Apply new theme
        if (themeName !== 'default') {
            document.documentElement.setAttribute('data-theme', themeName);
        }
    }
    
    updateThemeSelector(selectedTheme) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.theme === selectedTheme) {
                option.classList.add('active');
            }
        });
    }
    
    saveTheme(themeName) {
        try {
            localStorage.setItem('tcgSimTheme', themeName);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }
    
    loadTheme() {
        try {
            return localStorage.getItem('tcgSimTheme');
        } catch (error) {
            console.error('Failed to load theme preference:', error);
            return null;
        }
    }

    // Public method to refresh all UI elements
    refreshUI() {
        this.renderUnopenedPacks();
        this.updatePlayerStats();
        
        // Only refresh tab-specific content if that tab is active
        if (this.currentTab === 'collection') {
            this.renderCollection();
        } else if (this.currentTab === 'market') {
            this.renderPortfolio();
            this.renderMarketSummary();
            this.renderHotCards();
            this.renderMarketListings();
            this.renderWishlist();
            this.renderMarketActivity();
        }
    }

    // =============================================================================
    // TRADING MARKET UI METHODS
    // =============================================================================

    populateSetFilters() {
        if (!this.marketSetFilter) return;
        
        // Clear existing options except the first "All Sets"
        while (this.marketSetFilter.children.length > 1) {
            this.marketSetFilter.removeChild(this.marketSetFilter.lastChild);
        }
        
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            const option = document.createElement('option');
            option.value = setId;
            option.textContent = allSets[setId].name;
            this.marketSetFilter.appendChild(option);
        });
    }

    renderMarketListings() {
        if (!this.marketListings) return;
        
        if (!this.gameEngine || !this.gameEngine.marketEngine) {
            console.warn('Market engine not available for rendering listings');
            this.marketListings.innerHTML = '<div class="text-center text-gray-400 py-4">Market not available</div>';
            return;
        }
        
        const searchTerm = this.marketSearch?.value.toLowerCase() || '';
        const setFilter = this.marketSetFilter?.value || '';
        const rarityFilter = this.marketRarityFilter?.value || '';
        
        this.marketListings.innerHTML = '';
        
        const allSets = window.getAllSets();
        const availableCards = [];
        
        // Collect all cards with listings
        Object.keys(allSets).forEach(setId => {
            if (setFilter && setId !== setFilter) return;
            
            const setData = allSets[setId];
            if (!setData || !setData.cards) {
                console.warn(`Set ${setId} has invalid structure, skipping`);
                return;
            }
            
            Object.keys(setData.cards).forEach(rarity => {
                if (rarityFilter && rarity !== rarityFilter) return;
                
                const cardsInRarity = setData.cards[rarity];
                if (!Array.isArray(cardsInRarity)) {
                    console.warn(`Set ${setId} rarity ${rarity} is not an array, skipping`);
                    return;
                }
                
                cardsInRarity.forEach(cardName => {
                    if (searchTerm && !cardName.toLowerCase().includes(searchTerm)) return;
                    
                    try {
                        const listings = this.gameEngine.marketEngine.getAvailableListingsWithPlayer(setId, cardName);
                        if (listings.length > 0) {
                            const regularListings = listings.filter(l => !l.isFoil);
                            const foilListings = listings.filter(l => l.isFoil);
                            const bestPrice = regularListings.length > 0 ? Math.min(...regularListings.map(l => l.price)) : null;
                            const foilPrice = foilListings.length > 0 ? Math.min(...foilListings.map(l => l.price)) : null;
                            
                            availableCards.push({
                                setId,
                                cardName,
                                rarity,
                                bestPrice,
                                foilPrice,
                                totalListings: listings.length,
                                regularListings: regularListings.length,
                                foilListings: foilListings.length,
                                hasPlayerListings: listings.some(l => l.isPlayerListing)
                            });
                        }
                    } catch (error) {
                        console.error(`Error getting listings for ${setId}/${cardName}:`, error);
                    }
                });
            });
        });
        
        // Sort by price (lowest first)
        availableCards.sort((a, b) => (a.bestPrice || Infinity) - (b.bestPrice || Infinity));
        
        if (availableCards.length === 0) {
            this.marketListings.innerHTML = '<div class="text-center text-gray-400 py-4">No cards available matching your criteria</div>';
            return;
        }
        
        availableCards.forEach(card => this.createMarketListingElement(card));
    }

    createMarketListingElement(card) {
        const element = document.createElement('div');
        element.className = `market-listing-item bg-gray-800 rounded p-3 cursor-pointer hover:bg-gray-700 transition-colors border-l-4 rarity-${card.rarity}`;
        element.onclick = () => this.selectCardForPurchase(card);
        
        const isOnWishlist = this.gameEngine.marketEngine.state.wishlist.some(item => 
            item.setId === card.setId && item.cardName === card.cardName
        );
        
        element.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${card.cardName}</span>
                        ${isOnWishlist ? '<span class="text-yellow-400">⭐</span>' : ''}
                        <span class="text-xs px-2 py-1 rounded rarity-${card.rarity} bg-opacity-20">${card.rarity}</span>
                    </div>
                    <div class="text-sm text-gray-400">${window.getAllSets()[card.setId].name}</div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${card.regularListings} regular, ${card.foilListings} foil listings
                        ${card.hasPlayerListings ? '<span class="text-blue-400">• Player listings</span>' : ''}
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-green-400">$${card.bestPrice?.toFixed(2) || 'N/A'}</div>
                    ${card.foilPrice ? `<div class="text-sm text-yellow-400">Foil: $${card.foilPrice.toFixed(2)}</div>` : ''}
                </div>
            </div>
        `;
        
        this.marketListings.appendChild(element);
    }

    selectCardForPurchase(card) {
        this.selectedCard = card;
        this.renderCardDetailsPanel();
    }

    renderCardDetailsPanel() {
        if (!this.cardDetailsPanel || !this.selectedCard) return;
        
        const { setId, cardName } = this.selectedCard;
        const regularListings = this.gameEngine.marketEngine.getAvailableListingsWithPlayer(setId, cardName, false);
        const foilListings = this.gameEngine.marketEngine.getAvailableListingsWithPlayer(setId, cardName, true);
        const currentPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        
        this.cardDetailsPanel.innerHTML = `
            <div class="flex flex-col h-full">
                <!-- Card header info (fixed) -->
                <div class="border-b border-gray-600 pb-4 mb-4">
                    <h4 class="text-lg font-bold">${cardName}</h4>
                    <p class="text-sm text-gray-400">${window.getAllSets()[setId].name}</p>
                    <p class="text-sm">Market Price: $${currentPrice.toFixed(2)}</p>
                </div>
                
                <!-- Scrollable listings area with fixed height -->
                <div class="flex-1 overflow-y-auto space-y-4 pr-2" style="max-height: calc(100vh - 300px);">
                    ${this.renderScrollableListingSection('Regular', regularListings, false)}
                    ${foilListings.length > 0 ? this.renderScrollableListingSection('Foil', foilListings, true) : ''}
                </div>
                
                <!-- Sticky buttons at bottom -->
                <div class="flex gap-2 pt-4 border-t border-gray-600 mt-4">
                    <button onclick="uiManager.addToWishlistFromDetails('${setId}', '${cardName}', false)" 
                            class="bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded text-sm flex-1">
                        ⭐ Add to Wishlist
                    </button>
                    <button onclick="uiManager.showPriceChart('${setId}', '${cardName}')" 
                            class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">
                        📈 Price Chart
                    </button>
                </div>
            </div>
        `;
    }

    renderScrollableListingSection(title, listings, isFoil) {
        if (listings.length === 0) return '';
        
        const listingItems = listings.slice(0, 10).map((listing, index) => {
            const isPlayerListing = listing.isPlayerListing;
            const sellerDisplay = isPlayerListing ? 
                `<span class="text-blue-400">👤 ${listing.sellerId}</span>` : 
                `<span class="text-gray-500">${listing.sellerId}</span>`;
            const bgClass = isPlayerListing ? 'bg-blue-900/30' : 'bg-gray-700';
            
            return `
            <div class="flex justify-between items-center p-2 ${bgClass} rounded">
                <div>
                    <span class="font-medium">$${listing.price.toFixed(2)}</span>
                    <span class="text-sm text-gray-400 ml-2">${listing.quantity}x available</span>
                    <div class="text-xs">${sellerDisplay}</div>
                </div>
                <button onclick="uiManager.${isPlayerListing ? 'purchaseFromPlayer' : 'openBuyModal'}('${this.selectedCard.setId}', '${this.selectedCard.cardName}', ${isFoil}, ${isPlayerListing ? `'${listing.id}'` : index})" 
                        class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm">
                    Buy 1 for $${listing.price.toFixed(2)}
                </button>
            </div>
            `;
        }).join('');
        
        return `
            <div class="mb-4">
                <h5 class="font-semibold mb-2">${title} Listings (${listings.length})</h5>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                    ${listingItems}
                </div>
                ${listings.length > 10 ? `<div class="text-xs text-gray-500 mt-1">+${listings.length - 10} more listings</div>` : ''}
            </div>
        `;
    }

    renderWishlist() {
        if (!this.wishlistDisplay) return;
        
        const wishlist = this.gameEngine.marketEngine.getWishlist();
        
        if (wishlist.length === 0) {
            this.wishlistDisplay.innerHTML = '<div class="text-center text-gray-400 py-4">Your wishlist is empty</div>';
            return;
        }
        
        this.wishlistDisplay.innerHTML = '';
        
        wishlist.forEach((item, index) => {
            const element = document.createElement('div');
            element.className = `wishlist-item flex justify-between items-center p-2 border rounded ${item.isAvailable ? 'border-green-600 bg-green-900/20' : 'border-gray-600'}`;
            
            const priceDisplay = item.bestPrice 
                ? `$${item.bestPrice.toFixed(2)}` 
                : 'Not available';
            
            const priceClass = item.bestPrice && item.maxPrice && item.bestPrice <= item.maxPrice 
                ? 'text-green-400' 
                : 'text-gray-400';
            
            element.innerHTML = `
                <div class="flex-1">
                    <div class="font-medium">${item.cardName} ${item.isFoil ? '★' : ''}</div>
                    <div class="text-sm text-gray-400">
                        ${window.getAllSets()[item.setId].name} • 
                        Max: ${item.maxPrice ? `$${item.maxPrice.toFixed(2)}` : 'Any price'}
                    </div>
                </div>
                <div class="text-right">
                    <div class="${priceClass}">${priceDisplay}</div>
                    ${item.isAvailable ? '<div class="text-xs text-green-400">Available!</div>' : ''}
                </div>
                <button onclick="uiManager.removeFromWishlist('${item.setId}', '${item.cardName}', ${item.isFoil})" 
                        class="ml-2 text-red-400 hover:text-red-300">×</button>
            `;
            
            this.wishlistDisplay.appendChild(element);
        });
    }

    renderMarketActivity() {
        if (!this.marketActivityFeed) return;
        
        const activity = this.gameEngine.marketEngine.getRecentMarketActivity(20);
        
        this.marketActivityFeed.innerHTML = '';
        
        activity.forEach(event => {
            const element = document.createElement('div');
            element.className = 'activity-item flex justify-between items-center py-1';
            
            const timeAgo = this.formatTimeAgo(event.timestamp);
            let actionIcon, actionText, actorText;
            
            switch(event.type) {
                case 'buy':
                    actionIcon = '🛒';
                    actionText = 'bought';
                    actorText = 'Someone';
                    break;
                case 'list':
                    actionIcon = '📝';
                    actionText = 'listed';
                    actorText = 'Someone';
                    break;
                case 'player_list':
                    actionIcon = '👤📝';
                    actionText = 'listed';
                    actorText = 'You';
                    break;
                case 'player_buy':
                    actionIcon = '👤🛒';
                    actionText = 'bought';
                    actorText = 'You';
                    break;
                case 'ai_buy_from_player':
                    actionIcon = '🤖💰';
                    actionText = 'bought from you';
                    actorText = event.buyerId || 'AI Buyer';
                    break;
                default:
                    actionIcon = '⏰';
                    actionText = 'expired';
                    actorText = 'Listing';
            }
            
            // Color-code different activity types
            let textClass = '';
            if (event.type.startsWith('player_')) {
                textClass = 'text-blue-400'; // Player activities in blue
            } else if (event.type === 'ai_buy_from_player') {
                textClass = 'text-green-400'; // AI buying from player in green (money coming in)
            }
            
            element.innerHTML = `
                <span class="text-xs ${textClass}">
                    ${actionIcon} ${actorText} ${actionText} ${event.quantity}x ${event.cardName} 
                    ${event.isFoil ? '★' : ''} for $${event.price.toFixed(2)}
                </span>
                <span class="text-xs text-gray-500">${timeAgo}</span>
            `;
            
            this.marketActivityFeed.appendChild(element);
        });
    }

    // User Actions
    purchaseListing(setId, cardName, isFoil, listingIndex) {
        const result = this.gameEngine.marketEngine.purchaseCard(setId, cardName, isFoil, listingIndex);
        
        if (result.success) {
            // Handle the purchase in the game engine
            this.gameEngine.state.wallet -= result.cost;
            this.gameEngine.state.totalSpent += result.cost;
            
            // Add cards to collection
            if (!this.gameEngine.state.collection[setId]) {
                this.gameEngine.state.collection[setId] = {};
            }
            if (!this.gameEngine.state.collection[setId][cardName]) {
                this.gameEngine.state.collection[setId][cardName] = { count: 0, foilCount: 0 };
            }
            
            // Fix: Only add to total count if it's a regular card
            // Foil cards only increment foilCount, not total count
            if (result.isFoil) {
                this.gameEngine.state.collection[setId][cardName].foilCount += result.quantity;
            } else {
                this.gameEngine.state.collection[setId][cardName].count += result.quantity;
            }
            
            this.gameEngine.updateNetWorth();
            this.gameEngine.saveState();
            
            this.showNotification(result.message, 'success');
            this.renderCardDetailsPanel(); // Refresh the panel
            this.renderWishlist(); // Update wishlist in case this was a wishlist item
            this.updatePlayerStats(); // Update wallet display
            this.renderPortfolio(); // Update portfolio
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    addToWishlistFromDetails(setId, cardName, isFoil) {
        // Show the wishlist modal with pre-filled information
        this.showAddToWishlistModal(setId, cardName, isFoil);
    }

    removeFromWishlist(setId, cardName, isFoil) {
        const result = this.gameEngine.marketEngine.removeFromWishlist(setId, cardName, isFoil);
        this.showNotification(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
            this.renderWishlist();
            this.renderMarketListings(); // Refresh to update wishlist indicators
        }
    }

    showAddToWishlistModal(presetSetId = null, presetCardName = null, presetIsFoil = false) {
        if (!this.wishlistModal) return;
        
        // Populate set selector
        const setSelect = document.getElementById('wishlist-set-select');
        if (setSelect) {
            // Clear existing options except the first
            while (setSelect.children.length > 1) {
                setSelect.removeChild(setSelect.lastChild);
            }
            
            const allSets = window.getAllSets();
            Object.keys(allSets).forEach(setId => {
                const option = document.createElement('option');
                option.value = setId;
                option.textContent = allSets[setId].name;
                setSelect.appendChild(option);
            });
            
            // Pre-select set if provided
            if (presetSetId) {
                setSelect.value = presetSetId;
            }
        }
        
        // Pre-fill card name if provided
        if (presetCardName && this.wishlistCardInput) {
            this.wishlistCardInput.value = presetCardName;
        }
        
        // Pre-set foil checkbox if needed
        if (presetIsFoil) {
            const foilCheckbox = document.getElementById('wishlist-foil-checkbox');
            if (foilCheckbox) {
                foilCheckbox.checked = presetIsFoil;
            }
        }
        
        // Show the modal
        this.wishlistModal.classList.remove('hidden');
        
        // Focus appropriately
        if (presetCardName) {
            // Focus on price input since card is pre-filled
            const priceInput = document.getElementById('wishlist-price-input');
            if (priceInput) {
                setTimeout(() => priceInput.focus(), 100);
            }
        } else {
            // Focus on card input
            if (this.wishlistCardInput) {
                setTimeout(() => this.wishlistCardInput.focus(), 100);
            }
        }
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }

    renderPlayerListings() {
        if (!this.playerListingsDisplay || !this.listingsCount) return;
        
        const listings = this.gameEngine.getPlayerListings();
        
        // Update count display
        this.listingsCount.textContent = `${listings.length} active listing${listings.length !== 1 ? 's' : ''}`;
        
        if (listings.length === 0) {
            this.playerListingsDisplay.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    No active listings. Create a listing from your portfolio to start selling!
                </div>
            `;
            return;
        }
        
        this.playerListingsDisplay.innerHTML = '';
        
        listings.forEach(listing => {
            const element = document.createElement('div');
            element.className = 'listing-item bg-gray-800/50 rounded p-3 mb-2';
            
            const listedTime = this.formatTimeAgo(listing.listedAt);
            const totalValue = listing.price * listing.quantity;
            
            element.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium">${listing.cardName}${listing.isFoil ? ' ⭐' : ''}</div>
                        <div class="text-sm text-gray-400">${window.getAllSets()[listing.setId].name}</div>
                        <div class="text-sm">
                            ${listing.quantity}x @ $${listing.price.toFixed(2)} each = $${totalValue.toFixed(2)}
                        </div>
                        <div class="text-xs text-gray-500">Listed ${listedTime}</div>
                    </div>
                    <div class="ml-3">
                        <button class="cancel-listing-btn bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                                data-listing-id="${listing.id}">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            this.playerListingsDisplay.appendChild(element);
        });
        
        // Add event listeners for cancel buttons
        const cancelButtons = this.playerListingsDisplay.querySelectorAll('.cancel-listing-btn');
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const listingId = btn.dataset.listingId;
                this.cancelPlayerListing(listingId);
            });
        });
    }

    cancelPlayerListing(listingId) {
        const result = this.gameEngine.cancelPlayerListing(listingId);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            
            // Update all relevant displays
            this.renderPlayerListings();
            this.renderPortfolio();
            this.updatePlayerStats();
            
            // Update collection if on that tab
            if (this.currentTab === 'collection') {
                this.renderCollection();
            }
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    handleListingSold(buyer, listing, result, proceeds) {
        // Show notification that listing was sold
        const message = `🤖💰 ${buyer.id} bought your ${listing.cardName}${listing.isFoil ? ' ⭐' : ''} for $${proceeds.toFixed(2)}!`;
        this.showNotification(message, 'success', 6000); // Show for 6 seconds
        
        // Update all relevant displays
        this.updatePlayerStats();
        this.renderPlayerListings();
        this.renderMarketActivity();
        
        // Update collection if on that tab
        if (this.currentTab === 'collection') {
            this.renderCollection();
        }
        
        // Update portfolio
        this.renderPortfolio();
    }

    toggleBuyerStats() {
        if (!this.buyerStatsDisplay || !this.buyerStatsToggle) return;
        
        const isHidden = this.buyerStatsDisplay.classList.contains('hidden');
        
        if (isHidden) {
            this.buyerStatsDisplay.classList.remove('hidden');
            this.buyerStatsToggle.textContent = '▲ Hide';
            this.renderBuyerStats();
        } else {
            this.buyerStatsDisplay.classList.add('hidden');
            this.buyerStatsToggle.textContent = '▼ Show';
        }
    }

    renderBuyerStats() {
        if (!this.buyerStatsDisplay) return;
        
        const buyerStats = this.gameEngine.marketEngine.getBuyerStatistics();
        const listingStats = this.gameEngine.marketEngine.getPlayerListingStats();
        
        this.buyerStatsDisplay.innerHTML = `
            <div class="mb-4 p-3 bg-gray-800/50 rounded">
                <div class="font-medium mb-2">📊 Market Overview</div>
                <div class="grid grid-cols-3 gap-4 text-xs">
                    <div>
                        <div class="text-gray-400">Active Listings</div>
                        <div class="font-medium">${listingStats.totalListings}</div>
                    </div>
                    <div>
                        <div class="text-gray-400">Total Value</div>
                        <div class="font-medium">$${listingStats.totalValue.toFixed(2)}</div>
                    </div>
                    <div>
                        <div class="text-gray-400">Avg. Price</div>
                        <div class="font-medium">$${listingStats.averageValue.toFixed(2)}</div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-2">
                <div class="font-medium mb-2">🤖 AI Buyer Performance</div>
                ${buyerStats.map(buyer => `
                    <div class="p-2 bg-gray-800/30 rounded text-xs">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">${buyer.id}</span>
                            <span class="text-gray-400">${buyer.type}</span>
                        </div>
                        <div class="mt-1 grid grid-cols-3 gap-2">
                            <div>
                                <div class="text-gray-400">Purchases</div>
                                <div>${buyer.totalPurchases}</div>
                            </div>
                            <div>
                                <div class="text-gray-400">Total Spent</div>
                                <div>$${buyer.totalSpent.toFixed(2)}</div>
                            </div>
                            <div>
                                <div class="text-gray-400">Avg. Buy</div>
                                <div>$${buyer.averageSpend.toFixed(2)}</div>
                            </div>
                        </div>
                        ${buyer.lastActivity > 0 ? `
                            <div class="mt-1 text-gray-500">
                                Last: ${this.formatTimeAgo(buyer.lastActivity)}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        if (this.marketUpdateInterval) {
            clearInterval(this.marketUpdateInterval);
            this.marketUpdateInterval = null;
        }
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else {
    window.UIManager = UIManager;
}