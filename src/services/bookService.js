/**
 * Service to manage book data using pre-fetched content
 */

// Import navigation data
import navigationData from '../data/book/scraped-navigation.json';

// Cache for loaded content to avoid redundant file reads
const contentCache = new Map();

/**
 * Load content from a pre-fetched JSON file
 * @param {string} chapterId - The ID of the chapter to load
 * @returns {Promise<Object>} Promise resolving to the chapter content
 */
const loadContent = async (chapterId) => {
  // Check if content is already in cache
  if (contentCache.has(chapterId)) {
    return contentCache.get(chapterId);
  }
  
  try {
    // Import the content file dynamically
    const content = await import(`../data/book/content/${chapterId}.json`);
    
    // Store in cache
    contentCache.set(chapterId, content);
    
    return content;
  } catch (error) {
    console.error(`Error loading content for chapter ${chapterId}:`, error);
    
    // Return a fallback content object
    return { 
      title: 'Content Not Available', 
      content: `<div class="chapter-content">
                  <p>The content for this chapter is not available.</p>
                  <p>This could be because:</p>
                  <ul>
                    <li>The content does not exist on the source website</li>
                    <li>The URL structure has changed</li>
                    <li>The chapter ID is invalid</li>
                  </ul>
                  <p>You can try visiting the source website directly:</p>
                  <p><a href="https://www.newmessage.org/the-message/" target="_blank">New Message from God</a></p>
                </div>`, 
      audioUrl: null 
    };
  }
};

/**
 * Get the navigation structure
 * @returns {Array} The navigation structure
 */
const getNavigation = () => {
  return navigationData;
};

/**
 * Get a specific volume by ID
 * @param {string} volumeId - The ID of the volume to get
 * @returns {Object|null} The volume object or null if not found
 */
const getVolumeById = (volumeId) => {
  return navigationData.find(volume => volume.id === volumeId) || null;
};

/**
 * Get a specific book by ID
 * @param {string} volumeId - The ID of the volume containing the book
 * @param {string} bookId - The ID of the book to get
 * @returns {Object|null} The book object or null if not found
 */
const getBookById = (volumeId, bookId) => {
  const volume = getVolumeById(volumeId);
  if (!volume) return null;
  
  return volume.books.find(book => book.id === bookId) || null;
};

/**
 * Get a specific chapter by ID
 * @param {string} volumeId - The ID of the volume
 * @param {string} bookId - The ID of the book
 * @param {string} chapterId - The ID of the chapter to get
 * @returns {Object|null} The chapter object or null if not found
 */
const getChapterById = (volumeId, bookId, chapterId) => {
  const book = getBookById(volumeId, bookId);
  if (!book) return null;
  
  return book.chapters.find(chapter => chapter.id === chapterId) || null;
};

/**
 * Get content for a specific chapter
 * @param {string} volumeId - The ID of the volume
 * @param {string} bookId - The ID of the book
 * @param {string} chapterId - The ID of the chapter
 * @returns {Promise<Object>} Promise resolving to the chapter content
 */
const getChapterContent = async (volumeId, bookId, chapterId) => {
  const chapter = getChapterById(volumeId, bookId, chapterId);
  if (!chapter) {
    return { 
      title: 'Chapter Not Found', 
      content: '<p>The requested chapter could not be found.</p>', 
      audioUrl: null 
    };
  }
  
  return await loadContent(chapterId);
};

/**
 * Clear the content cache
 */
const clearCache = () => {
  contentCache.clear();
};

const bookService = {
  getNavigation,
  getVolumeById,
  getBookById,
  getChapterById,
  getChapterContent,
  clearCache
};

export default bookService;
