/**
 * TEST FILE: Type Declarations for Expo Modules
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

// Type declarations for expo-haptics
declare module 'expo-haptics' {
  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }

  export function notificationAsync(
    type: NotificationFeedbackType
  ): Promise<void>;
}

// Type declarations for expo-keep-awake
declare module 'expo-keep-awake' {
  export function activateKeepAwake(): void;
  export function deactivateKeepAwake(): void;
  
  // Aliases for backward compatibility
  export const activate: typeof activateKeepAwake;
  export const deactivate: typeof deactivateKeepAwake;
}
