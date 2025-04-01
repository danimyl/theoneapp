# TheOneApp Migration Brief for Claude

## Current Web App Overview

TheOneApp is a React-based web application for tracking daily steps/practices with timers, notifications, and reference content. It features a Spotify-inspired UI with dark/light themes.

## Technical Stack

- **React**: 18.3.0
- **Build**: Vite 6.2.0
- **State Management**: Zustand 5.0.3 with localStorage persistence
- **Styling**: Tailwind CSS 3.4.13 + CSS Variables
- **Module System**: ES Modules (type: "module")

## Key Dependencies

```json
{
  "dependencies": {
    "react": "18.3.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.3.0",
    "@mui/material": "^6.4.8",
    "@mui/icons-material": "^6.4.8",
    "react-icons": "^5.5.0",
    "zustand": "^5.0.3"
  }
}
```

## Core Functionality

1. **Step/Practice System**:
   - Daily step selection and advancement
   - Practice timers with completion tracking
   - Progress persistence

2. **Notification System**:
   - Hourly reminders for current step
   - Practice reminders at configurable times
   - Respects quiet hours

3. **Book Reference**:
   - Content navigation and display
   - JSON-based content storage

4. **Settings & Preferences**:
   - Theme selection
   - Notification configuration
   - User preferences persistence

## Architecture

- **Components**: Modular React components (StepDisplay, BookDisplay, etc.)
- **Services**: Data management layer (stepService, notificationService)
- **Stores**: Zustand stores for state (settingsStore, bookStore)
- **Hooks**: Custom React hooks (useTimer)
- **Data**: JSON files for content (steps.json, book content)

## Migration Challenges

1. **Version Compatibility**:
   - React Native 0.73.2 requires React 18.2.0 specifically
   - TypeScript type definitions need alignment

2. **UI Translation**:
   - Tailwind CSS → React Native styling
   - Component library equivalents needed

3. **Platform-Specific Features**:
   - Browser notifications → Expo Notifications
   - localStorage → AsyncStorage
   - Background timers and processes

4. **Navigation**:
   - React Router → React Navigation
   - Tab-based navigation structure

## Previous Migration Attempts

Previous attempts encountered:
- Dependency conflicts between React and React Native versions
- TypeScript type errors with component libraries
- Styling system translation challenges
- Navigation structure implementation difficulties

## Recommended Migration Path

1. **Environment**:
   - Expo SDK 52.0.40
   - React 18.2.0
   - React Native 0.73.2
   - TypeScript 5.3.3

2. **Approach**:
   - Start with clean Expo project
   - Incremental feature migration
   - Component-by-component testing
   - Maintain architecture but adapt implementation

3. **Priority Order**:
   - Core navigation structure
   - Step display and timer
   - Settings and preferences
   - Book content display
   - Notification system

## Data Structure

The app uses JSON files for content:
- steps.json: Step data with practices and durations
- book/content/*.json: Reference content
- secrets.json: Daily inspirational messages

## Key Components to Migrate

1. **App.jsx**: Main container and navigation
2. **StepDisplay.jsx**: Core functionality
3. **BookDisplay.jsx**: Reference content
4. **SettingsMenu.jsx**: User preferences
5. **Service layer**: Data management

This brief provides the essential information needed for Claude to plan a successful migration of TheOneApp to React Native with Expo.
