# TCG Pack Simulator

A Trading Card Game Pack Opening Simulator built with Electron.

## Features

- Multiple TCG sets to choose from
- Interactive pack opening with tear animation
- Collection tracking and progress
- Foil card effects
- Local storage for persistence

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

```bash
npm start
```

For development with DevTools:
```bash
npm run dev
```

### Building Executables

Build for current platform:
```bash
npm run build
```

Build for specific platforms:
```bash
npm run build-win    # Windows
npm run build-mac    # macOS  
npm run build-linux  # Linux
```

The built executables will be in the `dist/` folder.

## Project Structure

```
CardpackSim/
├── assets/          # Icons and images
├── src/             # Source files
│   ├── js/          # JavaScript modules
│   └── css/         # Stylesheets
├── main.js          # Electron main process
├── preload.js       # Preload script
├── index.html       # Main HTML file
└── package.json     # Project configuration
```

## License

MIT