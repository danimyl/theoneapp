/**
 * STEP SERVICE (MOBILE)
 * =====================
 * 
 * Purpose:
 * This service provides access to step data in the mobile application.
 * It is designed to be a drop-in replacement for the web app's stepService,
 * maintaining the same API while optimizing for mobile performance.
 * 
 * Data Source:
 * The data is sourced from steps.json, which is synchronized from the web app
 * using the data synchronization script. This ensures the mobile app always
 * has the most up-to-date data while maintaining a clear separation of concerns.
 * 
 * Performance Considerations:
 * - Lazy loading of step data to minimize memory usage
 * - Caching of frequently accessed steps
 * - Preloading of adjacent steps for smoother navigation
 * 
 * Usage:
 * import stepService from '../services/stepService';
 * 
 * // Get all step titles (lightweight)
 * const allSteps = stepService.getAllStepTitles();
 * 
 * // Get full data for a specific step
 * const step = stepService.getStepById(1);
 */

// Import the steps data that has been synchronized from the web app
import stepsData from '../data/steps.json';

/**
 * Step interface defining the structure of a step
 */
export interface Step {
  id: number;
  title: string;
  instructions: string;
  practices: string[];
  durations: number[];
  hourly: boolean;
}

/**
 * Lightweight step title interface for dropdown/list display
 */
export interface StepTitle {
  id: number;
  title: string;
  hourly: boolean;
}

/**
 * Extract minimal data for all steps (just titles and IDs for dropdown)
 * This is done once at import time to avoid repeated processing
 */
const stepTitles: StepTitle[] = stepsData.steps.map((step: any) => ({
  id: step.id,
  title: step.title,
  hourly: step.hourly || false // Keep hourly flag for quick reference
}));

/**
 * Store for full step data that's already been loaded
 * This cache improves performance by avoiding repeated parsing of the same step
 */
const loadedStepsCache = new Map<number, Step>();

/**
 * Service to manage step data with lazy loading
 * This follows the same pattern as the web app's stepService
 * but with TypeScript typing and mobile-specific optimizations
 */
const stepService = {
  /**
   * Get minimal data for all steps (for dropdown/list display)
   * This is lightweight and can be called frequently
   * 
   * @returns {StepTitle[]} Array of objects with id and title
   */
  getAllStepTitles: (): StepTitle[] => {
    return stepTitles;
  },

  /**
   * Get the total number of steps
   * 
   * @returns {number} Total steps count
   */
  getTotalStepsCount: (): number => {
    return stepTitles.length;
  },

  /**
   * Get full data for a specific step by ID
   * This will load from cache if available or fetch the complete data if needed
   * 
   * @param {number} stepId The ID of the step to get
   * @returns {Step | undefined} The complete step data or undefined if not found
   */
  getStepById: (stepId: number): Step | undefined => {
    // Check if we already have this step in cache
    if (loadedStepsCache.has(stepId)) {
      return loadedStepsCache.get(stepId);
    }

    // Not in cache, get the full data from the imported data
    const fullStepData = stepsData.steps.find((step: any) => step.id === stepId);
    
    // Store in cache for future use
    if (fullStepData) {
      loadedStepsCache.set(stepId, fullStepData as Step);
    }
    
    return fullStepData as Step | undefined;
  },

  /**
   * Preload the next step into cache (for smoother experience)
   * Call this when a user is viewing a step to prepare for navigation
   * 
   * @param {number} currentStepId The current step ID
   */
  preloadNextStep: (currentStepId: number): void => {
    const nextStepId = currentStepId + 1;
    if (nextStepId <= stepTitles.length && !loadedStepsCache.has(nextStepId)) {
      // Load into cache but don't return
      stepService.getStepById(nextStepId);
    }
  },

  /**
   * Preload the previous step into cache (for smoother experience)
   * Call this when a user is viewing a step to prepare for navigation
   * 
   * @param {number} currentStepId The current step ID
   */
  preloadPreviousStep: (currentStepId: number): void => {
    const prevStepId = currentStepId - 1;
    if (prevStepId >= 1 && !loadedStepsCache.has(prevStepId)) {
      // Load into cache but don't return
      stepService.getStepById(prevStepId);
    }
  },

  /**
   * Preload both adjacent steps (previous and next)
   * Convenience method for bidirectional navigation
   * 
   * @param {number} currentStepId The current step ID
   */
  preloadAdjacentSteps: (currentStepId: number): void => {
    stepService.preloadPreviousStep(currentStepId);
    stepService.preloadNextStep(currentStepId);
  },

  /**
   * Clear the cache to free memory (optional utility)
   * Use this when navigating away from the steps section
   * 
   * @param {number | null} exceptStepId Optional step ID to keep in cache
   */
  clearCache: (exceptStepId: number | null = null): void => {
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
  },

  /**
   * Get steps by range (for pagination or virtualized lists)
   * Returns a range of steps with full data
   * 
   * @param {number} startId The starting step ID
   * @param {number} count The number of steps to retrieve
   * @returns {Step[]} Array of steps in the specified range
   */
  getStepsByRange: (startId: number, count: number): Step[] => {
    const result: Step[] = [];
    const endId = Math.min(startId + count - 1, stepTitles.length);
    
    for (let id = startId; id <= endId; id++) {
      const step = stepService.getStepById(id);
      if (step) {
        result.push(step);
      }
    }
    
    return result;
  },

  /**
   * Search for steps by title (for search functionality)
   * Returns step titles that match the search query
   * 
   * @param {string} query The search query
   * @returns {StepTitle[]} Array of matching step titles
   */
  searchStepsByTitle: (query: string): StepTitle[] => {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return stepTitles.filter((step: StepTitle) => 
      step.title.toLowerCase().includes(normalizedQuery)
    );
  }
};

export default stepService;
