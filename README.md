# TCG Pack Simulator

A TCG pack opening simulator with a dynamic market simulation. Experience the seratonin hit of opening packs while managing your collection as a trading portfolio. All without spending a cent.

## What It Does

**CardpackSim** simulates half of the TCG experience from pack opening to market trading:

- 💰 **Dynamic Market System** - Buy packs with fake money and sell cards at fluctuating market prices  
- 📈 **Economic Strategy** - Min/Max to make sure you get your money's worth out of that box
- 🗓️ **Weekly Sets** - New sets are generated each week to keep things kind of fresh
- 📊 **Collection Tracking** - Admire your fake digital cardboard
- 🏆 **Achievement System** - Earn titles

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Running
```bash
# Install dependencies
npm install

# Run the application
npm start

# Development mode with DevTools
npm run dev
```

### Building Executables
```bash
npm run build          # Current platform
npm run build-win      # Windows
npm run build-mac      # macOS  
npm run build-linux    # Linux
```
Built executables will be in the `dist/` folder.

## Technology Stack

**Built with Electron** - Cross-platform desktop application
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with local storage persistence
- **Architecture**: Modular design with separated game logic, UI, and market systems

## License

MIT