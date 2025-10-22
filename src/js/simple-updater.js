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
        return '1.5.4';
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
                        <button onclick="window.updaterInstance.downloadAndInstall('${release.tag_name}', '${this.getDownloadUrl(release)}')" 
                                style="
                                    color: white; 
                                    text-decoration: none; 
                                    background: rgba(255,255,255,0.2); 
                                    padding: 6px 12px; 
                                    border-radius: 4px; 
                                    font-weight: 500;
                                    transition: background 0.2s;
                                    border: 1px solid rgba(255,255,255,0.3);
                                    cursor: pointer;
                                "
                                onmouseover="this.style.background='rgba(255,255,255,0.3)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            📥 Download
                        </button>
                        <a href="${release.html_url}" target="_blank" rel="noopener noreferrer" 
                           style="
                               color: white; 
                               text-decoration: none; 
                               background: rgba(255,255,255,0.1); 
                               padding: 6px 12px; 
                               border-radius: 4px; 
                               font-weight: 500;
                               border: 1px solid rgba(255,255,255,0.3);
                           "
                           onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                           onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                            🌐 Manual Download
                        </a>
                        <button onclick="window.updaterInstance.dismissUpdate('${release.tag_name}')" 
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
                <div id="download-progress" style="display: none; margin-top: 10px;">
                    <div style="background: rgba(255,255,255,0.2); border-radius: 10px; height: 20px; overflow: hidden;">
                        <div id="progress-bar" style="background: #4CAF50; height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <div id="progress-text" style="margin-top: 5px; font-size: 14px;">Ready to download...</div>
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

        // Store reference to this updater instance for callbacks
        window.updaterInstance = this;

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

    // Download and install update
    async downloadAndInstall(version, downloadUrl) {
        console.log(`Starting download for version ${version}`);
        
        if (!window.electronAPI || !window.electronAPI.downloadUpdate) {
            // Fallback to manual download if Electron API is not available
            console.log('Electron API not available, opening manual download');
            window.open(downloadUrl, '_blank');
            return;
        }

        const progressDiv = document.getElementById('download-progress');
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (!progressDiv || !progressBar || !progressText) {
            console.error('Progress elements not found');
            return;
        }

        progressDiv.style.display = 'block';
        progressText.textContent = 'Starting download...';
        progressBar.style.width = '0%';

        try {
            // Listen for progress updates
            const handleProgress = (progress) => {
                progressBar.style.width = progress + '%';
                progressText.textContent = `Downloading... ${progress}%`;
            };

            // Set up progress listener
            if (window.electronAPI.onDownloadProgress) {
                window.electronAPI.onDownloadProgress(handleProgress);
            }

            // Start the download
            const downloadPath = await window.electronAPI.downloadUpdate(downloadUrl);
            
            progressBar.style.width = '100%';
            progressText.textContent = 'Download complete! Click to install and restart.';
            
            // Change the download button to install button
            const downloadBtn = document.querySelector('button[onclick*="downloadAndInstall"]');
            if (downloadBtn) {
                downloadBtn.textContent = '🔄 Install & Restart';
                downloadBtn.onclick = () => this.installAndRestart(downloadPath);
            }

        } catch (error) {
            console.error('Download failed:', error);
            progressText.textContent = 'Download failed. Please try manual download.';
            progressText.style.color = '#ff6b6b';
            
            // Revert to manual download after 3 seconds
            setTimeout(() => {
                window.open(downloadUrl, '_blank');
            }, 3000);
        }
    }

    // Install and restart application
    async installAndRestart(downloadPath) {
        if (!window.electronAPI || !window.electronAPI.installAndRestart) {
            console.log('Install API not available, please install manually');
            return;
        }

        try {
            await window.electronAPI.installAndRestart(downloadPath);
        } catch (error) {
            console.error('Installation failed:', error);
        }
    }

    // Dismiss update notification
    dismissUpdate(version) {
        localStorage.setItem('dismissedVersion', version);
        const banner = document.querySelector('.update-banner');
        if (banner) {
            banner.remove();
        }
        console.log(`Update ${version} dismissed`);
    }

    // Get download URL for current platform
    getDownloadUrl(release) {
        const assets = release.assets || [];
        
        // If running in Electron, try to detect platform
        let platform = 'win32'; // Default to Windows
        if (window.electronAPI && window.electronAPI.getPlatform) {
            platform = window.electronAPI.getPlatform();
        } else if (typeof process !== 'undefined' && process.platform) {
            platform = process.platform;
        }
        
        // Look for platform-specific executables
        const patterns = {
            'win32': /\.exe$/i,
            'darwin': /\.dmg$/i,
            'linux': /\.AppImage$|\.deb$|\.rpm$/i
        };
        
        const pattern = patterns[platform] || patterns['win32'];
        const asset = assets.find(asset => pattern.test(asset.name));
        
        return asset ? asset.browser_download_url : release.html_url;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimpleUpdater };
} else {
    window.SimpleUpdater = SimpleUpdater;
}