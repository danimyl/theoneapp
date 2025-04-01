/**
 * Type declarations for steps.json
 * 
 * This file provides TypeScript type definitions for the steps.json data file,
 * allowing TypeScript to understand the structure of the imported JSON.
 */

declare module '../data/steps.json' {
  export interface Step {
    id: number;
    title: string;
    instructions: string;
    practices: string[];
    durations: number[];
    hourly: boolean;
  }

  export interface StepsData {
    steps: Step[];
  }

  const data: StepsData;
  export default data;
}
