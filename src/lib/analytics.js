import { logEvent, setUserProperties, setUserId } from 'firebase/analytics';
import { analytics } from './firebase';

/**
 * Log a custom analytics event
 * @param {string} eventName - Name of the event
 * @param {object} eventParams - Event parameters
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!analytics) return;
  
  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Track screen/page views
 * @param {string} screenName - Name of the screen
 */
export const trackScreenView = (screenName) => {
  if (!analytics) return;
  
  try {
    logEvent(analytics, 'screen_view', {
      firebase_screen: screenName,
      firebase_screen_class: screenName
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Set user ID for analytics
 * @param {string} userId - User ID
 */
export const setAnalyticsUserId = (userId) => {
  if (!analytics) return;
  
  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Set user properties
 * @param {object} properties - User properties
 */
export const setAnalyticsUserProperties = (properties) => {
  if (!analytics) return;
  
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Predefined event tracking functions

export const trackLogin = (method = 'email') => {
  trackEvent('login', { method });
};

export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', { method });
};

export const trackLogout = () => {
  trackEvent('logout');
};

export const trackTaskCreated = (category = 'general') => {
  trackEvent('task_created', { category });
};

export const trackTaskCompleted = (taskId) => {
  trackEvent('task_completed', { task_id: taskId });
};

export const trackTaskDeleted = (taskId) => {
  trackEvent('task_deleted', { task_id: taskId });
};

export const trackHabitCreated = (habitType) => {
  trackEvent('habit_created', { type: habitType });
};

export const trackHabitUpdated = (habitId, value) => {
  trackEvent('habit_updated', { habit_id: habitId, value });
};

export const trackHabitDeleted = (habitId) => {
  trackEvent('habit_deleted', { habit_id: habitId });
};

export const trackDaySubmitted = (score) => {
  trackEvent('day_submitted', { score });
};

export const trackTransactionAdded = (type, amount) => {
  trackEvent('transaction_added', { type, amount });
};

export const trackTransactionDeleted = (transactionId) => {
  trackEvent('transaction_deleted', { transaction_id: transactionId });
};

export const trackPDFExported = (type = 'general') => {
  trackEvent('pdf_exported', { type });
};

export const trackChatMessage = () => {
  trackEvent('chat_message_sent');
};
