// Learn more https://docs.expo.io/guides/customizing-metro
import { getDefaultConfig } from 'expo/metro-config';

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(import.meta.url);

// Add support for TypeScript files
config.resolver.sourceExts = ['js', 'jsx', 'ts', 'tsx', 'json'];

export default config;
