# Version Notes

This document tracks important changes to dependencies and configurations that affect the application's behavior.

## Web Bundling Support (Added 2025-03-28)

### Issue
The application was encountering web bundling errors when running with Expo Go:
```
Web Bundling failed 1998ms index.ts (42 modules)
Unable to resolve "react-native-web/dist/exports/View" from "App.tsx"
```

### Solution
Added the following dependencies with `--legacy-peer-deps` flag to resolve conflicts:
- react-native-web@0.18.12
- @expo/webpack-config

### Dependency Conflicts
There was a conflict between:
- Existing React 18.2.0
- react-dom 18.3.1 (required by react-native-web) which needs React ^18.3.1

The `--legacy-peer-deps` flag was used to bypass this conflict for development purposes.

### Configuration Changes
- Added webpack.config.js to properly configure web bundling

### Future Considerations
For production builds, consider:
1. Upgrading React to 18.3.1 to resolve the peer dependency conflict properly
2. Testing thoroughly on all platforms after dependency changes
3. If web support is not needed, consider using platform-specific flags like `--no-web` when starting the Expo server

## iOS Timer Persistence Fix (Added 2025-04-02)

### Issue
On iOS devices, the timer persistence across step changes was not working correctly. The timer state was being cleared prematurely when navigating between steps, causing the timer to be lost.

### Solution
Implemented a platform-specific fix that:
1. Tracks timer start time on iOS devices
2. Adds a minimum runtime check (1 second) before clearing timer state on iOS
3. Preserves the original behavior on Android devices
4. Adds enhanced logging for debugging iOS-specific issues

### Implementation Details
- Added platform detection using `Platform.OS` to apply iOS-specific logic
- Added a timer start time tracking reference
- Modified the timer clearing effect to have different behavior on iOS vs. Android
- Added safeguards to prevent premature timer clearing on iOS

See the full documentation in [IOS_TIMER_PERSISTENCE_FIX.md](./IOS_TIMER_PERSISTENCE_FIX.md)

### Testing
The fix has been tested on both iOS and Android devices to ensure:
1. Timer persistence works correctly on iOS when navigating between steps
2. The existing Android functionality remains unchanged
3. Paused timers are properly preserved on both platforms

## iOS Build Support (Added 2025-04-02)

### Changes
Added support for building iOS apps using Expo Cloud Build:

1. Updated app.json with iOS bundle identifier:
   ```json
   "ios": {
     "supportsTablet": true,
     "bundleIdentifier": "com.beginningstudents.theoneapp"
   }
   ```

2. Updated eas.json with iOS-specific build configurations:
   - Development profile for simulator builds
   - Preview profile for internal testing
   - Production profile for App Store submission

3. Added build scripts:
   - init-ios.bat: Sets up the iOS build environment
   - build-ios.bat: Triggers iOS builds on Expo Cloud

### Implementation Details
- Configured iOS build profiles in eas.json
- Added placeholder fields for Apple Developer account credentials
- Created interactive build script with profile selection
- Added comprehensive documentation in IOS_BUILD_INSTRUCTIONS.md

### Requirements
Building for iOS requires:
- An Apple Developer account
- Apple Developer Program membership (for App Store distribution)
- Proper configuration of certificates and provisioning profiles

See the full documentation in [IOS_BUILD_INSTRUCTIONS.md](../../IOS_BUILD_INSTRUCTIONS.md)

## Version 1.1.1 Updates (Added 2025-04-02)

### Book Navigation Improvements
1. **Removed "Book" Header**: 
   - Removed the redundant "Book" header from the top of the Book screen
   - Made the chapter title the topmost element on the page
   - Improved screen space utilization
   - See details in [BOOK_HEADER_REMOVAL.md](./BOOK_HEADER_REMOVAL.md)

2. **Added Chapter Search Functionality**:
   - Replaced the static "Book Navigation" header with a search input field
   - Implemented real-time filtering of chapters based on search query
   - Added text highlighting for search matches
   - Auto-expands volumes and books containing matching chapters
   - See details in [BOOK_SEARCH_IMPLEMENTATION.md](./BOOK_SEARCH_IMPLEMENTATION.md)

### Bug Fixes
1. **Fixed Search Function Crash**:
   - Fixed a bug where the app would crash when typing in the search field
   - Root cause: `cleanTitle` function was being used before it was defined
   - Solution: Moved function definition and added null/undefined checks
   - Added proper TypeScript return type to the function

### Version Changes
- Updated version from 1.1.0 to 1.1.1
- Incremented iOS build number from 1 to 2
