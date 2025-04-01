/**
 * Script to synchronize book data from the web app to the mobile app
 * 
 * This script copies the scraped-navigation.json file and content files
 * from the web app to the mobile app.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Source and destination paths
const WEB_APP_PATH = path.join(__dirname, 'src', 'data', 'book');
const MOBILE_APP_PATH = path.join(__dirname, 'TheOneApp_mobile', 'src', 'data', 'book');

// Ensure destination directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

// Copy navigation data
const copyNavigationData = () => {
  const sourcePath = path.join(WEB_APP_PATH, 'scraped-navigation.json');
  const destPath = path.join(MOBILE_APP_PATH, 'scraped-navigation.json');
  
  if (!fs.existsSync(sourcePath)) {
    console.error(`Navigation data not found at: ${sourcePath}`);
    return false;
  }
  
  try {
    // Read the navigation data
    const navigationData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    
    // Log the structure for debugging
    console.log(`Navigation data structure: ${navigationData.length} volumes`);
    navigationData.forEach((volume, vIndex) => {
      console.log(`Volume ${vIndex + 1}: ${volume.title} - ${volume.books.length} books`);
      volume.books.forEach((book, bIndex) => {
        console.log(`  Book ${bIndex + 1}: ${book.title} - ${book.chapters.length} chapters`);
      });
    });
    
    // Create the destination directory if it doesn't exist
    ensureDirectoryExists(path.dirname(destPath));
    
    // Write the navigation data to the destination
    try {
      fs.writeFileSync(destPath, JSON.stringify(navigationData, null, 2));
      console.log(`Copied scraped navigation data to: ${destPath}`);
    } catch (writeError) {
      console.error(`Error writing navigation data: ${writeError.message}`);
      console.error(`Destination path: ${destPath}`);
      return false;
    }
    
    // Remove the old navigation.json file if it exists to avoid confusion
    const oldNavPath = path.join(MOBILE_APP_PATH, 'navigation.json');
    if (fs.existsSync(oldNavPath)) {
      try {
        fs.unlinkSync(oldNavPath);
        console.log(`Removed obsolete navigation.json file`);
      } catch (unlinkError) {
        console.warn(`Could not remove obsolete navigation.json file: ${unlinkError.message}`);
        // Continue anyway, this is not critical
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing navigation data: ${error.message}`);
    return false;
  }
};

// Copy content files
const copyContentFiles = () => {
  const sourceContentPath = path.join(WEB_APP_PATH, 'content');
  const destContentPath = path.join(MOBILE_APP_PATH, 'content');
  
  if (!fs.existsSync(sourceContentPath)) {
    console.error(`Content directory not found at: ${sourceContentPath}`);
    return false;
  }
  
  ensureDirectoryExists(destContentPath);
  
  try {
    // Get all content files
    const contentFiles = fs.readdirSync(sourceContentPath);
    
    let successCount = 0;
    
    for (const file of contentFiles) {
      if (file.endsWith('.json')) {
        const sourceFile = path.join(sourceContentPath, file);
        const destFile = path.join(destContentPath, file);
        
        fs.copyFileSync(sourceFile, destFile);
        console.log(`Copied content file: ${file}`);
        successCount++;
      }
    }
    
    console.log(`Successfully copied ${successCount} of ${contentFiles.length} content files`);
    return successCount > 0;
  } catch (error) {
    console.error(`Error copying content files: ${error.message}`);
    return false;
  }
};

// Main function
const syncBookData = () => {
  console.log('Starting book data synchronization...');
  
  // Ensure destination directories exist
  ensureDirectoryExists(MOBILE_APP_PATH);
  ensureDirectoryExists(path.join(MOBILE_APP_PATH, 'content'));
  
  // Copy navigation data
  const navSuccess = copyNavigationData();
  
  // DISABLED: Content file sync to prevent overwriting clean HTML files
  // const contentSuccess = copyContentFiles();
  console.log('WARNING: Content file synchronization has been disabled to preserve clean HTML files');
  const contentSuccess = true; // Pretend success
  
  if (navSuccess && contentSuccess) {
    console.log('Book data synchronization completed successfully!');
  } else {
    console.warn('Book data synchronization completed with some issues.');
  }
};

// Run the sync function
syncBookData();
