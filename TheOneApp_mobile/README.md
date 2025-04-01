# TheOneApp - Mobile Application

This README provides an overview of TheOneApp mobile application, its features, and implementation details.

## Features

### 1. Daily Steps
- Daily step advancement at 3:00 AM
- Step practice timer with start, pause, and stop controls
- Practice completion tracking
- Hourly notification reminders

### 2. Book Content
- Book chapter navigation and reading
- Custom HTML rendering for content display
- Text size adjustment controls
- Audio playback for chapters with audio content

## Implementation Details

### Step Advancement

The app automatically advances to the next step each day at 3:00 AM. Key implementation details:

- Uses epoch timestamps for reliable date handling
- Calculates days difference between last check and current date
- Advances multiple steps if the app wasn't opened for several days
- Shows notification when step advances

For more details, see [STEP_ADVANCEMENT_FIX.md](./STEP_ADVANCEMENT_FIX.md).

### Content Loading

Book content is loaded using a static import approach:

- All content files are statically imported to avoid Metro bundler limitations
- A lookup object maps chapter IDs to their content
- Fallback mechanism uses FileSystem for any missing content
- Content caching improves performance

### Custom HTML Renderer

The app uses a custom HTML renderer for book content:

- Built with native React Native components
- Supports text formatting, links, and other HTML elements
- Optimized for performance and reliability
- Replaced problematic third-party RenderHtml library

### Audio Player

For chapters with audio content, the app provides audio playback:

- Uses Expo AV for audio handling
- Integrated in the book content screen
- Supports play/pause functionality
- Updates audio state in the BookStore

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

To run the app with data synchronization:

```bash
npm run start-with-sync
```

To run specifically for Android:

```bash
npm run start-android
```

### Building for Production

To create a production build:

```bash
eas build --platform android
```

## Project Structure

- `src/components/`: React components
- `src/services/`: Service modules for data handling
- `src/store/`: State management using Zustand
- `src/hooks/`: Custom React hooks
- `src/data/`: Data files and content

## Dependencies

- React Native
- Expo
- Zustand for state management
- Expo AV for audio playback
- React Navigation for navigation
- AsyncStorage for local storage
