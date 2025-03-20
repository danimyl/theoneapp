import allStepsData from '../data/steps.json';

// Extract minimal data for all steps (just titles and IDs for dropdown)
const stepTitles = allStepsData.steps.map(step => ({
  id: step.id,
  title: step.title,
  hourly: step.hourly || false // Keep hourly flag for quick reference
}));

// Store for full step data that's already been loaded
const loadedStepsCache = new Map();

/**
 * Service to manage step data with lazy loading
 */
const stepService = {
  /**
   * Get minimal data for all steps (for dropdown)
   * @returns {Array} Array of objects with id and title
   */
  getAllStepTitles: () => {
    return stepTitles;
  },

  /**
   * Get the total number of steps
   * @returns {number} Total steps count
   */
  getTotalStepsCount: () => {
    return stepTitles.length;
  },

  /**
   * Get full data for a specific step by ID
   * This will load from cache if available or fetch the complete data if needed
   * @param {number} stepId The ID of the step to get
   * @returns {Object} The complete step data
   */
  getStepById: (stepId) => {
    // Check if we already have this step in cache
    if (loadedStepsCache.has(stepId)) {
      return loadedStepsCache.get(stepId);
    }

    // Not in cache, get the full data from the imported data
    const fullStepData = allStepsData.steps.find(step => step.id === stepId);
    
    // Store in cache for future use
    if (fullStepData) {
      loadedStepsCache.set(stepId, fullStepData);
    }
    
    return fullStepData;
  },

  /**
   * Preload the next step into cache (for smoother experience)
   * @param {number} currentStepId The current step ID
   */
  preloadNextStep: (currentStepId) => {
    const nextStepId = currentStepId + 1;
    if (nextStepId <= stepTitles.length && !loadedStepsCache.has(nextStepId)) {
      // Load into cache but don't return
      stepService.getStepById(nextStepId);
    }
  },

  /**
   * Clear the cache to free memory (optional utility)
   * @param {number} exceptStepId Optional step ID to keep in cache
   */
  clearCache: (exceptStepId = null) => {
    if (exceptStepId !== null) {
      // Keep only the specified step
      const stepToKeep = loadedStepsCache.get(exceptStepId);
      loadedStepsCache.clear();
      if (stepToKeep) {
        loadedStepsCache.set(exceptStepId, stepToKeep);
      }
    } else {
      // Clear everything
      loadedStepsCache.clear();
    }
  }
};

export default stepService;