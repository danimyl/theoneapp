/**
 * TEST FILE: Type Declarations for Expo AV Module
 * Created: 3/26/2025
 * 
 * This is a temporary test file for validating React Native functionality.
 * TO BE REMOVED after full migration is complete.
 * DO NOT USE IN PRODUCTION.
 */

declare module 'expo-av' {
  export namespace Audio {
    export interface AudioMode {
      playsInSilentModeIOS?: boolean;
      allowsRecordingIOS?: boolean;
      interruptionModeIOS?: number;
      shouldDuckAndroid?: boolean;
      interruptionModeAndroid?: number;
      staysActiveInBackground?: boolean;
      playThroughEarpieceAndroid?: boolean;
    }

    export interface SoundObject {
      sound: Sound;
      status: PlaybackStatus;
    }

    export interface PlaybackStatus {
      isLoaded: boolean;
      isPlaying?: boolean;
      durationMillis?: number;
      positionMillis?: number;
      rate?: number;
      shouldCorrectPitch?: boolean;
      volume?: number;
      isMuted?: boolean;
      isLooping?: boolean;
      didJustFinish?: boolean;
      // For error handling
      error?: string;
    }

    export function setAudioModeAsync(mode: AudioMode): Promise<void>;

    export class Sound {
      constructor();
      
      static createAsync(
        source: any,
        initialStatus?: any,
        onPlaybackStatusUpdate?: (status: PlaybackStatus) => void,
        downloadFirst?: boolean
      ): Promise<SoundObject>;
      
      getStatusAsync(): Promise<PlaybackStatus>;
      setOnPlaybackStatusUpdate(callback: (status: PlaybackStatus) => void): void;
      loadAsync(source: any, initialStatus?: any, downloadFirst?: boolean): Promise<PlaybackStatus>;
      unloadAsync(): Promise<PlaybackStatus>;
      playAsync(): Promise<PlaybackStatus>;
      pauseAsync(): Promise<PlaybackStatus>;
      stopAsync(): Promise<PlaybackStatus>;
      setPositionAsync(positionMillis: number): Promise<PlaybackStatus>;
      setRateAsync(rate: number, shouldCorrectPitch: boolean): Promise<PlaybackStatus>;
      setVolumeAsync(volume: number): Promise<PlaybackStatus>;
      setIsMutedAsync(isMuted: boolean): Promise<PlaybackStatus>;
      setIsLoopingAsync(isLooping: boolean): Promise<PlaybackStatus>;
    }
  }
}
