/**
 * Start Android Script
 * 
 * This script runs the data synchronization process and then starts the Expo app
 * specifically for Android, bypassing web bundling to avoid potential issues.
 * 
 * Usage: 
 * node start-android.mjs
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting data synchronization...');

// First run the data sync script
const syncProcess = spawn('node', ['../sync-data.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

syncProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\nData synchronization completed successfully!');
    console.log('Starting Expo app for Android...');
    
    // Then start the Expo app with Android-specific flags
    const expoProcess = spawn('npx', ['expo', 'start', '--android', '--no-web'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    expoProcess.on('close', (expoCode) => {
      if (expoCode !== 0) {
        console.error(`\nExpo process exited with code ${expoCode}`);
      }
    });
  } else {
    console.error(`\nData synchronization failed with code ${code}`);
    console.error('Not starting Expo app due to synchronization failure.');
  }
});
