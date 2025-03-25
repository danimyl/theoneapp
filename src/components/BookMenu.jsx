import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import useBookStore from '../store/bookStore';
import bookService from '../services/bookService';

const BookMenu = ({ isOpen, onClose }) => {
  const {
    selectedVolumeId,
    selectedBookId,
    selectedChapterId,
    setSelectedVolume,
    setSelectedBook,
    setSelectedChapter,
    setCurrentContent,
    setIsLoading,
    setError
  } = useBookStore();

  // Local state for expanded items
  const [expandedVolumes, setExpandedVolumes] = useState({});
  const [expandedBooks, setExpandedBooks] = useState({});
  
  // State for navigation data
  const [navigation, setNavigation] = useState([]);
  
  // Initialize navigation data
  useEffect(() => {
    const nav = bookService.getNavigation();
    console.log('Navigation data loaded:', nav);
    setNavigation(nav);
    
    // Auto-expand the first volume if none is selected
    if (nav.length > 0 && !selectedVolumeId) {
      setExpandedVolumes(prev => ({
        ...prev,
        [nav[0].id]: true
      }));
    }
  }, [selectedVolumeId]);

  // Toggle volume expansion
  const toggleVolume = (volumeId) => {
    setExpandedVolumes(prev => ({
      ...prev,
      [volumeId]: !prev[volumeId]
    }));
  };

  // Toggle book expansion
  const toggleBook = (bookId) => {
    setExpandedBooks(prev => ({
      ...prev,
      [bookId]: !prev[bookId]
    }));
  };

  // Handle volume selection
  const handleVolumeSelect = (volumeId) => {
    setSelectedVolume(volumeId);
    // Auto-expand the selected volume
    setExpandedVolumes(prev => ({
      ...prev,
      [volumeId]: true
    }));
  };

  // Handle book selection
  const handleBookSelect = (volumeId, bookId) => {
    setSelectedBook(bookId);
    // Auto-expand the selected book
    setExpandedBooks(prev => ({
      ...prev,
      [bookId]: true
    }));
  };

  // Handle chapter selection
  const handleChapterSelect = async (volumeId, bookId, chapterId) => {
    setSelectedChapter(chapterId);
    setIsLoading(true);
    
    try {
      const content = await bookService.getChapterContent(volumeId, bookId, chapterId);
      setCurrentContent(content);
      setError(null);
    } catch (error) {
      console.error('Error loading chapter content:', error);
      setError('Failed to load chapter content. Please try again.');
    } finally {
      setIsLoading(false);
    }
    
    // Close the menu on mobile after selection
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  // Initialize expanded state based on selections
  useEffect(() => {
    if (selectedVolumeId) {
      setExpandedVolumes(prev => ({
        ...prev,
        [selectedVolumeId]: true
      }));
    }
    
    if (selectedBookId) {
      setExpandedBooks(prev => ({
        ...prev,
        [selectedBookId]: true
      }));
    }
  }, [selectedVolumeId, selectedBookId]);

  // Function to clean volume title (remove "Expand")
  const cleanVolumeTitle = (title) => {
    return title.replace('Expand', '').trim();
  };

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-70"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div
        className="w-full max-w-sm h-full bg-spotify-darker overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '90%',
          maxWidth: '500px',
          backgroundColor: '#121212',
          boxShadow: '2px 0 10px rgba(0,0,0,0.5)',
          transform: 'translateX(0)',
          animation: 'slideInFromLeft 0.3s ease-out',
          overflowY: 'auto',
          padding: '1.5rem'
        }}
      >
        <style>
          {`
            @keyframes slideInFromLeft {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(0);
              }
            }
          `}
        </style>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">The One Book</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
          >
            <IoClose size={20} className="text-gray-300" />
          </button>
        </div>
        
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
          {navigation && navigation.length > 0 ? (
            navigation.map(volume => (
              <div key={volume.id} className="mb-2">
                {/* Volume header */}
                <div 
                  className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-gray-800 ${
                    selectedVolumeId === volume.id ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => {
                    handleVolumeSelect(volume.id);
                    toggleVolume(volume.id);
                  }}
                >
                  <span className="font-medium text-white text-lg">{cleanVolumeTitle(volume.title)}</span>
                  <span>
                    {expandedVolumes[volume.id] ? (
                      <FaChevronUp className="text-gray-400" />
                    ) : (
                      <FaChevronDown className="text-gray-400" />
                    )}
                  </span>
                </div>
                
                {/* Books within volume */}
                {expandedVolumes[volume.id] && (
                  <div className="ml-4 mt-1 space-y-1">
                    {volume.books.map(book => (
                      <div key={book.id}>
                        {/* Book header */}
                        <div 
                          className={`flex justify-between items-center p-2 rounded cursor-pointer hover:bg-gray-800 ${
                            selectedBookId === book.id ? 'bg-gray-800' : ''
                          }`}
                          onClick={() => {
                            handleBookSelect(volume.id, book.id);
                            toggleBook(book.id);
                          }}
                        >
                          <span className="text-base text-white">{book.title}</span>
                          <span>
                            {expandedBooks[book.id] ? (
                              <FaChevronUp className="text-gray-400 text-xs" />
                            ) : (
                              <FaChevronDown className="text-gray-400 text-xs" />
                            )}
                          </span>
                        </div>
                        
                        {/* Chapters within book */}
                        {expandedBooks[book.id] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {book.chapters.map(chapter => (
                              <div 
                                key={chapter.id}
                                className={`p-2 rounded cursor-pointer hover:bg-gray-800 text-sm ${
                                  selectedChapterId === chapter.id ? 'bg-gray-800 text-green-400' : 'text-gray-400'
                                }`}
                                onClick={() => handleChapterSelect(volume.id, book.id, chapter.id)}
                              >
                                {chapter.title}
                              </div>
                            ))}
                            
                            {book.chapters.length === 0 && (
                              <div className="p-2 text-xs text-gray-500 italic">
                                Loading chapters...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-gray-400">
              <p>Loading navigation data...</p>
              <button
                onClick={() => {
                  // Force reload navigation
                  console.log('Forcing navigation reload');
                  const nav = bookService.getNavigation();
                  console.log('Reloaded navigation:', nav);
                  setNavigation(nav);
                  
                  // Auto-expand the first volume
                  if (nav.length > 0) {
                    setExpandedVolumes(prev => ({
                      ...prev,
                      [nav[0].id]: true
                    }));
                  }
                }}
                className="mt-4 px-3 py-1.5 rounded-full bg-green-500 text-white text-sm"
              >
                Reload Navigation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookMenu;
