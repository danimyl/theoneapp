# TheOneApp Android Build Instructions

This document provides step-by-step instructions for building the Android version of TheOneApp.

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Expo CLI
- EAS CLI
- An Expo account

## Build Process

### 1. Install Dependencies

First, install all the required dependencies:

```bash
# Navigate to the project directory
cd TheOneApp_mobile

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps
```

### 2. Check for Issues

Run the Expo Doctor to check for any issues:

```bash
npx expo doctor
```

If there are any issues, fix them before proceeding.

### 3. Build the Android App

There are two ways to build the Android app:

#### Option 1: Using the build-android.bat Script

Simply run the build script:

```bash
./build-android.bat
```

This will:
- Check if you're in the correct directory
- Verify npx is available
- Check if you're logged in to EAS
- Start the build process

#### Option 2: Manual Build

Run the EAS build command directly:

```bash
npx eas build --platform android --profile production --non-interactive --no-wait
```

### 4. Monitor the Build

After starting the build, you can monitor its progress on the Expo website:

1. Go to [https://expo.dev](https://expo.dev)
2. Sign in to your account
3. Navigate to your project
4. Check the "Builds" tab

### 5. Download the APK

Once the build is complete, you can download the APK from the Expo website or use the following command:

```bash
npx eas build:list
```

This will show a list of your builds. You can then download the latest build using:

```bash
npx eas build:download --platform android
```

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**
   - Use the `--legacy-peer-deps` flag when installing dependencies
   - Run `npx expo doctor --fix-dependencies` to fix dependency issues

2. **Metro Bundler Issues**
   - Clear the Metro bundler cache:
     ```bash
     rm -rf node_modules/.cache
     ```

3. **Build Failures**
   - Check the build logs on the Expo website
   - Ensure all dependencies are correctly installed
   - Verify that the app.json and eas.json files are correctly configured
