import { useEffect, useState } from 'react';
import useBookStore from '../store/bookStore';
import bookService from '../services/bookService';
import { FaBars, FaFont, FaPlus, FaMinus } from 'react-icons/fa';

const BookDisplay = () => {
  const {
    selectedVolumeId,
    selectedBookId,
    selectedChapterId,
    currentContent,
    isLoading,
    error,
    openBookMenu
  } = useBookStore();

  // State for audio player
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  
  // State for text size
  const [textSize, setTextSize] = useState(1.1); // Default size in rem

  // Get current chapter info for display
  const getCurrentChapterInfo = () => {
    if (!selectedVolumeId || !selectedBookId || !selectedChapterId) {
      return { volumeTitle: '', bookTitle: '', chapterTitle: '' };
    }

    const volume = bookService.getVolumeById(selectedVolumeId);
    const book = bookService.getBookById(selectedVolumeId, selectedBookId);
    const chapter = bookService.getChapterById(selectedVolumeId, selectedBookId, selectedChapterId);

    return {
      volumeTitle: volume?.title || '',
      bookTitle: book?.title || '',
      chapterTitle: chapter?.title || ''
    };
  };

  const { volumeTitle, bookTitle, chapterTitle } = getCurrentChapterInfo();

  // Handle audio play/pause
  const toggleAudio = () => {
    if (audioElement) {
      if (isAudioPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  // Initialize audio element when content changes
  useEffect(() => {
    if (currentContent?.audioUrl) {
      const audio = new Audio(currentContent.audioUrl);
      
      // Set up event listeners
      audio.addEventListener('ended', () => setIsAudioPlaying(false));
      audio.addEventListener('pause', () => setIsAudioPlaying(false));
      audio.addEventListener('play', () => setIsAudioPlaying(true));
      
      setAudioElement(audio);
      
      // Cleanup
      return () => {
        audio.pause();
        audio.removeEventListener('ended', () => setIsAudioPlaying(false));
        audio.removeEventListener('pause', () => setIsAudioPlaying(false));
        audio.removeEventListener('play', () => setIsAudioPlaying(true));
      };
    } else {
      setAudioElement(null);
      setIsAudioPlaying(false);
    }
  }, [currentContent]);

  // Function to enhance HTML content with additional styling
  const enhanceHtmlContent = (html) => {
    if (!html) return '';
    
    // Add extra styling to paragraphs - with reduced spacing and no separator
    return html.replace(
      /<p class="book-paragraph"/g, 
      '<p class="book-paragraph" style="margin-bottom: 1.5em !important; line-height: 1.8 !important; display: block !important;"'
    );
  };

  // If no content is selected, show a welcome message
  if (!currentContent) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="bg-spotify-card rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-primary-text mb-4">Welcome to The One Book</h2>
          <p className="text-secondary-text mb-6">
            Select a chapter from the menu to begin reading.
          </p>
          <button
            onClick={openBookMenu}
            className="inline-flex items-center px-4 py-2 bg-spotify-green text-primary-text rounded-full hover:bg-spotify-green-hover transition-colors"
          >
            <FaBars className="mr-2" /> Open Book Menu
          </button>
        </div>
      </div>
    );
  }

  // If loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="bg-spotify-card rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-primary-text mb-4">Loading Content</h2>
          <div className="flex justify-center items-center mb-4">
            <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-secondary-text mb-2">
            Fetching content from newmessage.org...
          </p>
          <p className="text-xs text-secondary-text">
            (This may take some time as the server can be slow to respond)
          </p>
        </div>
      </div>
    );
  }

  // If there's an error, show an error message
  if (error) {
    return (
      <div className="flex flex-col space-y-3">
        <div className="bg-spotify-card rounded-lg p-8 text-center border border-red-500">
          <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-secondary-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-3">
      {/* Sticky header with chapter title and controls */}
      <div 
        className="bg-spotify-card rounded-lg p-4 border border-gray-800 mb-3"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0.75rem 1rem'
        }}
      >
        <div className="flex flex-wrap justify-between items-start">
          <div className="flex-1 mr-2">
            <h2 className="text-xl font-bold text-primary-text mb-0 chapter-title">
              {currentContent.title || chapterTitle}
            </h2>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            {/* Audio button - only show if audio is available */}
            {currentContent.audioUrl && (
              <button
                onClick={toggleAudio}
                className="px-3 py-1 bg-spotify-green text-primary-text rounded-full hover:bg-spotify-green-hover transition-colors text-sm"
              >
                {isAudioPlaying ? 'Pause' : 'Listen'}
              </button>
            )}
            <button
              onClick={openBookMenu}
              className="p-2 rounded-full bg-spotify-card-hover hover:bg-gray-700 flex items-center justify-center transition-colors"
              aria-label="Open Book Menu"
            >
              <FaBars className="text-secondary-text" size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Spacer to prevent content from being hidden under the fixed header */}
      <div style={{ height: '80px' }}></div>

      {/* Text size controls - fixed at the bottom right */}
      <div 
        style={{
          position: 'fixed',
          bottom: '5rem', // Space for the footer
          right: '1rem',
          zIndex: 20,
          backgroundColor: '#121212',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          border: '1px solid #333'
        }}
      >
        <div className="flex items-center">
          <FaFont className="text-secondary-text mr-2" />
          <button
            onClick={() => setTextSize(prev => Math.max(0.8, prev - 0.1))}
            className="p-2 rounded-full bg-spotify-card-hover hover:bg-gray-700 flex items-center justify-center transition-colors mr-2"
            aria-label="Decrease Text Size"
          >
            <FaMinus className="text-secondary-text" />
          </button>
          <button
            onClick={() => setTextSize(prev => Math.min(1.5, prev + 0.1))}
            className="p-2 rounded-full bg-spotify-card-hover hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="Increase Text Size"
          >
            <FaPlus className="text-secondary-text" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-spotify-card rounded-lg border border-gray-800">
        <div className="p-6 prose prose-invert max-w-none">
          <div 
            dangerouslySetInnerHTML={{ __html: enhanceHtmlContent(currentContent.content) }} 
            style={{ 
              '--book-text-size': `${textSize}rem`,
              fontSize: `${textSize}rem`
            }}
            className="book-content-container"
          />
        </div>
      </div>
    </div>
  );
};

export default BookDisplay;
