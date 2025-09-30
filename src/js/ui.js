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
        // DOM elements
        this.setSelector = document.getElementById('set-selector');
        this.collectionSetSelector = document.getElementById('collection-set-selector');
        this.buyPackBtn = document.getElementById('buy-pack-btn');
        this.buyBoxBtn = document.getElementById('buy-box-btn');
        this.unopenedPacksDisplay = document.getElementById('unopened-packs-display');
        this.openedPackDisplay = document.getElementById('opened-pack-display');
        this.collectionDisplay = document.getElementById('collection-display');
        this.collectionProgress = document.getElementById('collection-progress');
        
        // Modal elements
        this.packOpeningModal = document.getElementById('pack-opening-modal');
        this.packArtTearable = document.getElementById('pack-art-tearable');
        this.packArtSetName = document.getElementById('pack-art-set-name');
        this.packArtTearOff = document.getElementById('pack-art-tear-off');
        this.packArtSetNameTorn = document.getElementById('pack-art-set-name-torn');

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
        this.setSelector.addEventListener('change', (e) => {
            this.gameEngine.setSelectedSet(e.target.value);
            this.updateBuyBoxButtonText();
        });
        
        this.collectionSetSelector.addEventListener('change', () => {
            this.renderCollection();
        });
        
        this.buyPackBtn.addEventListener('click', () => {
            this.gameEngine.buyPacks(1);
            this.renderUnopenedPacks();
        });
        
        this.buyBoxBtn.addEventListener('click', () => {
            const allSets = window.getAllSets();
            const set = allSets[this.gameEngine.state.selectedSet];
            this.gameEngine.buyPacks(set.boosterBoxSize);
            this.renderUnopenedPacks();
        });

        // Start the countdown timer for weekly sets
        this.startWeeklyCountdown();
        
        // Initial button text update
        this.updateBuyBoxButtonText();
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
            
            const cardElement = this.createCollectionCardElement(cardInfo.name, cardInfo.rarity, foilCount > 0, count, foilCount);
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

    createCollectionCardElement(name, rarity, isFoil, count, foilCount) {
        const element = document.createElement('div');
        const foilClass = isFoil ? 'foil' : '';
        const ownedClass = count === 0 ? 'opacity-40' : '';
        element.className = `card-face relative border-4 rounded-lg p-2 h-40 flex flex-col justify-between bg-gray-800 shadow-md rarity-${rarity} ${foilClass} ${ownedClass}`;
        
        let countDisplay = `
            <div class="absolute top-1 right-1 bg-gray-900 text-white text-xs font-bold rounded-full px-2 py-1">
                ${isFoil ? `<span class="text-yellow-400">★${foilCount}</span> / ` : ''} ${count}x
            </div>
        `;

        element.innerHTML = this.createCardFaceHTML(name, rarity) + countDisplay;
        return element;
    }

    // Public method to refresh all UI elements
    refreshUI() {
        this.renderUnopenedPacks();
        this.renderCollection();
    }

    // Cleanup method to prevent memory leaks
    destroy() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else {
    window.UIManager = UIManager;
}