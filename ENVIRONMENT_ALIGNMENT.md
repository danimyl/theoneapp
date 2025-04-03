# Development Environment Alignment

This document outlines the changes made to align the main project development environment with the mobile app environment.

## Changes Made

### 1. Package.json Updates

- Updated shared dependencies to match versions used in the mobile app:
  - React Native updated from 0.73.2 to 0.76.8
  - React updated from 18.3.0 to 18.3.1
  - @react-native-async-storage/async-storage updated to 1.23.1
  - @react-navigation packages updated to match mobile versions
  - All Expo packages updated to match mobile versions

- Added Metro bundler packages:
  - metro: ^0.81.0
  - metro-config: ^0.81.0
  - metro-resolver: ^0.81.0

- Added additional Expo packages used in the mobile app:
  - expo-background-fetch: ~13.0.5
  - expo-haptics: ~14.0.1
  - expo-keep-awake: ~14.0.3
  - expo-task-manager: ~12.0.5
  - expo-updates: 0.27.4
  - react-native-gesture-handler: ~2.20.2
  - react-native-reanimated: ~3.16.1

- Added testing libraries from the mobile app:
  - @testing-library/react-native: 12.4.0
  - jest: 29.7.0
  - jest-expo: 52.0.6
  - ts-node: 10.9.2

- Added Expo configuration to package.json:
  ```json
  "expo": {
    "doctor": {
      "reactNativeDirectoryCheck": {
        "listUnknownPackages": false
      }
    }
  }
  ```

- Added mobile app scripts:
  - expo: "expo start"
  - android: "expo run:android"
  - ios: "expo run:ios"
  - sync-data: "node sync-data.mjs"
  - sync-book-data: "node sync-book-data.mjs"

### 2. Configuration Files

- Added babel.config.js with the same configuration as the mobile app
- Added metro.config.js with the same configuration as the mobile app

## Next Steps

After these changes, you should:

1. Run `npm install --legacy-peer-deps` to install the updated dependencies
2. Run `npx expo doctor` to check for any remaining issues
3. Clear the Metro bundler cache if needed: `rm -rf node_modules/.cache`

## Issues Fixed

After initial setup, we encountered and fixed the following issues:

1. **Module System Compatibility**: 
   - Converted babel.config.js and metro.config.js to use ES Module syntax (import/export) instead of CommonJS (require/module.exports)
   - This aligns with the main project's ES Module setting (type: "module" in package.json)

2. **Script Conflict**:
   - Renamed the "expo" script to "expo-start" to avoid conflicts with node_modules/.bin
   - Use `npm run expo-start` instead of `npm run expo` to start the Expo development server

## Mobile Build Support

### Android Build Support

To facilitate Android builds, the following files have been added:

1. **init-android.bat**:
   - Initializes the Android build environment
   - Creates the Android project directory using Expo's prebuild command
   - Configures Gradle properties
   - Sets the application ID in build.gradle

2. **build-android.bat**:
   - Builds the Android APK
   - Cleans up previous builds
   - Runs the Gradle build process
   - Copies the resulting APK to the project root directory

3. **BUILD_INSTRUCTIONS.md**:
   - Provides detailed instructions for building the Android APK
   - Lists prerequisites and environment setup steps
   - Explains the build process
   - Includes troubleshooting tips for common issues
   - Provides instructions for testing the APK

To build an Android APK:
1. Run `init-android.bat` (one-time setup)
2. Run `build-android.bat`
3. The APK will be available at `TheOneApp.apk` in the project root directory

### iOS Build Support

To facilitate iOS builds on Expo Cloud, the following files have been added:

1. **ios-build-free-account.bat**:
   - Specialized script for building iOS apps with a free Apple Developer account
   - Guides the user through the build process step by step
   - Provides instructions for finding the device's UDID
   - Explains how to install the app via Expo Go after the build completes
   - Recommended for users with free Apple Developer accounts

2. **ios-build-simple.bat**:
   - Super simple script for building iOS apps
   - Just runs the EAS build command with the development profile
   - Includes the --legacy-peer-deps flag to handle dependency conflicts
   - Minimal error handling for maximum compatibility

3. **ios-build-with-deps.bat**:
   - Comprehensive script that fixes dependency issues before building
   - Changes to the TheOneApp_mobile directory
   - Runs npm install with --legacy-peer-deps flag
   - Falls back to --force if needed
   - Starts the iOS build with the development profile
   - Provides detailed instructions for device registration

4. **ios-build-simple.ps1**:
   - PowerShell version of the simple build script
   - Includes the --legacy-peer-deps flag to handle dependency conflicts
   - Alternative if batch scripts aren't working properly
   - Requires PowerShell execution policy to be set appropriately

5. **test-eas-cli.bat**:
   - Diagnostic script to test EAS CLI functionality
   - Checks EAS CLI version and login status
   - Useful for troubleshooting build issues

4. **build-ios-dev.bat**:
   - More feature-rich script for building iOS apps for physical devices
   - Checks for EAS CLI installation and installs if needed
   - Logs in to Expo account if not already logged in
   - Provides instructions for device registration and app installation
   - Works with free Apple Developer accounts

5. **init-ios.bat**, **build-ios.bat**, **check-ios-status.bat** (legacy scripts):
   - Original multi-step process for iOS builds
   - Provides more granular control over the build process
   - Supports all build profiles (development, preview, production)

3. **IOS_BUILD_INSTRUCTIONS.md**:
   - Provides detailed instructions for building the iOS app using Expo Cloud
   - Includes specific guidance for free Apple Developer accounts
   - Explains device registration and app installation process
   - Covers both physical device and simulator builds
   - Provides troubleshooting tips for common issues

To build an iOS app for physical devices (recommended):
1. Run `build-ios-dev.bat`
2. Follow the instructions to register your device and install the app

To use the legacy build process:
1. Run `init-ios.bat` (one-time setup)
2. Configure Apple Developer account credentials in eas.json
3. Run `build-ios.bat` and select the desired build profile
4. Follow the instructions to download and install the build

## Benefits

These changes ensure that:

1. Both environments use compatible versions of dependencies
2. Code can be shared between the web and mobile versions with minimal changes
3. Development workflows are consistent between the two environments
4. Testing can be performed with the same tools and configurations
