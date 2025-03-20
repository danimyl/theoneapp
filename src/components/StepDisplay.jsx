import { useEffect, useState } from 'react';
import { FaPlay, FaPause, FaStop, FaCheck, FaClock } from 'react-icons/fa';
import useSettingsStore from '../store/settingsStore';

const StepDisplay = ({ step, stepForToday }) => {
  // Safely access step properties with defaults
  const stepId = step?.id || 0;
  const stepTitle = step?.title || 'Loading...';
  const stepInstructions = step?.instructions || '';
  const stepHourly = step?.hourly || false;
  const practices = step?.practices || [];
  const durations = step?.durations || practices.map(() => 0);
  
  // Get store access
  const { practiceChecks, setPracticeChecks } = useSettingsStore();
  
  // State for timer
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Get completion state for this step (with fallback)
  const [completed, setCompleted] = useState(() => {
    try {
      // If valid saved state exists, use it
      if (practiceChecks && 
          practiceChecks[stepId] && 
          Array.isArray(practiceChecks[stepId]) && 
          practiceChecks[stepId].length === practices.length) {
        return [...practiceChecks[stepId]];
      }
    } catch (err) {
      console.log('Error loading saved state');
    }
    
    // Default to all unchecked
    return Array(practices.length).fill(false);
  });
  
  // Save to store when completed changes
  useEffect(() => {
    try {
      // Only save if step is valid and array matches expected length
      if (stepId && completed.length === practices.length) {
        setPracticeChecks(stepId, [...completed]);
      }
    } catch (err) {
      console.log('Error saving state');
    }
  }, [completed]);
  
  // Timer logic
  useEffect(() => {
    let timerId;
    
    if (isTimerRunning && timeLeft > 0) {
      timerId = setTimeout(() => {
        setTimeLeft(prev => {
          // At 0, mark as complete and stop timer
          if (prev <= 1) {
            try {
              // Create a new array for immutability
              const newCompleted = [...completed];
              newCompleted[currentIndex] = true;
              setCompleted(newCompleted);
              
              // Play bell sound when timer completes
              try {
                const audio = new Audio('/aud/bell.mp3');
                audio.play();
              } catch (e) {
                console.error('Failed to play timer completion sound:', e);
              }
              
              // After marking the practice as complete, stop the timer
              // The user will need to click Start Practices again to continue
              setIsTimerRunning(false);
            } catch (err) {
              console.log('Error updating completion');
              setIsTimerRunning(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearTimeout(timerId);
  }, [isTimerRunning, timeLeft, currentIndex]);
  
  // When step changes, reset timer state
  useEffect(() => {
    setIsTimerRunning(false);
    setTimeLeft(0);
    setCurrentIndex(0);
    
    // Initialize completed state for new step
    try {
      if (practiceChecks && 
          practiceChecks[stepId] && 
          Array.isArray(practiceChecks[stepId]) && 
          practiceChecks[stepId].length === practices.length) {
        setCompleted([...practiceChecks[stepId]]);
      } else {
        setCompleted(Array(practices.length).fill(false));
      }
    } catch (err) {
      setCompleted(Array(practices.length).fill(false));
    }
  }, [stepId, practices.length]);
  
  // Handle practice selection
  const handleSelectPractice = (index) => {
    try {
      if (index >= 0 && index < practices.length) {
        setCurrentIndex(index);
        setTimeLeft(durations[index] || 0);
      }
    } catch (err) {
      console.log('Error selecting practice');
    }
  };
  
  // Find the next unchecked practice
  const findNextUncheckedPractice = () => {
    try {
      // Find the first unchecked practice
      const nextIndex = completed.findIndex(check => !check);
      if (nextIndex !== -1) {
        return nextIndex;
      }
      // If all are checked, return the current index
      return currentIndex;
    } catch (err) {
      console.log('Error finding next unchecked practice');
      return currentIndex;
    }
  };
  
  // Toggle timer running state
  const handleToggleTimer = () => {
    try {
      if (!isTimerRunning) {
        // Find the next unchecked practice when starting
        const nextIndex = findNextUncheckedPractice();
        setCurrentIndex(nextIndex);
        
        // If timer is at 0, initialize it
        if (timeLeft <= 0 && durations[nextIndex]) {
          setTimeLeft(durations[nextIndex]);
        }
        setIsTimerRunning(true);
      } else {
        setIsTimerRunning(false);
      }
    } catch (err) {
      console.log('Error toggling timer');
    }
  };
  
  // Stop timer
  const handleStopTimer = () => {
    try {
      setIsTimerRunning(false);
      setTimeLeft(0);
    } catch (err) {
      console.log('Error stopping timer');
    }
  };
  
  // Toggle completion state
  const handleToggleComplete = (index) => {
    try {
      if (index >= 0 && index < completed.length) {
        const newCompleted = [...completed];
        newCompleted[index] = !newCompleted[index];
        setCompleted(newCompleted);
      }
    } catch (err) {
      console.log('Error toggling completion');
    }
  };
  
  // Format time as mm:ss
  const formatTime = (seconds) => {
    try {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } catch (err) {
      return '0:00';
    }
  };
  
  // Prevent rendering if step data is invalid
  if (!step || !stepId) {
    return (
      <div className="bg-spotify-card rounded-lg p-8 text-primary-text">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-spotify-card rounded-lg overflow-hidden">
      {/* Header area with cover art style */}
      <div className="p-8 bg-gradient-to-b from-spotify-card-hover to-spotify-card">
        {stepForToday === stepId && (
          <div className="inline-block px-3 py-1 rounded-full bg-spotify-green text-xs font-semibold text-primary-text mb-3">
            TODAY'S STEP
          </div>
        )}
        
        <h2 className="text-3xl font-bold text-primary-text mb-3">{stepTitle}</h2>
        
        <div className="flex items-center mb-4 text-secondary-text text-sm">
          <span className="inline-block h-8 w-8 rounded-full bg-spotify-green mr-2 flex items-center justify-center">
            <FaCheck className="text-primary-text" />
          </span>
          <span>Step {stepId}</span>
          <span className="mx-2">•</span>
          <span>{stepHourly ? 'Hourly Reminders On' : 'Reminders Off'}</span>
        </div>
        
        <p className="text-secondary-text mb-6 leading-relaxed max-w-3xl">{stepInstructions}</p>
        
        {/* Play button */}
        <div className="mt-4">
          {!isTimerRunning ? (
            <button
              onClick={handleToggleTimer}
              className="inline-flex items-center px-8 py-3 bg-spotify-green text-primary-text rounded-full hover:bg-spotify-green-hover transition-colors font-bold text-lg"
            >
              <FaPlay className="mr-2" /> Start Practices
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleTimer}
                className="inline-flex items-center px-8 py-3 bg-spotify-green text-primary-text rounded-full hover:bg-spotify-green-hover transition-colors font-bold text-lg"
              >
                <FaPause className="mr-2" /> Pause
              </button>
              <button
                onClick={handleStopTimer}
                className="inline-flex items-center px-6 py-3 bg-secondary-button-500 text-primary-text rounded-full hover:bg-secondary-button-600 transition-colors"
              >
                <FaStop className="mr-2" /> Stop
              </button>
              {timeLeft > 0 && (
                <div className="text-secondary-text ml-3">
                  {formatTime(timeLeft)} remaining
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Practice tracks */}
      <div className="p-8">
        <div className="mb-4 text-sm uppercase font-bold tracking-wider text-secondary-text border-b border-gray-800 pb-2">
          Practices
        </div>
        
        <div className="space-y-4 mt-4">
          {practices.map((practice, index) => (
            <div 
              key={index} 
              className={`flex items-center p-3 rounded ${
                currentIndex === index && isTimerRunning ? 'bg-spotify-card-hover' : ''
              } hover:bg-spotify-card-hover/50 cursor-pointer`}
              onClick={() => handleSelectPractice(index)}
            >
              <div className="w-8 text-secondary-text text-right mr-4">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center">
                  <div 
                    className={`w-6 h-6 rounded-sm mr-3 flex items-center justify-center border ${
                      completed[index] 
                        ? 'bg-spotify-green border-spotify-green' 
                        : 'border-gray-600 hover:border-gray-400'
                    } cursor-pointer`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(index);
                    }}
                  >
                    {completed[index] && <FaCheck className="text-sm text-primary-text" />}
                  </div>
                  
                  <div className={`font-medium ${
                    completed[index] ? 'text-secondary-text' : 'text-primary-text'
                  }`}>
                    {practice || `Practice ${index + 1}`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-secondary-text">
                <FaClock className="mr-2 text-xs" />
                <span>
                  {index === currentIndex && timeLeft > 0 
                    ? formatTime(timeLeft) 
                    : formatTime(durations[index] || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepDisplay;
