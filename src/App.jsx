import { useState, useEffect, useRef } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { FaHome, FaSearch, FaBook, FaHeart } from 'react-icons/fa';
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
        {/* Top bar with settings */}
        <header className="app-header">
          <div className="text-xl font-bold flex items-center">
            <span className="text-spotify-green mr-2">●</span> Steps
          </div>
          <div className="flex items-center">
            {currentStep && (
              <div className="hidden sm:block mr-4 text-secondary-text">
                Step {currentStepId} of {totalSteps}
              </div>
            )}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="ml-2 p-2 rounded-full bg-spotify-card hover:bg-spotify-card-hover text-primary-text transition-colors"
            >
              <IoSettingsOutline size={24} className="text-secondary-text hover:text-primary-text" />
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="app-main">
          {/* Step navigation */}
          <div className="card mb-6">
            <div className="p-4">
              <h2 className="text-lg font-bold text-primary-text mb-4">
                {currentStep ? currentStep.title : 'Select a Step'}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  value={currentStepId}
                  onChange={handleStepChange}
                  className="px-4 py-2 rounded-md bg-spotify-darker border border-gray-800 text-primary-text min-w-[200px] truncate focus:ring-spotify-green focus:border-spotify-green"
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
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentStepId === totalSteps}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleSetStepForToday}
                  className="btn-primary"
                >
                  Set as Today's Step
                </button>
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
      </div>
    </div>
  );
}

export default App;
