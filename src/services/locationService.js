/**
 * Service for location-related operations using free OpenStreetMap Nominatim API.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Reverse geocode latitude and longitude into a structured location name.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Structured location data
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&email=support@awakeapp.com`;
        const response = await fetch(url, {
            headers: { 
                'Accept-Language': 'en'
            }
        });

        if (!response.ok) throw new Error('Failed to fetch location details');

        const data = await response.json();
        const addr = data.address || {};

        // Extract structured components
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.city_district || addr.suburb || addr.neighbourhood || addr.county || '';
        const state = addr.state || '';
        const country = addr.country || '';

        // Prioritize city name for mainPart
        const mainPart = city || state || 'Unknown';
        const displayName = [mainPart, state, country]
            .filter(Boolean)
            .filter((item, i, arr) => i === 0 || item !== arr[i - 1]) // Deduplicate adjacent
            .join(', ');

        return {
            city: mainPart,
            state,
            country,
            displayName,
            raw: data
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        throw error;
    }
};

/**
 * Search for a location by query string.
 * @param {string} query - Search query
 * @returns {Promise<Array>} - List of location results
 */
export const searchLocation = async (query) => {
    if (!query || query.trim().length < 3) return [];

    try {
        const url = `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&email=support@awakeapp.com`;
        const response = await fetch(url, {
            headers: { 
                'Accept-Language': 'en'
            }
        });

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();

        return data.map(item => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
            const state = addr.state || '';
            const country = addr.country || '';
            const suburb = addr.suburb || addr.neighbourhood || '';

            const mainPart = city || suburb || state || '';
            const displayName = [mainPart, state, country]
                .filter(Boolean)
                .filter((p, i, a) => i === 0 || p !== a[i - 1])
                .join(', ') || item.display_name;

            return {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
                displayName,
                city: mainPart,
                state,
                country
            };
        });
    } catch (error) {
        console.error('Location search error:', error);
        throw error;
    }
};
