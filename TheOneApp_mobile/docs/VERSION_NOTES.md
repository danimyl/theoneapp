# Version Notes

This document tracks significant changes and updates to the mobile app.

## Version 1.1.5 (2025-04-03)

### UI Improvements
- Improved theming consistency across the app
- Updated interactive elements to use buttonAccent color
- Fixed "Today's Step" text visibility with proper accent color
- Enhanced visual hierarchy in navigation and controls

## Version 1.1.4 (2025-04-03)

### Timer Improvements
- Fixed timer completion sound not playing when device is locked
- Added high-priority notification channel for timer sounds
- Implemented dual sound playback strategy for reliable audio feedback

## Version 1.1.3 (2025-04-02)

### UI Cleanup
- Removed notification tester from settings screen
- Cleaned up settings screen imports and dependencies

## Version 1.1.2 (2025-04-02)

### Notification System Improvements
- Enhanced hourly notification precision with exact timing at xx:00
- Added dedicated high-priority notification channel for hourly reminders
- Improved notification reliability in background mode
- Optimized sound handling for notifications
- Added alarm clock priority for critical notifications on Android

## Version 1.0.5 (2025-04-02)

### Audio Player Improvements
- Fixed issue where the slider would ignore drags and revert to its starting position
- Improved initial drag value handling to always use the last known position
- Enhanced seek operation reliability with synchronous updates
- Added a small delay before resetting the dragging state to ensure proper UI updates
- Optimized slider value precision by rounding to 3 decimal places
- Added comprehensive documentation in AUDIO_PLAYER_TRANSPORT_SLIDER.md

### Bug Fixes
- Fixed slider position reversion issue
- Improved slider reliability and responsiveness
- Enhanced audio position synchronization

## Version 1.0.4 (2025-03-30)

### Book Feature Enhancements
- Added audio content support for book chapters
- Implemented audio player with play/pause controls
- Added transport slider for seeking through audio content
- Split audio state into separate store to prevent cascading re-renders

### UI Improvements
- Increased slider length for better control
- Fixed flashing during dragging
- Implemented memoization for better performance
- Added hourly notification indicator

## Version 1.0.3 (2025-03-15)

### Timer Persistence
- Added timer persistence across app restarts
- Fixed iOS timer persistence issues
- Improved timer reliability on background/foreground transitions

### Book Navigation
- Fixed navigation tree rendering
- Added search functionality to book content
- Improved header handling in book content

## Version 1.0.2 (2025-03-01)

### Practice Reminders
- Added practice reminder notifications
- Implemented quiet hours settings
- Added hourly notification system

### Step Advancement
- Fixed step advancement logic
- Added daily advancement check
- Improved step selector UI

## Version 1.0.1 (2025-02-15)

### Initial Mobile Release
- Migrated core functionality from web app
- Implemented step practice system
- Added book content browser
- Created settings screen
