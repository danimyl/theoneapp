import { useState, useEffect, useRef } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { FaBook } from 'react-icons/fa';
import { GiFootprint } from 'react-icons/gi';
import SettingsMenu from './components/SettingsMenu';
import StepDisplay from './components/StepDisplay';
import stepService from './services/stepService';
import notificationService from './services/notificationService';
import useSettingsStore from './store/settingsStore';

function App() {
  const { 
    stepForToday, 
    setStepForToday, 
    alwaysHourlyReminders 
  } = useSettingsStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentStepId, setCurrentStepId] = useState(() => stepForToday || 1);
  const [currentStep, setCurrentStep] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to track the last hour we sent a notification
  const lastHourlyNotificationRef = useRef(null);
  
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

  // Set up hourly notification check
  useEffect(() => {
    const checkHourlyNotifications = () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      // If we've already sent a notification for this hour, don't send another
      if (lastHourlyNotificationRef.current === currentHour) {
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
          
          // Update the last hour we sent a notification
          lastHourlyNotificationRef.current = currentHour;
        }
      }
    };
    
    // Check for notifications immediately on mount and when dependencies change
    checkHourlyNotifications();
    
    // Set up interval to check every minute
    const intervalId = setInterval(checkHourlyNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [stepForToday, alwaysHourlyReminders]);

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

  return (
    <div className="app-container">
      {/* Main content area */}
      <div className="flex flex-col overflow-hidden min-h-screen">
        {/* Header removed completely */}

        {/* Content area */}
        <main className="app-main">
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
                      {step.hourly ? ' (Hourly)' : ''}
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
        </main>
        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        
        {/* Sticky Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-spotify-darker py-3 px-4 flex justify-around items-center border-t border-gray-800">
          <button 
            className="p-3 rounded-full hover:bg-spotify-card-hover text-secondary-text hover:text-primary-text transition-colors"
            aria-label="Steps"
          >
            <GiFootprint size={24} />
          </button>
          
          <button 
            className="p-3 rounded-full hover:bg-spotify-card-hover text-secondary-text hover:text-primary-text transition-colors"
            aria-label="Book"
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
