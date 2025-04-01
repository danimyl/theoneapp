# TheOneApp: Web Application Status Report

This document provides a comprehensive overview of the current state of TheOneApp web application to inform planning for a stable React Native migration with Expo.

## Application Overview

TheOneApp is a React-based web application that helps users follow daily steps/practices with features for tracking progress, setting reminders, and accessing reference content. The app has a clean, Spotify-inspired UI with dark/light theme support.

## Technical Specifications

### Core Framework & Build System

- **Framework**: React 18.3.0
- **Build Tool**: Vite 6.2.0
- **Module System**: ES Modules (type: "module")
- **Language**: JavaScript (JSX) with TypeScript support

### Key Dependencies

#### React Ecosystem
- react: 18.3.0
- react-dom: 19.0.0
- react-router-dom: 7.3.0

#### UI Components & Styling
- @mui/material: 6.4.8
- @mui/icons-material: 6.4.8
- @emotion/react: 11.14.0
- @emotion/styled: 11.14.0
- react-icons: 5.5.0
- tailwindcss: 3.4.13

#### State Management
- zustand: 5.0.3 (with persist middleware for local storage)

#### Development Tools
- eslint: 9.21.0
- typescript: 5.3.3
- postcss: 8.5.3
- autoprefixer: 10.4.21

#### React Native Dependencies (Already Added)
- react-native: 0.73.2
- @expo/vector-icons: 14.0.4
- @react-native-async-storage/async-storage: 2.1.2
- @react-navigation/bottom-tabs: 7.3.2
- @react-navigation/native: 7.0.18
- expo-av: 15.0.2
- expo-document-picker: 13.0.3
- expo-file-system: 18.0.12
- expo-notifications: 0.29.14
- expo-sharing: 13.0.1
- react-native-render-html: 6.3.4
- react-native-safe-area-context: 5.3.0
- react-native-screens: 4.9.2
- react-native-vector-icons: 10.2.0

## Application Architecture

### Project Structure
```
theoneapp/
├── public/                  # Static assets
├── src/
│   ├── assets/              # Application assets
│   ├── components/          # React components
│   │   ├── BookDisplay.jsx  # Book content display
│   │   ├── BookMenu.jsx     # Book navigation menu
│   │   ├── SecretModal.jsx  # Modal for daily secrets
│   │   ├── SettingsMenu.jsx # Settings configuration
│   │   └── StepDisplay.jsx  # Step/practice display
│   ├── data/                # Application data
│   │   ├── book/            # Book content (JSON)
│   │   ├── practice-reminders.json
│   │   ├── secrets.json
│   │   └── steps.json       # Steps/practices data
│   ├── hooks/               # Custom React hooks
│   │   └── useTimer.js      # Timer functionality
│   ├── services/            # Service layer
│   │   ├── bookService.js   # Book content management
│   │   ├── notificationService.js # Browser notifications
│   │   └── stepService.js   # Step data management
│   ├── store/               # State management
│   │   ├── bookStore.js     # Book-related state
│   │   └── settingsStore.js # App settings state
│   ├── App.css              # App-specific styles
│   ├── App.jsx              # Main application component
│   ├── index.css            # Global styles (Tailwind)
│   ├── light-theme.css      # Light theme styles
│   ├── main.jsx             # Application entry point
│   ├── service-worker.js    # PWA service worker
│   └── spotify-theme.css    # Spotify-inspired theme
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.js           # Vite build configuration
```

### Key Components

1. **App.jsx**: Main application component that manages:
   - Navigation between steps and book views
   - Timer functionality for practices
   - Settings and theme management
   - Notification scheduling

2. **StepDisplay.jsx**: Displays step instructions and practices with:
   - Timer controls for timed practices
   - Completion tracking
   - Progress indicators

3. **BookDisplay.jsx & BookMenu.jsx**: Provides access to reference content with:
   - Navigation through book sections
   - Content display
   - Search functionality

4. **SettingsMenu.jsx**: Manages user preferences:
   - Theme selection (dark/light)
   - Notification settings
   - Sleep hours configuration

### State Management

The application uses Zustand for state management with two main stores:

1. **settingsStore.js**:
   - User preferences (theme, notifications)
   - Current step tracking
   - Practice completion state
   - Persistence via localStorage

2. **bookStore.js**:
   - Book navigation state
   - Current section tracking
   - Menu open/closed state

### Service Layer

1. **stepService.js**:
   - Manages step data with lazy loading
   - Caches loaded steps for performance
   - Provides step navigation utilities

2. **notificationService.js**:
   - Browser notification management
   - Permission handling
   - Sleep hours respect
   - Sound alerts

3. **bookService.js**:
   - Book content management
   - Navigation utilities
   - Content search

### Styling Approach

The application uses a hybrid styling approach:

1. **Tailwind CSS**: For utility-based styling and responsive design
2. **CSS Variables**: For theming (Spotify-inspired dark/light themes)
3. **Component-specific CSS**: For complex component styling

## Key Features

1. **Daily Steps/Practices**:
   - Step navigation and selection
   - Practice timers with completion tracking
   - Daily step advancement (automatic at 3:00 AM)

2. **Notifications**:
   - Hourly reminders for current step
   - Practice reminders at random times
   - Respects user-defined quiet hours

3. **Book Reference**:
   - Searchable content library
   - Navigation between sections
   - Related content suggestions

4. **User Preferences**:
   - Dark/light theme toggle
   - Notification settings
   - Sleep hours configuration

5. **Daily Secrets**:
   - Random inspirational content shown daily
   - Modal display on first app open

## Data Structure

1. **steps.json**: Contains step data with:
   - Step ID, title, and instructions
   - Practice details and durations
   - Hourly reminder flags

2. **book/content/**: JSON files for book content:
   - Section text and metadata
   - Navigation structure
   - Related content links

3. **secrets.json**: Collection of inspirational messages

## Technical Considerations for Migration

### Version Compatibility Issues

Previous migration attempts encountered dependency conflicts, particularly:
- React version mismatches (React Native requires specific React versions)
- TypeScript type definition incompatibilities
- Component library compatibility issues

### Critical Components to Migrate

1. **State Management**: Zustand works well in React Native; minimal changes needed
2. **Timer Functionality**: Needs adaptation for background operation on mobile
3. **Notifications**: Requires complete rewrite using Expo Notifications
4. **Navigation**: Must be rebuilt using React Navigation
5. **Styling**: Tailwind approach needs replacement with React Native styling

### Data Handling

1. **Local Storage**: Replace with AsyncStorage
2. **JSON Data**: Can be directly imported in React Native
3. **Service Layer**: Mostly reusable with minor adaptations

## Data Synchronization Approach

To maintain a clear separation of concerns while ensuring data consistency between the web and mobile apps, we've implemented a robust data synchronization strategy:

### Architecture

The data synchronization follows a one-way flow:
```
Web App (Source of Truth) → Sync Script → Mobile App (Consumer)
```

This ensures the web app remains the single source of truth for all data, while the mobile app has access to the same data without duplicating logic.

### Implementation

1. **Synchronization Script** (`sync-data.mjs`):
   - Uses file hashing to detect changes
   - Creates backups before overwriting
   - Maintains version history in `data-versions.json`
   - Logs all activities to `data-sync.log`

2. **TypeScript Integration**:
   - Type declaration files (`.d.ts`) for JSON data
   - Ensures type safety when accessing data in the mobile app

3. **Service Layer**:
   - TypeScript versions of web app services
   - Maintains the same API for consistent usage
   - Optimized for mobile performance (lazy loading, caching)

4. **Build Integration**:
   - Automatic synchronization before builds via npm scripts
   - Manual synchronization option for development

### Benefits

- **Clear Source of Truth**: The web app remains the authoritative source for all data
- **Type Safety**: TypeScript declarations ensure proper data usage
- **Performance**: Lazy loading and caching optimize mobile performance
- **Consistency**: Same data structure and access patterns across platforms
- **Maintainability**: Changes to data structure only need to be made in one place

Detailed documentation on the data synchronization process is available in `TheOneApp/DATA_SYNC_DOCUMENTATION.md`.

## Recommendations for Stable Migration

1. **Environment Setup**:
   - Use Expo SDK 52.0.40 (latest stable)
   - React 18.2.0 (for compatibility with React Native 0.73.2)
   - TypeScript 5.3.3 (current version)

2. **Migration Strategy**:
   - Start with a clean Expo project
   - Migrate core functionality first (step display, navigation)
   - Add features incrementally (notifications, book content)
   - Implement styling last for consistent UI

3. **Component Migration Priority**:
   1. Core navigation structure
   2. Step display and timer
   3. Settings and preferences
   4. Book content display
   5. Notification system

4. **Testing Strategy**:
   - Test each component in isolation
   - Verify state management across components
   - Ensure notifications work in background
   - Test on both iOS and Android

## Version Deviations

During the migration process, we encountered some compatibility issues that required deviating from the exact versions specified in the migration instructions. These deviations are documented in detail in the `VERSION_DEVIATIONS.md` file, but are summarized here:

### expo-updates

- **Original Version (from migration instructions):** 0.24.0
- **Current Version:** 0.27.4
- **Reason for Change:** The original version had compatibility issues with the CLI component, causing errors when attempting to run the app.
- **Impact:** This change should not affect the core functionality of the app, as expo-updates is primarily used for over-the-air updates in production, not for core app functionality.

This report provides a comprehensive overview of TheOneApp's current state to inform planning for a stable React Native migration with Expo.
