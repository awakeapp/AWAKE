/**
 * Utility functions for handling numeric coercion and currency formatting.
 * Centralizes the logic to prevent NaN injection and floating-point drift.
 */

/**
 * Safely parses any value into a float, defaulting to 0 if invalid.
 * Prevents NaN propagation in calculations.
 * 
 * @param {any} value - The raw value to parse
 * @returns {number} The parsed float, or 0
 */
export const parseFloatSafe = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    
    // Convert to string and remove common formatting characters (commas, spaces, currency symbols)
    const stringValue = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
    
    const parsed = parseFloat(stringValue);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Rounds a number to a specified number of decimal places (default 2)
 * to combat Javascript floating-point math issues (e.g., 0.1 + 0.2 = 0.30000000000000004).
 *
 * @param {number|string} value - The value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} The rounded number
 */
export const roundFloat = (value, decimals = 2) => {
    const num = parseFloatSafe(value);
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};

/**
 * Formats a given numeric value into an Indian Rupee string (e.g., "1,50,000").
 * Will automatically drop decimal places if it is an exact integer.
 *
 * @param {number|string} value - The value to format
 * @param {boolean} includeSymbol - Whether to prepend the ₹ symbol
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (value, includeSymbol = false) => {
    const num = roundFloat(value);
    
    // Check if it's an integer to avoid showing .00 unnecessarily
    const isInteger = num % 1 === 0;
    
    const formattedStr = num.toLocaleString('en-IN', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: 2
    });

    return includeSymbol ? `₹${formattedStr}` : formattedStr;
};

/**
 * Standard rounding for general integers rather than precise financial amounts.
 * Useful for counts, odometer readings, etc.
 * 
 * @param {any} value - The raw value to parse
 * @returns {number} The parsed integer, or 0
 */
export const parseIntSafe = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const stringValue = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
    const parsed = parseInt(stringValue, 10);
    return isNaN(parsed) ? 0 : parsed;
};
