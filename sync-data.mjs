/**
 * DATA SYNCHRONIZATION SCRIPT
 * ===========================
 * 
 * Purpose:
 * This script synchronizes data files from the web app (source of truth)
 * to the mobile app (downstream consumer). It ensures that the mobile app
 * always has the most up-to-date data while maintaining a clear separation
 * of concerns.
 * 
 * Strategy:
 * 1. Track file versions using metadata or checksums
 * 2. Only copy files when they've changed
 * 3. Maintain a log of synchronization activities
 * 4. Provide clear error messages and recovery options
 * 
 * Usage:
 * - Run manually: node sync-data.mjs
 * - Run before build: Add to package.json scripts
 * - Run on a schedule: Set up with cron/scheduled tasks
 * 
 * Data Files Managed:
 * - steps.json: Practice steps data
 * - book/*.json: Book content files
 * - [Add other data files as needed]
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  // Source paths (web app - source of truth)
  sourcePaths: {
    steps: './src/data/steps.json',
    bookNavigation: './src/data/book/scraped-navigation.json',
  },
  
  // Destination paths (mobile app)
  destPaths: {
    steps: './TheOneApp_mobile/src/data/steps.json',
    bookNavigation: './TheOneApp_mobile/src/data/book/scraped-navigation.json',
  },
  
  // Version tracking file
  versionFile: './data-versions.json',
  
  // Logging
  logFile: './data-sync.log',
  
  // Backup directory
  backupDir: './data-backups',

  // Whether to create backups before overwriting
  createBackups: true,
};

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logMessage(`Created directory: ${dirPath}`);
  }
}

/**
 * Log a message to both console and log file
 * @param {string} message - Message to log
 * @param {boolean} isError - Whether this is an error message
 */
function logMessage(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  
  // Log to console
  if (isError) {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }
  
  // Log to file
  try {
    fs.appendFileSync(CONFIG.logFile, logEntry + '\n');
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
}

/**
 * Calculate file hash for version comparison
 * @param {string} filePath - Path to the file
 * @returns {string} - Hash of the file contents
 */
function calculateFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileContent).digest('hex');
  } catch (err) {
    logMessage(`Error calculating hash for ${filePath}: ${err.message}`, true);
    return '';
  }
}

/**
 * Load version tracking information
 * @returns {Object} - Version data for all tracked files
 */
function loadVersionData() {
  try {
    if (fs.existsSync(CONFIG.versionFile)) {
      const data = fs.readFileSync(CONFIG.versionFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    logMessage(`Error loading version data: ${err.message}`, true);
  }
  
  // Return empty object if file doesn't exist or there's an error
  return {};
}

/**
 * Save updated version tracking information
 * @param {Object} versionData - Updated version information
 */
function saveVersionData(versionData) {
  try {
    const data = JSON.stringify(versionData, null, 2);
    fs.writeFileSync(CONFIG.versionFile, data, 'utf8');
    logMessage('Version data updated successfully');
  } catch (err) {
    logMessage(`Error saving version data: ${err.message}`, true);
  }
}

/**
 * Create a backup of a file before overwriting
 * @param {string} filePath - Path to the file to backup
 */
function createBackup(filePath) {
  if (!CONFIG.createBackups) return;
  
  try {
    // Ensure backup directory exists
    ensureDirectoryExists(CONFIG.backupDir);
    
    // Create backup filename with timestamp
    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `${filename}.${timestamp}.bak`);
    
    // Copy file to backup location
    fs.copyFileSync(filePath, backupPath);
    logMessage(`Created backup: ${backupPath}`);
  } catch (err) {
    logMessage(`Failed to create backup for ${filePath}: ${err.message}`, true);
  }
}

/**
 * Ensure the destination directory exists
 * @param {string} destFile - Destination file path
 */
function ensureDestinationDirectoryExists(destFile) {
  const destDir = path.dirname(destFile);
  ensureDirectoryExists(destDir);
}

/**
 * Synchronize a single file from source to destination
 * @param {string} sourceFile - Source file path
 * @param {string} destFile - Destination file path
 * @param {Object} versionData - Version tracking data
 * @returns {boolean} - True if file was updated, false if no update needed
 */
function syncFile(sourceFile, destFile, versionData) {
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    logMessage(`Source file not found: ${sourceFile}`, true);
    return false;
  }
  
  // Calculate source file hash
  const sourceHash = calculateFileHash(sourceFile);
  if (!sourceHash) return false;
  
  // Get stored information about this file
  const fileKey = path.basename(sourceFile);
  const fileInfo = versionData[fileKey] || {};
  
  // Check if destination file exists and calculate its hash
  let destHash = '';
  if (fs.existsSync(destFile)) {
    destHash = calculateFileHash(destFile);
  }
  
  // Compare hashes to see if update is needed
  if (sourceHash === destHash) {
    logMessage(`File ${fileKey} is already up to date`);
    return false;
  }
  
  // Create backup of destination file if it exists
  if (fs.existsSync(destFile)) {
    createBackup(destFile);
  }
  
  // Ensure destination directory exists
  ensureDestinationDirectoryExists(destFile);
  
  // Copy file from source to destination
  try {
    fs.copyFileSync(sourceFile, destFile);
    logMessage(`Updated file: ${destFile}`);
    
    // Update version information
    versionData[fileKey] = {
      lastUpdated: new Date().toISOString(),
      hash: sourceHash
    };
    
    return true;
  } catch (err) {
    logMessage(`Error copying file ${sourceFile} to ${destFile}: ${err.message}`, true);
    return false;
  }
}

/**
 * Synchronize all files in a directory
 * @param {string} sourceDir - Source directory path
 * @param {string} destDir - Destination directory path
 * @param {Object} versionData - Version tracking data
 * @returns {boolean} - True if any files were updated
 */
function syncDirectory(sourceDir, destDir, versionData) {
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    logMessage(`Source directory not found: ${sourceDir}`, true);
    return false;
  }
  
  // Ensure destination directory exists
  ensureDirectoryExists(destDir);
  
  // Track if any files were updated
  let anyUpdated = false;
  
  try {
    // Get all files in the source directory
    const files = fs.readdirSync(sourceDir);
    
    // Process each file
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(destDir, file);
      
      // Skip directories (we're only syncing files)
      if (fs.statSync(sourcePath).isDirectory()) {
        continue;
      }
      
      // Sync the file
      const updated = syncFile(sourcePath, destPath, versionData);
      anyUpdated = anyUpdated || updated;
    }
    
    return anyUpdated;
  } catch (err) {
    logMessage(`Error syncing directory ${sourceDir}: ${err.message}`, true);
    return false;
  }
}

/**
 * Main synchronization function
 * Processes all configured data files
 */
async function synchronizeData() {
  logMessage('Starting data synchronization');
  
  // Load version data
  const versionData = loadVersionData();
  
  // Track if any files were updated
  let filesUpdated = false;
  
  // Process each configured file
  for (const [key, sourcePath] of Object.entries(CONFIG.sourcePaths)) {
    const destPath = CONFIG.destPaths[key];
    
    if (!destPath) {
      logMessage(`No destination path configured for ${key}`, true);
      continue;
    }
    
    logMessage(`Processing ${key}: ${sourcePath} -> ${destPath}`);
    const updated = syncFile(sourcePath, destPath, versionData);
    filesUpdated = filesUpdated || updated;
  }
  
  // DISABLED: Book content file sync to prevent overwriting clean HTML files
  // logMessage('Syncing book content files');
  // const bookContentSourceDir = './src/data/book/content';
  // const bookContentDestDir = './TheOneApp/src/data/book/content';
  // const bookContentUpdated = syncDirectory(bookContentSourceDir, bookContentDestDir, versionData);
  // filesUpdated = filesUpdated || bookContentUpdated;
  logMessage('WARNING: Book content file synchronization has been disabled to preserve clean HTML files');
  
  // Save updated version data
  if (filesUpdated) {
    saveVersionData(versionData);
  }
  
  logMessage('Data synchronization completed');
}

// Initialize log file
ensureDirectoryExists(path.dirname(CONFIG.logFile));

// Execute the synchronization
synchronizeData().catch(err => {
  logMessage(`Synchronization failed: ${err.message}`, true);
  process.exit(1);
});
