# TheOneApp

A cross-platform application for daily spiritual practice and personal development.

## Project Structure

- **Web App**: React + Vite application with step tracking, practice timers, and book content
- **Mobile App**: React Native implementation with feature parity to the web version
- **Shared Data**: JSON-based content for steps, practices, and book materials

## Key Features

- Daily step progression with practice timers
- Book content with navigation and search
- Hourly reminders and notifications
- Settings customization
- Cross-platform synchronization

## Development

The project is structured to maintain the mobile app downstream from the web app, ensuring feature parity while optimizing for each platform's capabilities.

```
npm run dev        # Start web development server
cd TheOneApp_mobile && npm start  # Start mobile development server
