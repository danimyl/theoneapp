/**
 * Service to manage book data using pre-fetched content
 * 
 * This service loads book navigation data from scraped-navigation.json
 * and provides methods to access volumes, books, chapters, and content.
 */

import { Volume, Book, Chapter, BookContent } from '../types/book';
import * as FileSystem from 'expo-file-system';

/**
 * Clean title by removing unwanted suffixes and formatting
 */
function cleanTitle(title: string): string {
  if (!title) return '';
  
  // Remove "Expand" text if present (common in volume titles)
  let cleanedTitle = title.replace(/Expand$/i, '').trim();
  
  // Remove any trailing pipe characters and trim
  cleanedTitle = cleanedTitle.replace(/\s*\|\s*$/, '').trim();
  
  // Remove "Print Book" or "eBook" suffixes that might be in chapter titles
  cleanedTitle = cleanedTitle.replace(/\s*\|\s*(Print Book|eBook)$/, '').trim();
  
  return cleanedTitle;
}

/**
 * Extract ID from URL
 */
function extractIdFromUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Extract the last part of the URL (the chapter ID)
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    return pathParts[pathParts.length - 1] || '';
  } catch (error) {
    // Fallback for invalid URLs
    console.warn(`Invalid URL format: ${url}`);
    const parts = url.split('/').filter(part => part.length > 0);
    return parts[parts.length - 1] || '';
  }
}

// Import navigation data
// Note: This will be populated after running the sync-book-data.mjs script
let navigationData: Volume[] = [];

try {
  // Dynamic import to handle the case where the file might not exist yet
  // Use scraped-navigation.json which is the same file used by the web app
  const importedData = require('../data/book/scraped-navigation.json');
  
  if (Array.isArray(importedData)) {
    navigationData = importedData;
    
    // Clean up volume titles (remove "Expand" suffix)
    navigationData = navigationData.map(volume => ({
      ...volume,
      title: cleanTitle(volume.title)
    }));
    
    // Log navigation data for debugging
    console.log('Navigation data loaded:', 
      `Volumes: ${navigationData.length}, ` +
      `First volume books: ${navigationData[0]?.books?.length || 0}`
    );
    
    // Log detailed information about each volume and book
    navigationData.forEach((volume, vIndex) => {
      console.log(`Volume ${vIndex + 1}: ${volume.title} - ${volume.books.length} books`);
      volume.books.forEach((book, bIndex) => {
        console.log(`  Book ${bIndex + 1}: ${book.title} - ${book.chapters.length} chapters`);
      });
    });
  } else {
    console.error('Imported navigation data is not an array:', importedData);
    navigationData = [];
  }
} catch (error) {
  console.warn('Book navigation data not found. Run sync-book-data.mjs to populate.');
  console.error('Error details:', error);
  navigationData = [];
}

// Static import map - each file is imported with a hardcoded path
// This avoids using dynamic requires which aren't supported by Metro bundler
const contentImports: Record<string, BookContent> = {
IMPORT_MAP_PLACEHOLDER
};

// Log the number of loaded content files
console.log(`Loaded ${Object.keys(contentImports).length} content files via static imports`);

// Cache for loaded content
const contentCache: Record<string, BookContent> = {};

/**
 * Load content for a chapter
 * 
 * This function tries to load content from:
 * 1. The static import map (contentImports)
 * 2. The local filesystem (FileSystem.documentDirectory)
 * 
 * It also caches content to avoid redundant file reads
 */
async function loadContent(chapterId: string): Promise<BookContent | null> {
  if (!chapterId) {
    console.warn('Attempted to load content with empty chapterId');
    return null;
  }
  
  // Check cache first
  if (contentCache[chapterId]) {
    console.log(`Using cached content for ${chapterId}`);
    return contentCache[chapterId];
  }
  
  // Try to get from static imports
  if (contentImports[chapterId]) {
    console.log(`Using static import for ${chapterId}`);
    contentCache[chapterId] = contentImports[chapterId];
    return contentImports[chapterId];
  }
  
  // Fallback to FileSystem
  try {
    const contentPath = `${FileSystem.documentDirectory}book/content/${chapterId}.json`;
    console.log(`Attempting to load content from filesystem: ${contentPath}`);
    
    const content = await FileSystem.readAsStringAsync(contentPath);
    const parsedContent = JSON.parse(content) as BookContent;
    
    // Cache the content
    contentCache[chapterId] = parsedContent;
    
    return parsedContent;
  } catch (error) {
    console.error(`Error loading content for ${chapterId}:`, error);
    return null;
  }
}

/**
 * Get all volumes
 */
function getVolumes(): Volume[] {
  return navigationData;
}

/**
 * Get a volume by index
 */
function getVolume(index: number): Volume | null {
  return navigationData[index] || null;
}

/**
 * Get a book by volume and book index
 */
function getBook(volumeIndex: number, bookIndex: number): Book | null {
  const volume = getVolume(volumeIndex);
  if (!volume) return null;
  
  return volume.books[bookIndex] || null;
}

/**
 * Get a chapter by volume, book, and chapter index
 */
function getChapter(volumeIndex: number, bookIndex: number, chapterIndex: number): Chapter | null {
  const book = getBook(volumeIndex, bookIndex);
  if (!book) return null;
  
  return book.chapters[chapterIndex] || null;
}

/**
 * Find a chapter by ID
 */
function findChapterById(chapterId: string): { 
  chapter: Chapter, 
  volumeIndex: number, 
  bookIndex: number, 
  chapterIndex: number 
} | null {
  for (let volumeIndex = 0; volumeIndex < navigationData.length; volumeIndex++) {
    const volume = navigationData[volumeIndex];
    
    for (let bookIndex = 0; bookIndex < volume.books.length; bookIndex++) {
      const book = volume.books[bookIndex];
      
      for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
        const chapter = book.chapters[chapterIndex];
        const id = extractIdFromUrl(chapter.url);
        
        if (id === chapterId) {
          return { chapter, volumeIndex, bookIndex, chapterIndex };
        }
      }
    }
  }
  
  return null;
}

export default {
  getVolumes,
  getVolume,
  getBook,
  getChapter,
  findChapterById,
  loadContent,
};
