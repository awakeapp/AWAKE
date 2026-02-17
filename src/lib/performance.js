import { trace } from 'firebase/performance';
import { performance } from './firebase';

/**
 * Create and start a custom performance trace
 * @param {string} traceName - Name of the trace
 * @returns {object} Trace object with stop method
 */
export const startTrace = (traceName) => {
  if (!performance) {
    return { stop: () => {}, putMetric: () => {}, putAttribute: () => {} };
  }
  
  try {
    const perfTrace = trace(performance, traceName);
    perfTrace.start();
    return perfTrace;
  } catch (error) {
    console.error('Performance trace error:', error);
    return { stop: () => {}, putMetric: () => {}, putAttribute: () => {} };
  }
};

/**
 * Measure async operation performance
 * @param {string} traceName - Name of the trace
 * @param {Function} operation - Async operation to measure
 * @returns {Promise} Result of the operation
 */
export const measureAsync = async (traceName, operation) => {
  const perfTrace = startTrace(traceName);
  
  try {
    const result = await operation();
    perfTrace.stop();
    return result;
  } catch (error) {
    perfTrace.stop();
    throw error;
  }
};

/**
 * Measure sync operation performance
 * @param {string} traceName - Name of the trace
 * @param {Function} operation - Sync operation to measure
 * @returns {any} Result of the operation
 */
export const measureSync = (traceName, operation) => {
  const perfTrace = startTrace(traceName);
  
  try {
    const result = operation();
    perfTrace.stop();
    return result;
  } catch (error) {
    perfTrace.stop();
    throw error;
  }
};

// Predefined traces for common operations

export const traceFirestoreRead = () => startTrace('firestore_read');
export const traceFirestoreWrite = () => startTrace('firestore_write');
export const traceDataLoad = () => startTrace('data_load');
export const traceTaskOperation = () => startTrace('task_operation');
export const traceHabitOperation = () => startTrace('habit_operation');
