/**
 * Cleanup Script
 * 
 * This script removes temporary, debug, test, and obsolete files
 * that are no longer needed in the project.
 */

const fs = require('fs');
const path = require('path');

// Files to delete
const filesToDelete = [
  // Temporary/Debug Files
  'content-imports-temp.ts',
  'data-sync.log',
  'import-map-log.txt',
  
  // Test Scripts
  'test-content-loading.mjs',
  'test-step-service.mjs',
  'check-content-dir.mjs',
  
  // Content Generation/Import Scripts
  'generate-content-imports.mjs',
  'generate-full-import-map.js',
  'create-import-map.js',
  'clean-all-content.js',
  
  // Fix/Update Scripts
  'add-missing-functions.js',
  'fix-book-service.js',
  'update-book-service.js',
  'create-complete-book-service.js',
  
  // Obsolete Documentation
  'DAILY_ADVANCEMENT_TEST.md',
  'CONTENT_LOADING_FIX.md',
  'TIMER_DATA_SYNC_GUIDE.md',
  'TIMER_IMPLEMENTATION_NOTES.md',
  'TIMER_ZERO_DURATION_UPDATE.md',
  'TODAYS_STEP_LOADING.md',
  'BOOK_CONTENT_DISPLAY.md',
  'DATA_SYNC_DOCUMENTATION.md',
  'VERSION_DEVIATIONS.md'
];

// Directories to delete
const dirsToDelete = [
  'content-backups-1743468585868',
  '../TheOneApp-Mobile-New' // Redundant mobile directory
];

// Function to delete a file
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } else {
      console.log(`File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error deleting file ${filePath}:`, err);
  }
}

// Function to delete a directory recursively
function deleteDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`Deleted directory: ${dirPath}`);
    } else {
      console.log(`Directory not found: ${dirPath}`);
    }
  } catch (err) {
    console.error(`Error deleting directory ${dirPath}:`, err);
  }
}

// Delete files
console.log('Starting cleanup...');
filesToDelete.forEach(file => {
  deleteFile(path.join(__dirname, file));
});

// Delete directories
dirsToDelete.forEach(dir => {
  deleteDirectory(path.join(__dirname, dir));
});

console.log('Cleanup complete!');
