class GoogleSheetsAnalytics {
    constructor() {
        // Replace SHEET_ID_HERE with your actual Google Sheets ID
        this.sheetId = '1QfkxE4b3WWw0bGLpjISkX0AGX4bSW2PyMoWrsufZRKc'; // Get this from your sheet URL
        this.sheetUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit`;
        this.userId = this.getUserId();
    }

    getUserId() {
        // Try to get existing user ID from localStorage
        let userId = localStorage.getItem('cardpack_user_id');
        if (!userId) {
            // Generate new anonymous ID
            userId = 'user_' + Math.random().toString(36).substr(2, 12) + Date.now().toString(36);
            localStorage.setItem('cardpack_user_id', userId);
        }
        return userId;
    }

    async trackUser(netWorth, title = null) {
        try {
            const data = {
                user_id: this.userId,
                net_worth: netWorth,
                title: title || 'None',
                timestamp: new Date().toISOString()
            };

            console.log('Tracking analytics:', data);

            // Use Google Apps Script Web App to append to sheet
            const scriptUrl = 'https://script.google.com/macros/s/AKfycbyQln9KT3aUUnRdsxerho71upyiM6ZeZJQEONi3Chg9eCB60dJXvAys6NOGQjFhw6qhxw/exec';
            
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            console.log('Analytics sent to Google Sheets');
        } catch (error) {
            // Fail silently - don't disrupt gameplay
            console.debug('Analytics tracking failed:', error);
        }
    }
}

// Helper functions to get current game state
function getCurrentNetWorth() {
    return window.gameEngine ? window.gameEngine.state.netWorth : 0;
}

function getCurrentTitle() {
    return window.gameEngine ? window.gameEngine.state.currentTitle : 'Rookie Trader';
}

// Global analytics instance
const analytics = new GoogleSheetsAnalytics();