# BEDOU

A personal finance management app built with React Native and Expo.

## Features

- 📊 Dashboard for financial overview
- 💰 Transaction management
- 🏷️ Category management with customizable icons and colors
- 💱 Multi-currency support
- 🌓 Dark mode support
- 📱 Responsive design for phones and tablets

## Tech Stack

- [Expo](https://expo.dev)
- [React Native](https://reactnative.dev)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [SQLite](https://www.sqlite.org)
- [NativeWind](https://www.nativewind.dev)
- [TypeScript](https://www.typescriptlang.org)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npx expo start
```

Run the app on:

- iOS Simulator: Press `i`
- Android Emulator: Press `a`
- Physical device: Scan the QR code with Expo Go

## Project Structure

```
app/              # Expo Router pages
src/
  features/       # Feature modules (categories, currency, budgets)
  state/          # Context providers
  db/             # Database utilities
  components/     # Reusable components
  utils/          # Utility functions
```

## License

MIT License - see [LICENSE](LICENSE) for details.
