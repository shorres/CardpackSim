// Simple Update Notification System
class SimpleUpdater {
    constructor() {
        this.checkInterval = 24 * 60 * 60 * 1000; // 24 hours
        this.lastCheck = localStorage.getItem('lastUpdateCheck');
        this.dismissedVersion = localStorage.getItem('dismissedVersion');
        this.currentVersion = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        // Get current version
        this.currentVersion = await this.getCurrentVersion();
        
        // Check on startup if it's been a while
        if (this.shouldCheck()) {
            setTimeout(() => this.checkForUpdates(), 5000); // Wait 5 seconds after startup
        }
        
        this.initialized = true;
        console.log('Simple updater initialized');
    }

    async getCurrentVersion() {
        // Try to get version from Electron first
        if (window.electronAPI && window.electronAPI.getAppVersion) {
            try {
                return await window.electronAPI.getAppVersion();
            } catch (error) {
                console.log('Could not get version from Electron');
            }
        }
        
        // Fallback to hardcoded version (update this when you release)
        return '1.3.1';
    }

    shouldCheck() {
        if (!this.lastCheck) return true;
        return Date.now() - parseInt(this.lastCheck) > this.checkInterval;
    }

    async checkForUpdates() {
        try {
            console.log('Checking for updates...');
            const response = await fetch('https://api.github.com/repos/shorres/CardpackSim/releases/latest');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const release = await response.json();
            
            localStorage.setItem('lastUpdateCheck', Date.now().toString());
            
            if (this.isNewerVersion(release.tag_name) && 
                release.tag_name !== this.dismissedVersion) {
                this.showUpdateNotification(release);
            } else {
                console.log('No updates available');
            }
        } catch (error) {
            console.log('Update check failed (this is normal):', error.message);
            // Silently fail - don't bother the user
        }
    }

    showUpdateNotification(release) {
        // Remove any existing update banners
        const existingBanner = document.querySelector('.update-banner');
        if (existingBanner) {
            existingBanner.remove();
        }

        const banner = document.createElement('div');
        banner.className = 'update-banner';
        banner.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #2196F3, #1976D2); 
                color: white; 
                padding: 12px 20px; 
                text-align: center; 
                position: relative;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                border-bottom: 1px solid rgba(255,255,255,0.1);
                font-family: system-ui, -apple-system, sans-serif;
            ">
                <div style="display: flex; align-items: center; justify-content: center; gap: 15px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 18px;">🚀</span>
                        <span style="font-weight: 500;">New version ${release.tag_name} available!</span>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <a href="${release.html_url}" target="_blank" rel="noopener noreferrer" 
                           style="
                               color: white; 
                               text-decoration: none; 
                               background: rgba(255,255,255,0.2); 
                               padding: 6px 12px; 
                               border-radius: 4px; 
                               font-weight: 500;
                               transition: background 0.2s;
                               border: 1px solid rgba(255,255,255,0.3);
                           "
                           onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                           onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            📥 Download
                        </a>
                        <button onclick="this.dismissUpdate('${release.tag_name}')" 
                                style="
                                    background: none; 
                                    border: 1px solid rgba(255,255,255,0.3); 
                                    color: white; 
                                    cursor: pointer; 
                                    padding: 6px 12px;
                                    border-radius: 4px;
                                    font-weight: 500;
                                    transition: all 0.2s;
                                "
                                onmouseover="this.style.background='rgba(255,255,255,0.1)'"
                                onmouseout="this.style.background='none'">
                            ❌ Dismiss
                        </button>
                    </div>
                </div>
                ${release.body ? `
                    <div style="
                        margin-top: 10px; 
                        padding-top: 10px; 
                        border-top: 1px solid rgba(255,255,255,0.2);
                        font-size: 14px;
                        opacity: 0.9;
                        max-height: 100px;
                        overflow-y: auto;
                    ">
                        ${this.formatReleaseNotes(release.body)}
                    </div>
                ` : ''}
            </div>
        `;

        // Add dismiss functionality
        window.dismissUpdate = (version) => {
            localStorage.setItem('dismissedVersion', version);
            banner.remove();
            console.log(`Update ${version} dismissed`);
        };

        // Insert at the top of the page
        document.body.insertBefore(banner, document.body.firstChild);
        
        console.log(`Update notification shown for version ${release.tag_name}`);
    }

    formatReleaseNotes(notes) {
        // Simple formatting for release notes
        return notes
            .replace(/\r\n/g, '\n')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .substring(0, 300) + (notes.length > 300 ? '...' : '');
    }

    isNewerVersion(newVersion) {
        if (!this.currentVersion) return false;
        
        // Remove 'v' prefix if present
        const cleanNew = newVersion.replace(/^v/, '');
        const cleanCurrent = this.currentVersion.replace(/^v/, '');
        
        // Simple version comparison - works for semantic versioning
        const newParts = cleanNew.split('.').map(Number);
        const currentParts = cleanCurrent.split('.').map(Number);
        
        for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
            const newPart = newParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (newPart > currentPart) return true;
            if (newPart < currentPart) return false;
        }
        
        return false;
    }

    // Manual check for updates (for debugging)
    async manualCheck() {
        console.log('Manual update check triggered');
        await this.checkForUpdates();
    }

    // Get current status
    getStatus() {
        return {
            currentVersion: this.currentVersion,
            lastCheck: this.lastCheck,
            dismissedVersion: this.dismissedVersion,
            initialized: this.initialized
        };
    }

    // Reset dismissed updates (for debugging)
    resetDismissed() {
        localStorage.removeItem('dismissedVersion');
        console.log('Dismissed updates reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimpleUpdater };
} else {
    window.SimpleUpdater = SimpleUpdater;
}