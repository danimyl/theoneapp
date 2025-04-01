/**
 * Start with Data Sync Script
 * 
 * This script runs the data synchronization process and then starts the Expo app.
 * It ensures that the mobile app always has the most up-to-date data before running.
 * 
 * Usage: 
 * npm run start-with-sync
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting data synchronization...');

// First run the steps data sync script
const syncStepsProcess = spawn('node', ['../sync-data.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

syncStepsProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\nSteps data synchronization completed successfully!');
    console.log('Starting book data synchronization...');
    
    // DISABLED: Book data sync to prevent overwriting clean HTML files
    console.log('\nWARNING: Book data synchronization has been disabled to preserve clean HTML files');
    console.log('Starting Expo app...');
    
    // Start the Expo app directly without running book data sync
    const expoProcess = spawn('npx', ['expo', 'start'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    expoProcess.on('close', (expoCode) => {
      if (expoCode !== 0) {
        console.error(`\nExpo process exited with code ${expoCode}`);
      }
    });
    
    // Skip the book data sync and its callback
    /*
    const syncBookProcess = spawn('node', ['../sync-book-data.mjs'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });
    
    syncBookProcess.on('close', (bookCode) => {
      if (bookCode === 0) {
        console.log('\nBook data synchronization completed successfully!');
        console.log('Starting Expo app...');
        
        // Finally start the Expo app
        const expoProcess = spawn('npx', ['expo', 'start'], {
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
        console.error(`\nBook data synchronization failed with code ${bookCode}`);
        console.error('Not starting Expo app due to synchronization failure.');
      }
    });
    */
  } else {
    console.error(`\nSteps data synchronization failed with code ${code}`);
    console.error('Not starting Expo app due to synchronization failure.');
  }
});
