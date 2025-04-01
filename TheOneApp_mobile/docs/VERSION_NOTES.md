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
