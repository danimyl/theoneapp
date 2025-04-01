/**
 * TimerEngine
 * 
 * A simple JavaScript timer implementation that runs independently of React's rendering cycle.
 * Uses setInterval for timing and avoids the issues with React components.
 */

export class TimerEngine {
  private intervalId: NodeJS.Timeout | null = null;
  private endTime: number = 0;
  private pausedTimeRemaining: number = 0;
  private durationSeconds: number = 0;
  private isActive: boolean = false;
  private isPaused: boolean = false;
  private onTick: (timeLeftSeconds: number, progress: number) => void;
  private onComplete: () => void;
  private lastTickTime: number = 0;

  /**
   * Create a new TimerEngine
   * 
   * @param onTick Callback function that receives the current time left (in seconds) and progress
   * @param onComplete Callback function that is called when the timer completes
   */
  constructor(
    onTick: (timeLeftSeconds: number, progress: number) => void,
    onComplete: () => void
  ) {
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  /**
   * Start the timer with a new duration
   * 
   * @param durationSeconds Duration in seconds
   */
  start(durationSeconds: number): void {
    // Clear any existing interval
    this.clearInterval();
    
    console.log('[TIMER_ENGINE] Starting timer with duration:', durationSeconds, 'seconds');
    
    this.durationSeconds = durationSeconds;
    this.endTime = Date.now() + (durationSeconds * 1000);
    this.isActive = true;
    this.isPaused = false;
    this.lastTickTime = Date.now();
    
    // Start the interval
    this.intervalId = setInterval(() => this.tick(), 500);
    
    // Immediately call tick once to update UI
    this.tick();
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (this.isActive && !this.isPaused) {
      console.log('[TIMER_ENGINE] Pausing timer');
      this.isPaused = true;
      this.pausedTimeRemaining = this.getTimeRemainingSeconds();
      this.isActive = false;
      this.clearInterval();
    }
  }

  /**
   * Resume a paused timer
   */
  resume(): void {
    if (this.isPaused) {
      console.log('[TIMER_ENGINE] Resuming timer with', this.pausedTimeRemaining, 'seconds remaining');
      this.endTime = Date.now() + (this.pausedTimeRemaining * 1000);
      this.isActive = true;
      this.isPaused = false;
      this.lastTickTime = Date.now();
      
      // Start the interval
      this.intervalId = setInterval(() => this.tick(), 500);
      
      // Immediately call tick once to update UI
      this.tick();
    }
  }

  /**
   * Stop the timer completely
   */
  stop(): void {
    console.log('[TIMER_ENGINE] Stopping timer');
    this.isActive = false;
    this.isPaused = false;
    this.clearInterval();
  }

  /**
   * Resume from a specific time value
   * 
   * @param timeRemainingSeconds Time remaining in seconds
   */
  resumeFromTime(timeRemainingSeconds: number): void {
    // Clear any existing interval
    this.clearInterval();
    
    console.log('[TIMER_ENGINE] Resuming from specific time:', timeRemainingSeconds, 'seconds');
    
    this.durationSeconds = timeRemainingSeconds;
    this.endTime = Date.now() + (timeRemainingSeconds * 1000);
    this.isActive = true;
    this.isPaused = false;
    this.lastTickTime = Date.now();
    
    // Start the interval
    this.intervalId = setInterval(() => this.tick(), 500);
    
    // Immediately call tick once to update UI
    this.tick();
  }

  /**
   * Get the current state of the timer
   */
  getState(): { isActive: boolean; isPaused: boolean; timeLeftSeconds: number; progress: number } {
    const timeLeftSeconds = this.isPaused ? this.pausedTimeRemaining : this.getTimeRemainingSeconds();
    const progress = this.durationSeconds > 0 ? 1 - timeLeftSeconds / this.durationSeconds : 0;
    
    return {
      isActive: this.isActive,
      isPaused: this.isPaused,
      timeLeftSeconds,
      progress
    };
  }

  /**
   * Calculate the time remaining in seconds
   */
  private getTimeRemainingSeconds(): number {
    if (!this.isActive && !this.isPaused) return 0;
    if (this.isPaused) return this.pausedTimeRemaining;
    
    const remainingMs = Math.max(0, this.endTime - Date.now());
    return Math.ceil(remainingMs / 1000);
  }

  /**
   * Calculate the current progress (0 to 1)
   */
  private getProgress(): number {
    if (this.durationSeconds === 0) return 0;
    return 1 - this.getTimeRemainingSeconds() / this.durationSeconds;
  }

  /**
   * Clear the interval
   */
  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Internal tick function that updates the timer state
   */
  private tick(): void {
    if (!this.isActive) return;

    const now = Date.now();
    // Only update if at least 100ms have passed since last tick
    if (now - this.lastTickTime < 100) {
      return;
    }
    
    this.lastTickTime = now;
    const timeLeftSeconds = this.getTimeRemainingSeconds();
    const progress = this.getProgress();

    // Call the onTick callback with the current state
    this.onTick(timeLeftSeconds, progress);

    // Check if the timer has completed
    if (timeLeftSeconds <= 0) {
      console.log('[TIMER_ENGINE] Timer completed');
      this.isActive = false;
      this.clearInterval();
      this.onComplete();
    }
  }
}
