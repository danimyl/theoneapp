import { useState, useEffect, useRef } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { FaBook, FaCheck, FaTimes } from 'react-icons/fa';
import { GiFootprint } from 'react-icons/gi';
import SettingsMenu from './components/SettingsMenu';
import StepDisplay from './components/StepDisplay';
import BookMenu from './components/BookMenu';
import BookDisplay from './components/BookDisplay';
import SecretModal from './components/SecretModal';
import stepService from './services/stepService';
import notificationService from './services/notificationService';
import useSettingsStore from './store/settingsStore';
import useBookStore from './store/bookStore';
import practiceReminders from './data/practice-reminders.json';
import secrets from './data/secrets.json';
import './light-theme.css';

function App() {
  const { 
    stepForToday, 
    setStepForToday, 
    alwaysHourlyReminders,
    theme,
    lastStepAdvanceDate,
    setLastStepAdvanceDate,
    lastSecretShownDate,
    setLastSecretShownDate
  } = useSettingsStore();
  
  const {
    isBookMenuOpen,
    toggleBookMenu,
    openBookMenu,
    closeBookMenu
  } = useBookStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(() => stepForToday || 1);
  const [currentStep, setCurrentStep] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('steps'); // 'steps' or 'book'
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [currentSecret, setCurrentSecret] = useState('');
  
  // Refs to track the last time we sent a notification and advanced the step
  const lastHourlyNotificationRef = useRef(null);
  const lastStepAdvanceRef = useRef(null);
  const practiceReminderTimeRef = useRef(null);
  const lastPracticeReminderDateRef = useRef(null);
  
  const stepTitles = stepService.getAllStepTitles();
  const totalSteps = stepService.getTotalStepsCount();

  // Load current step data when ID changes
  useEffect(() => {
    setIsLoading(true);
    const step = stepService.getStepById(currentStepId);
    setCurrentStep(step);
    setIsLoading(false);
    
    // Preload next and previous steps for smoother navigation
    if (currentStepId < totalSteps) {
      stepService.preloadNextStep(currentStepId);
    }
    if (currentStepId > 1) {
      stepService.getStepById(currentStepId - 1);
    }
  }, [currentStepId, totalSteps]);

  // Check if we should show the secret modal on app load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Simplified conditions for showing the secret:
    // 1. We haven't shown the secret modal today yet
    // 2. Either we have a lastStepAdvanceDate or this is the first time opening the app
    if (!lastSecretShownDate || lastSecretShownDate !== today) {
      // Get a random secret
      const randomIndex = Math.floor(Math.random() * secrets.length);
      const randomSecret = secrets[randomIndex].secret;
      
      // Set the current secret and open the modal
      setCurrentSecret(randomSecret);
      setIsSecretModalOpen(true);
      
      // Update the last secret shown date
      setLastSecretShownDate(today);
    }
  }, [lastStepAdvanceDate, lastSecretShownDate, setLastSecretShownDate]);
  
  // Function to manually show a secret (for testing)
  const showRandomSecret = () => {
    const randomIndex = Math.floor(Math.random() * secrets.length);
    const randomSecret = secrets[randomIndex].secret;
    setCurrentSecret(randomSecret);
    setIsSecretModalOpen(true);
  };

  // Set up a random time for practice reminder between 10:30 AM and 2:00 PM
  useEffect(() => {
    // Only set a new random time if we don't have one yet or it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (!practiceReminderTimeRef.current || lastPracticeReminderDateRef.current !== today) {
      // Generate random minutes between 10:30 AM (630 minutes) and 2:00 PM (840 minutes)
      const minMinutes = 10 * 60 + 30; // 10:30 AM in minutes
      const maxMinutes = 14 * 60; // 2:00 PM in minutes
      const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
      
      // Convert to hours and minutes
      const hours = Math.floor(randomMinutes / 60);
      const minutes = randomMinutes % 60;
      
      // Store the random time
      practiceReminderTimeRef.current = { hours, minutes };
      lastPracticeReminderDateRef.current = today;
    }
  }, []);

  // Set up hourly notification check, daily step advancement, and practice reminder
  useEffect(() => {
    const checkTimeBasedActions = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDay = now.getDate();
      const today = now.toISOString().split('T')[0];
      const { lastPracticeStartDate } = useSettingsStore.getState();
      
      // Only send hourly notifications exactly at xx:00
      if (currentMinute === 0) {
        // Create a key for the current hour to track if we've already sent a notification
        const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentHour}`;
        
        // If we've already sent a notification for this exact hour, don't send another
        if (lastHourlyNotificationRef.current === hourKey) {
          return;
        }
        
        // Check if we should send hourly notifications
        if (stepForToday) {
          const todayStep = stepService.getStepById(stepForToday);
          
          // Send notification if:
          // 1. The step has hourly:true, OR
          // 2. alwaysHourlyReminders is true
          if (todayStep && (todayStep.hourly || alwaysHourlyReminders)) {
            notificationService.sendStepReminder(
              todayStep.id, 
              todayStep.title
            );
            
            // Update the last hour we sent a notification with the exact hour key
            lastHourlyNotificationRef.current = hourKey;
          }
        }
      }
      
      // Advance step at 03:00 every day
      if (currentHour === 3 && currentMinute === 0) {
        // Create a key for today to track if we've already advanced the step today
        const dayKey = `${now.getFullYear()}-${now.getMonth()}-${currentDay}`;
        
        // If we've already advanced the step today, don't do it again
        if (lastStepAdvanceRef.current === dayKey) {
          return;
        }
        
        // Only advance if we have a step for today
        if (stepForToday !== null) {
          // Calculate the next step (wrap around to 1 if at the end)
          const nextStep = stepForToday < totalSteps ? stepForToday + 1 : 1;
          
          // Update the step for today
          setStepForToday(nextStep);
          
          // If the user is currently viewing today's step, update the current step too
          if (currentStepId === stepForToday) {
            setCurrentStepId(nextStep);
          }
          
          // Update the last day we advanced the step
          lastStepAdvanceRef.current = dayKey;
          
          // Record the date of step advancement in the store
          setLastStepAdvanceDate(new Date().toISOString().split('T')[0]);
        }
      }
      
      // Check if we should send a practice reminder
      if (practiceReminderTimeRef.current) {
        const { hours, minutes } = practiceReminderTimeRef.current;
        
        // If it's time for the practice reminder
        if (currentHour === hours && currentMinute === minutes) {
          // Create a key for today to track if we've already sent a practice reminder today
          const reminderKey = `practice-reminder-${today}`;
          
          // If we've already sent a reminder today, don't send another
          if (lastPracticeReminderDateRef.current === reminderKey) {
            return;
          }
          
          // Only send reminder if:
          // 1. We have a step for today
          // 2. The user hasn't started practice today
          if (stepForToday && lastPracticeStartDate !== today) {
            // Get a random reminder text
            const reminders = practiceReminders.reminders;
            const randomIndex = Math.floor(Math.random() * reminders.length);
            const reminderText = reminders[randomIndex];
            
            // Send the reminder notification
            notificationService.sendNotification(
              'Practice Reminder',
              { body: reminderText },
              true
            );
            
            // Update the last reminder date
            lastPracticeReminderDateRef.current = reminderKey;
          }
        }
      }
    };
    
    // Check immediately on mount and when dependencies change
    checkTimeBasedActions();
    
    // Set up interval to check every minute
    const intervalId = setInterval(checkTimeBasedActions, 60000);
    
    return () => clearInterval(intervalId);
  }, [stepForToday, alwaysHourlyReminders, currentStepId, totalSteps, setStepForToday, setLastStepAdvanceDate]);

  const handlePrevious = () => {
    if (currentStepId > 1) setCurrentStepId(currentStepId - 1);
  };

  const handleNext = () => {
    if (currentStepId < totalSteps) setCurrentStepId(currentStepId + 1);
  };

  const handleStepChange = (event) => {
    setCurrentStepId(parseInt(event.target.value, 10));
  };

  const handleSetStepForToday = () => {
    setStepForToday(currentStepId);
  };

  // Handle switching between Steps and Book views
  const handleViewChange = (view) => {
    setActiveView(view);
    // Close settings menu when switching views
    if (isSettingsOpen) setIsSettingsOpen(false);
    
    // Only close book menu when switching to steps view
    if (view === 'steps' && isBookMenuOpen) {
      closeBookMenu();
    }
  };

  // Apply theme class to root element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // Handle closing the secret modal
  const handleCloseSecretModal = () => {
    setIsSecretModalOpen(false);
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
      {/* Main content area */}
      <div className="flex flex-col overflow-hidden min-h-screen">
        {/* Content area */}
        <main className="app-main">
          {activeView === 'steps' ? (
            <>
              {/* Step navigation - more compact */}
              <div className="card mb-3 border border-gray-800 rounded-lg">
                <div className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                      value={currentStepId}
                      onChange={handleStepChange}
                      className="px-3 py-1.5 rounded-md bg-spotify-darker border border-gray-800 text-primary-text truncate focus:ring-spotify-green focus:border-spotify-green text-sm flex-1"
                    >
                      {stepTitles.map((step) => (
                        <option key={step.id} value={step.id} title={step.title}>
                          Step {step.id}: {step.title}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrevious}
                        disabled={currentStepId === 1}
                        className="px-3 py-1.5 rounded-full bg-secondary-button-500 text-primary-text text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-button-600 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={handleNext}
                        disabled={currentStepId === totalSteps}
                        className="px-3 py-1.5 rounded-full bg-secondary-button-500 text-primary-text text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-button-600 transition-colors"
                      >
                        Next
                      </button>
                      <button
                        onClick={handleSetStepForToday}
                        className="px-3 py-1.5 rounded-full bg-spotify-green text-primary-text text-sm font-medium hover:bg-spotify-green-hover transition-colors"
                      >
                        Set Today
                      </button>
                      {currentStep && (
                        <div className="flex items-center text-secondary-text text-sm px-3 py-1.5">
                          <span>
                            Hourly {currentStep.hourly ? (
                              <FaCheck className="text-sm ml-1 inline" style={{ color: '#1DB954' }} />
                            ) : (
                              <FaTimes className="text-sm ml-1 inline" style={{ color: '#FF4D4F' }} />
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step content */}
              {isLoading ? (
                <div className="p-6 bg-spotify-card rounded-lg animate-pulse">
                  <p className="text-secondary-text">Loading step content...</p>
                </div>
              ) : currentStep ? (
                <StepDisplay step={currentStep} stepForToday={stepForToday} />
              ) : (
                <p className="text-secondary-text">No step found.</p>
              )}
            </>
          ) : (
            /* Book content */
            <BookDisplay />
          )}
        </main>
        {/* Menus */}
        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        {/* Only show BookMenu when in Book view */}
        {activeView === 'book' && (
          <BookMenu isOpen={isBookMenuOpen} onClose={() => closeBookMenu()} />
        )}
        {/* Secret Modal */}
        <SecretModal 
          isOpen={isSecretModalOpen} 
          onClose={handleCloseSecretModal} 
          secret={currentSecret} 
        />
        
        {/* Debug button for testing - uncomment if needed
        <button
          onClick={showRandomSecret}
          className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
        >
          Show Secret
        </button>
        */}
        
        {/* Sticky Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-spotify-darker py-3 px-4 flex justify-around items-center border-t border-gray-800">
          <button 
            onClick={() => handleViewChange('steps')}
            className={`p-3 rounded-full hover:bg-spotify-card-hover ${
              activeView === 'steps' 
                ? 'text-spotify-green' 
                : 'text-secondary-text hover:text-primary-text'
            } transition-colors`}
            aria-label="Steps"
          >
            <GiFootprint size={24} />
          </button>
          
          <button 
            onClick={() => {
              handleViewChange('book');
              // Open the book menu from the left side
              openBookMenu();
            }}
            className={`p-3 rounded-full hover:bg-spotify-card-hover ${
              activeView === 'book' 
                ? 'text-spotify-green' 
                : 'text-secondary-text hover:text-primary-text'
            } transition-colors`}
            aria-label="The One Book"
          >
            <FaBook size={24} />
          </button>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 rounded-full hover:bg-spotify-card-hover text-secondary-text hover:text-primary-text transition-colors"
            aria-label="Settings"
          >
            <IoSettingsOutline size={24} />
          </button>
        </footer>
      </div>
    </div>
  );
}

export default App;
