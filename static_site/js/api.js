// js/api.js

const API = {
    post: async (action, payload = {}) => {
        const url = Config.API_URL;

        // Prepare request body
        const body = {
            action: action,
            payload: payload
        };

        // Note: We cannot send custom headers (like Authorization) easily 
        // with GAS Web Apps due to CORS preflight requirements in some environments.
        // Instead, we include the session token in the payload if it exists.
        const token = Session.getToken();
        if (token) {
            body.payload.sessionId = token;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                // executing as 'text/plain' to avoid CORS preflight OPTIONS request on GAS
                // GAS handles raw post data fine.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!result.success) {
                // Handle specific error codes
                if (result.error.code === 'SESSION_EXPIRED' ||
                    result.error.code === 'SESSION_REVOKED' ||
                    result.error.code === 'INVALID_SESSION') {
                    Session.clear(true);
                    throw new Error('Session Expired');
                }

                // Allow caller to handle other errors
                const err = new Error(result.error.message || 'Unknown Error');
                err.code = result.error.code;
                throw err;
            }

            return result.data;

        } catch (error) {
            // Distinguish network errors from API errors
            if (error.message === 'Failed to fetch') {
                throw new Error('Network error. Please checks connection.');
            }
            throw error;
        }
    }
};
