import { useState, useEffect } from 'react';

/**
 * Custom hook for managing practice timer functionality
 * 
 * @param {Object} options Timer configuration options
 * @param {number} options.initialDuration Initial duration in seconds
 * @param {Function} options.onComplete Callback function when timer completes
 * @returns {Object} Timer state and control functions
 */
const useTimer = ({ initialDuration = 0, onComplete = () => {} }) => {
  const [remainingTime, setRemainingTime] = useState(initialDuration);
  const [isRunning, setIsRunning] = useState(false);

  // Reset timer when initial duration changes
  useEffect(() => {
    setRemainingTime(initialDuration);
    setIsRunning(false);
  }, [initialDuration]);

  // Handle timer countdown
  useEffect(() => {
    let intervalId;
    
    if (isRunning && remainingTime > 0) {
      intervalId = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Clear the interval and call onComplete when timer reaches 0
            clearInterval(intervalId);
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, remainingTime, onComplete]);

  // Format time as MM:SS
  const formattedTime = `${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}`;

  // Control functions
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = (newDuration = initialDuration) => {
    setIsRunning(false);
    setRemainingTime(newDuration);
  };
  const toggleTimer = () => setIsRunning(prev => !prev);

  return {
    remainingTime,
    formattedTime,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleTimer
  };
};

export default useTimer;