# Directory Rename: TheOneApp → TheOneApp_mobile

## Overview

The mobile app directory has been renamed from `TheOneApp` to `TheOneApp_mobile` to provide clearer differentiation between the web app (parent directory) and the mobile app. This document outlines the changes made to support this renaming.

## Changes Made

1. **Directory Renamed**
   - `G:\TheOneApp\theoneapp\TheOneApp` → `G:\TheOneApp\theoneapp\TheOneApp_mobile`

2. **Updated Sync Scripts**
   - `sync-data.mjs`: Updated destination paths to point to the new directory name
   - `sync-book-data.mjs`: Updated destination paths to point to the new directory name

3. **Updated Cleanup Script**
   - `TheOneApp_mobile/cleanup.js`: Removed reference to the old directory name in the directories to delete list

## Benefits

1. **Clear Differentiation**
   - Makes it immediately obvious which directory contains the mobile app code
   - Eliminates confusion between the parent web app and the mobile app

2. **Better Organization**
   - Creates a more logical project structure
   - Improves code navigation and maintenance

3. **Reduced Confusion**
   - Eliminates the confusing nested structure of "TheOneApp/TheOneApp"

## No Impact On

The following aspects of the project were not affected by this change:

1. **Build Process**
   - The Expo configuration doesn't depend on the directory name
   - The webpack configuration doesn't reference the directory name

2. **Start Scripts**
   - `start-with-sync.mjs` and `start-android.mjs` use relative paths and don't reference the directory name directly

3. **Import Statements**
   - No code imports reference the directory name directly

## Testing

To verify the changes:

1. Run the sync scripts to ensure they correctly copy data to the new directory:
   ```
   node sync-data.mjs
   node sync-book-data.mjs
   ```

2. Start the mobile app to ensure it runs correctly:
   ```
   cd TheOneApp_mobile
   npm run start-with-sync
   ```

3. Verify that the app builds and runs without any errors related to the directory rename.
