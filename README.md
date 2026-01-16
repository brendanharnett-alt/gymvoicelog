# Gym Voice Log

A voice-first gym workout logging mobile app built with React Native and Expo.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the App

### Using Expo Go (Recommended for Development)

1. **Start the development server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

2. **On your mobile device:**
   - **iOS**: Open the Camera app and scan the QR code that appears in your terminal
   - **Android**: Open the Expo Go app and scan the QR code, or press `a` in the terminal

3. **Alternative options:**
   - Press `i` in the terminal to open iOS Simulator (requires Xcode on macOS)
   - Press `a` in the terminal to open Android Emulator (requires Android Studio setup)

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo Go app installed on your iOS/Android device
  - iOS: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Project Structure

```
gymvoicelog/
├── App.tsx          # Main app component
├── app.json         # Expo configuration
├── package.json     # Dependencies
├── tsconfig.json    # TypeScript configuration
└── babel.config.js  # Babel configuration
```

## Features (Current)

- ✅ Dark theme UI
- ✅ Large circular microphone button (centered at bottom)
- ✅ Scrollable list area for workout logs (empty for now)

## Future Features

- Audio recording functionality
- Voice-to-text transcription
- Workout log entries
- Exercise recognition
