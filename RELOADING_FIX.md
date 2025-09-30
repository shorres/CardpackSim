# Fix for Constant UI Reloading Issue

## Problem Identified
The application was constantly reloading due to several issues in the weekly set countdown system:

1. **Incorrect Date Calculations**: The `getWeeklySetDates()` method was using a flawed week calculation based on year start
2. **Aggressive Auto-Reload**: The countdown timer was automatically reloading the page when time <= 0
3. **High Update Frequency**: Countdown was updating every second, potentially causing performance issues
4. **Multiple Timer Intervals**: No cleanup of previous intervals when creating new ones

## Fixes Applied

### 1. Fixed Week Date Calculations
**File**: `src/js/data.js`
- **Before**: Used complex year-based calculation that could produce incorrect dates
- **After**: Uses proper Monday-to-Monday week boundaries based on current date
- **Result**: Accurate week start/end times that prevent negative countdown values

### 2. Removed Aggressive Auto-Reload
**File**: `src/js/ui.js`
- **Before**: Automatically called `window.location.reload()` when countdown reached 0
- **After**: Shows "New set available! Refresh to see it." message instead
- **Result**: No more automatic page refreshes that disrupt user experience

### 3. Reduced Update Frequency
**File**: `src/js/ui.js`
- **Before**: Updated countdown every 1 second
- **After**: Updates every 5 seconds
- **Result**: Better performance and less aggressive UI updates

### 4. Added Interval Management
**File**: `src/js/ui.js`
- **Before**: Created new intervals without cleaning up old ones
- **After**: Properly manages countdown intervals with cleanup
- **Result**: Prevents memory leaks and multiple running timers

### 5. Enhanced Safety Checks
**File**: `src/js/ui.js`
- Added validation for reasonable time values (< 8 days)
- Handle multiple countdown elements safely
- Show "Calculating..." for invalid time ranges
- Added debugging information for development

### 6. Added Cleanup Method
**File**: `src/js/ui.js`
- Added `destroy()` method to clean up intervals
- Prevents memory leaks when UI is recreated

## Technical Details

### New Week Calculation Logic
```javascript
// Get start of current week (Monday)
const dayOfWeek = now.getDay();
const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

const startOfWeek = new Date(now);
startOfWeek.setDate(now.getDate() - daysFromMonday);
startOfWeek.setHours(0, 0, 0, 0);

const endOfWeek = new Date(startOfWeek);
endOfWeek.setDate(startOfWeek.getDate() + 7);
```

### Safe Countdown Display
```javascript
if (timeUntilNext <= 0) {
    element.textContent = 'New set available! Refresh to see it.';
    return; // No auto-reload
}
```

### Interval Management
```javascript
if (this.countdownInterval) {
    clearInterval(this.countdownInterval);
}
this.countdownInterval = setInterval(/* ... */, 5000);
```

## Result
- ✅ No more constant page reloading
- ✅ Accurate weekly set timing
- ✅ Better performance with less frequent updates
- ✅ Proper memory management
- ✅ User-friendly "refresh needed" notification instead of forced reload
- ✅ Debug logging for troubleshooting (in development only)

The application should now run smoothly without the constant reloading issue while maintaining all weekly set functionality.