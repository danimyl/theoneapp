# iOS Sound Setup for Timer Notifications

To enable the timer completion sound on iOS, you need to add the sound file to the Xcode project:

1. Open the Xcode project:
   ```bash
   cd TheOneApp_mobile/ios
   open TheOneApp.xcworkspace
   ```

2. In Xcode:
   - Drag `bell.mp3` from `TheOneApp_mobile/assets/` into the Xcode project navigator
   - When prompted, make sure to:
     - Check "Copy items if needed"
     - Select your target in "Add to targets"
     - Choose "Create folder references"
   - Click "Finish"

3. Verify the sound file is included in the build:
   - Select your target in Xcode
   - Go to "Build Phases"
   - Expand "Copy Bundle Resources"
   - Ensure `bell.mp3` is listed

4. Clean and rebuild the project:
   ```bash
   cd TheOneApp_mobile
   npm run ios
   ```

## Important Notes

- The sound file must be in a format supported by iOS (MP3, WAV, or CAF)
- The filename in the Notifee configuration (`bell.mp3`) must match the actual filename
- For critical alerts to work, the app must request and be granted critical alert permissions
- The sound duration should be less than 30 seconds (Apple requirement)
