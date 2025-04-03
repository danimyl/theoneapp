#!/usr/bin/env node

/**
 * EAS Pre-build Hook
 * 
 * This script runs before the EAS build process starts.
 * It modifies the npm install command to use the --legacy-peer-deps flag
 * to resolve dependency conflicts.
 */

console.log('🔄 Running pre-build hook...');

// Override the npm install command to use --legacy-peer-deps
process.env.npm_config_legacy_peer_deps = 'true';

console.log('✅ Set npm to use --legacy-peer-deps flag');
console.log('🚀 Continuing with build process...');
