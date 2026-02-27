/**
 * Service for location-related operations using Google Maps Geocoding API.
 */

// We use the Google Maps API Key from environment variables.
// Fallback to Firebase API key if they use the same one, but a dedicated one is recommended.
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY;
const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Reverse geocode latitude and longitude into a structured location name.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Structured location data
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        if (!GOOGLE_MAPS_API_KEY) throw new Error("Google Maps API Key missing");

        const url = `${GOOGLE_GEOCODE_URL}?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Failed to fetch location details');

        const data = await response.json();
        
        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
            throw new Error(`Geocoding failed: ${data.status}`);
        }

        // Parse Google's address components
        const addressComponents = data.results[0].address_components;
        let city = '';
        let state = '';
        let country = '';

        let sublocality = '';
        for (let i = 0; i < addressComponents.length; i++) {
            const types = addressComponents[i].types;
            if (types.includes('sublocality') || types.includes('neighborhood')) {
                sublocality = addressComponents[i].long_name;
            }
            if (types.includes('locality')) {
                city = addressComponents[i].long_name;
            } else if (!city && types.includes('administrative_area_level_2')) {
                city = addressComponents[i].long_name; 
            }
            if (types.includes('administrative_area_level_1')) {
                state = addressComponents[i].long_name;
            }
            if (types.includes('country')) {
                country = addressComponents[i].long_name;
            }
        }

        const mainPart = sublocality || city || state || 'Unknown';
        const displayName = [mainPart, state, country]
            .filter(Boolean)
            .filter((item, i, arr) => i === 0 || item !== arr[i - 1]) // Deduplicate adjacent
            .join(', ');

        return {
            city: mainPart,
            state,
            country,
            displayName,
            raw: data.results[0]
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
        if (!GOOGLE_MAPS_API_KEY) throw new Error("Google Maps API Key missing");

        const url = `${GOOGLE_GEOCODE_URL}?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        
        if (data.status !== 'OK' || !data.results) {
            return [];
        }

        return data.results.map(item => {
            let city = '';
            let state = '';
            let country = '';

            const components = item.address_components || [];
            for (let i = 0; i < components.length; i++) {
                const types = components[i].types;
                if (types.includes('locality')) {
                    city = components[i].long_name;
                } else if (!city && types.includes('administrative_area_level_2')) {
                    city = components[i].long_name;
                }
                if (types.includes('administrative_area_level_1')) {
                    state = components[i].long_name;
                }
                if (types.includes('country')) {
                    country = components[i].long_name;
                }
            }

            const mainPart = item.address_components?.find(c => 
                c.types.includes('sublocality') || 
                c.types.includes('neighborhood') || 
                c.types.includes('point_of_interest')
            )?.long_name || city || item.formatted_address.split(',')[0] || '';
            
            const displayName = item.formatted_address || [mainPart, state, country].filter(Boolean).join(', ');

            return {
                lat: item.geometry.location.lat,
                lng: item.geometry.location.lng,
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
