// UI Rendering and Interaction Management
class UIManager {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.currentOpeningPack = null;
        this.initializeElements();
        this.setupEventListeners();
        this.setupPackTearing();
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
        this.salePreview = document.getElementById('sale-preview');
        this.confirmSellBtn = document.getElementById('confirm-sell-btn');
        this.cancelSellBtn = document.getElementById('cancel-sell-btn');
        
        // Achievement notification
        this.achievementNotification = document.getElementById('achievement-notification');
        this.achievementText = document.getElementById('achievement-text');
        
        this.currentSellCard = null;
        this.currentTab = 'packs'; // Default tab
        this.currentChart = null;
        this.currentChartCard = null;
        this.portfolioFilters = {
            search: '',
            sort: 'value-desc',
            filter: 'all'
        };

        // Populate selectors
        this.populateSetSelectors();
    }

    populateSetSelectors() {
        const allSets = window.getAllSets();
        Object.keys(allSets).forEach(setId => {
            const set = allSets[setId];
            const option = new Option(set.name, setId);
            const collectionOption = new Option(set.name, setId);
            
            // Add special styling for weekly sets
            if (set.isWeekly) {
                option.style.background = 'linear-gradient(90deg, #9333ea, #ec4899)';
                option.style.color = 'white';
                option.style.fontWeight = 'bold';
                collectionOption.style.background = 'linear-gradient(90deg, #9333ea, #ec4899)';
                collectionOption.style.color = 'white';
                collectionOption.style.fontWeight = 'bold';
            }
            
            this.setSelector.add(option);
            this.collectionSetSelector.add(collectionOption);
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
            this.updatePlayerStats();
            this.showNotification(result.message, 'success');
        } else {
            this.showNotification(result.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
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
        }, 3000);
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
            this.marketContent.classList.remove('hidden');
            this.renderPortfolio(); // Refresh portfolio when switching to tab
            this.renderMarketSummary();
            this.renderHotCards();
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
                const packElement = document.createElement('div');
                
                if (set.isWeekly) {
                    // Special styling for weekly sets
                    packElement.className = 'pack p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg text-center shadow-lg border-2 border-yellow-400 relative';
                    packElement.innerHTML = `
                        <div class="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold rounded-full px-2 py-1">
                            ⏰ WEEKLY
                        </div>
                        <div class="font-bold text-lg text-white">${set.name}</div>
                        <div class="text-2xl text-white">${count}x</div>
                        <div class="text-sm text-yellow-200">Click to Open</div>
                        <div class="text-xs text-yellow-300 mt-1">
                            Time Left: <span id="weekly-countdown">Loading...</span>
                        </div>
                    `;
                } else {
                    // Normal styling for regular sets
                    packElement.className = 'pack p-4 bg-gray-700 rounded-lg text-center shadow-md';
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
        
        const setName = window.TCG_SETS[setId].name;
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
                cardFront.classList.add(`rarity-${rarity}`, 'border-4', 'rounded-lg', 'p-2', 'h-full', 'flex', 'flex-col', 'justify-between', 'bg-gray-800', 'shadow-md');
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

        progress.allCards.forEach(cardInfo => {
            const cardData = collectionSet[cardInfo.name];
            const count = cardData ? cardData.count : 0;
            const foilCount = cardData ? cardData.foilCount : 0;
            
            const cardElement = this.createCollectionCardElement(cardInfo.name, cardInfo.rarity, foilCount > 0, count, foilCount, selectedSetId);
            this.collectionDisplay.appendChild(cardElement);
        });
        
        this.collectionProgress.textContent = `${progress.collected} / ${progress.total} (${progress.percentage}%)`;
    }

    createCardFaceHTML(name, rarity) {
        return `
            <div class="font-semibold text-sm leading-tight">${name}</div>
            <div class="text-xs self-end capitalize text-gray-400">${rarity}</div>
        `;
    }

    createCollectionCardElement(name, rarity, isFoil, count, foilCount, setId = null) {
        const element = document.createElement('div');
        const foilClass = isFoil ? 'foil' : '';
        const ownedClass = count === 0 ? 'opacity-40' : '';
        element.className = `card-face relative border-4 rounded-lg p-2 h-40 flex flex-col justify-between bg-gray-800 shadow-md rarity-${rarity} ${foilClass} ${ownedClass} cursor-pointer hover:transform hover:scale-105 transition-transform`;
        
        let countDisplay = `
            <div class="absolute top-1 right-1 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-1">
                ${isFoil ? `<span class="text-yellow-400">★${foilCount}</span> / ` : ''} ${count}x
            </div>
        `;
        
        // Add sell button if player owns the card
        if (count > 0) {
            countDisplay += `
                <div class="absolute bottom-1 right-1">
                    <button class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2 py-1 rounded sell-card-btn" 
                            data-set-id="${setId || this.collectionSetSelector.value}" 
                            data-card-name="${name}">
                        💰 Sell
                    </button>
                </div>
            `;
        }

        element.innerHTML = this.createCardFaceHTML(name, rarity) + countDisplay;
        
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
        }, 30000);
        
        // Initial render
        this.updatePlayerStats();
        this.renderPortfolio();
        this.renderMarketSummary();
        this.renderHotCards();
    }

    onMarketUpdate() {
        // Called by market engine when prices update
        this.updatePlayerStats();
        this.renderPortfolio();
        this.renderMarketSummary();
        this.renderHotCards();
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
        
        this.portfolioValue.textContent = portfolio.totalValue.toFixed(2);
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
            cardElement.className = 'flex justify-between items-center p-3 bg-gray-800 rounded-lg mb-2 hover:bg-gray-700 transition-colors';
            
            const trendIcon = card.trend.trend === 'rising' ? '📈' : 
                             card.trend.trend === 'falling' ? '📉' : '➡️';
            const trendColor = card.trend.trend === 'rising' ? 'text-green-400' : 
                              card.trend.trend === 'falling' ? 'text-red-400' : 'text-gray-400';
            
            cardElement.innerHTML = `
                <div class="flex-1 cursor-pointer chart-card-trigger" data-set-id="${card.setId}" data-card-name="${card.cardName}">
                    <div class="font-medium text-sm">${card.cardName}</div>
                    <div class="text-xs text-gray-400">
                        ${card.regularCount > 0 ? `${card.regularCount}x regular ` : ''}
                        ${card.foilCount > 0 ? `${card.foilCount}x foil ` : ''}
                        | ${card.rarity}
                    </div>
                </div>
                <div class="text-right mx-3">
                    <div class="font-medium">$${card.totalValue.toFixed(2)}</div>
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
    }

    filterPortfolioCards(cards) {
        return cards.filter(card => {
            // Search filter
            if (this.portfolioFilters.search && 
                !card.cardName.toLowerCase().includes(this.portfolioFilters.search)) {
                return false;
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
            cardElement.className = 'flex justify-between items-center p-2 bg-gray-800 rounded mb-2 hover:bg-gray-700 transition-colors';
            
            const eventBadge = card.event ? `<span class="bg-orange-500 text-xs px-1 rounded mr-1">${card.event}</span>` : '';
            
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
        
        if (!cardData || cardData.count === 0) {
            this.showNotification("You don't own this card", 'error');
            return;
        }
        
        this.currentSellCard = { setId, cardName };
        
        const rarity = this.gameEngine.getCardRarity(setId, cardName);
        const regularPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, false);
        const foilPrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, true);
        const trend = this.gameEngine.marketEngine.getCardTrend(setId, cardName);
        
        const regularCount = cardData.count - cardData.foilCount;
        const foilCount = cardData.foilCount;
        
        this.sellCardInfo.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-lg">${cardName}</h4>
                <p class="text-sm text-gray-400 capitalize">${rarity} | ${trend.trend} ${trend.change > 0 ? '+' : ''}${trend.change.toFixed(1)}%</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-gray-400">Regular Copies</div>
                    <div>${regularCount} @ $${regularPrice.toFixed(2)} each</div>
                </div>
                <div>
                    <div class="text-gray-400">Foil Copies</div>
                    <div>${foilCount} @ $${foilPrice.toFixed(2)} each</div>
                </div>
            </div>
        `;
        
        this.sellQuantity.max = cardData.count;
        this.sellQuantity.value = 1;
        this.sellFoilOnly.checked = false;
        
        // Disable foil checkbox if no foils
        this.sellFoilOnly.disabled = foilCount === 0;
        
        this.updateSalePreview();
        this.sellCardModal.classList.remove('hidden');
    }

    closeSellModal() {
        this.sellCardModal.classList.add('hidden');
        this.currentSellCard = null;
    }

    updateSalePreview() {
        if (!this.currentSellCard) return;
        
        const quantity = parseInt(this.sellQuantity.value);
        const isFoil = this.sellFoilOnly.checked;
        const { setId, cardName } = this.currentSellCard;
        
        const collectionSet = this.gameEngine.state.collection[setId];
        const cardData = collectionSet[cardName];
        const availableQuantity = isFoil ? cardData.foilCount : (cardData.count - cardData.foilCount);
        
        if (quantity > availableQuantity) {
            this.salePreview.innerHTML = `
                <div class="text-red-400">
                    ❌ Not enough cards! You have ${availableQuantity} ${isFoil ? 'foil' : 'regular'} copies.
                </div>
            `;
            this.confirmSellBtn.disabled = true;
            return;
        }
        
        const salePrice = this.gameEngine.marketEngine.getCardPrice(setId, cardName, isFoil);
        const totalValue = salePrice * quantity;
        const fee = totalValue * 0.05;
        const netValue = totalValue - fee;
        
        this.salePreview.innerHTML = `
            <div class="space-y-2">
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
        
        this.confirmSellBtn.disabled = false;
    }

    executeSale() {
        if (!this.currentSellCard) return;
        
        const quantity = parseInt(this.sellQuantity.value);
        const isFoil = this.sellFoilOnly.checked;
        const { setId, cardName } = this.currentSellCard;
        
        const result = this.gameEngine.sellCard(setId, cardName, quantity, isFoil);
        
        if (result.success) {
            this.showNotification(result.message, 'success');
            this.closeSellModal();
            this.refreshUI();
            this.renderPortfolio();
            this.updatePlayerStats();
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
        
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        const ctx = this.priceChart.getContext('2d');
        
        // Prepare chart data
        const labels = chartData.labels.map(date => {
            if (timeframeDays === 1) {
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
        });
        
        // Determine line color based on overall trend
        const lineColor = chartData.changePercent > 0 ? '#10b981' : 
                         chartData.changePercent < 0 ? '#ef4444' : '#6b7280';
        
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
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#9ca3af',
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
                        borderColor: '#ffffff',
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
        }
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