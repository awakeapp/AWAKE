import { fetchAndActivate, getValue, getBoolean, getString, getNumber } from 'firebase/remote-config';
import { remoteConfig } from './firebase';

/**
 * Fetch and activate remote config
 * @returns {Promise<boolean>} Whether config was successfully fetched
 */
export const initRemoteConfig = async () => {
  if (!remoteConfig) return false;
  
  try {
    // Set minimum fetch interval (1 hour in production, 0 in development)
    remoteConfig.settings = {
      minimumFetchIntervalMillis: import.meta.env.DEV ? 0 : 3600000,
      fetchTimeoutMillis: 60000
    };
    
    const activated = await fetchAndActivate(remoteConfig);
    console.log('Remote config fetched:', activated);
    return activated;
  } catch (error) {
    console.error('Remote config error:', error);
    return false;
  }
};

/**
 * Get a boolean config value
 * @param {string} key - Config key
 * @returns {boolean} Config value
 */
export const getConfigBoolean = (key) => {
  if (!remoteConfig) return remoteConfig?.defaultConfig?.[key] ?? false;
  
  try {
    return getBoolean(remoteConfig, key);
  } catch (error) {
    console.error('Remote config error:', error);
    return remoteConfig?.defaultConfig?.[key] ?? false;
  }
};

/**
 * Get a string config value
 * @param {string} key - Config key
 * @returns {string} Config value
 */
export const getConfigString = (key) => {
  if (!remoteConfig) return remoteConfig?.defaultConfig?.[key] ?? '';
  
  try {
    return getString(remoteConfig, key);
  } catch (error) {
    console.error('Remote config error:', error);
    return remoteConfig?.defaultConfig?.[key] ?? '';
  }
};

/**
 * Get a number config value
 * @param {string} key - Config key
 * @returns {number} Config value
 */
export const getConfigNumber = (key) => {
  if (!remoteConfig) return remoteConfig?.defaultConfig?.[key] ?? 0;
  
  try {
    return getNumber(remoteConfig, key);
  } catch (error) {
    console.error('Remote config error:', error);
    return remoteConfig?.defaultConfig?.[key] ?? 0;
  }
};

/**
 * Get any config value
 * @param {string} key - Config key
 * @returns {any} Config value
 */
export const getConfigValue = (key) => {
  if (!remoteConfig) return remoteConfig?.defaultConfig?.[key];
  
  try {
    const value = getValue(remoteConfig, key);
    return value.asString();
  } catch (error) {
    console.error('Remote config error:', error);
    return remoteConfig?.defaultConfig?.[key];
  }
};

// Predefined config getters

export const isAIChatEnabled = () => getConfigBoolean('enable_ai_chat');
export const isFinanceEnabled = () => getConfigBoolean('enable_finance');
export const isVehiclesEnabled = () => getConfigBoolean('enable_vehicles');
export const isConfettiEnabled = () => getConfigBoolean('enable_confetti');
export const getDailyQuote = () => getConfigString('daily_quote');
export const getMaxTasksPerDay = () => getConfigNumber('max_tasks_per_day');
export const getMaxHabits = () => getConfigNumber('max_habits');
