
const API_URL = import.meta.env.VITE_API_URL;

export const api = {
    /**
     * Fetch all data from the Google Sheet
     */
    async fetchAll() {
        if (!API_URL) {
            console.warn("API_URL not set, using local fallback/mock if available.");
            return null;
        }

        try {
            const res = await fetch(API_URL, {
                method: 'GET',
                redirect: 'follow'
            });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("API Fetch Error:", error);
            throw error;
        }
    },

    /**
     * Send mutations to the Google Sheet
     * @param {object} payload - { mutations: [], logs: [] }
     */
    async sync(payload) {
        if (!API_URL) return { success: false, error: "No API URL" };

        try {
            // GAS requires text/plain or specific headers to avoid complex CORS preflight issues sometimes,
            // but 'no-cors' mode obscures the response. 
            // We use standard fetch with redirect: follow.
            // We rely on the GAS script being deployed as "Who has access: Anyone".

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload),
                redirect: 'follow'
            });

            const data = await res.json();
            return data;
        } catch (error) {
            console.error("API Sync Error:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Authenticate with the Google Apps Script Backend
     * @param {string} action - 'signIn', 'signUp', 'verifySignUpOTP', 'validateSession'
     * @param {object} payload - Action specific data
     */
    async auth(action, payload) {
        if (!API_URL) return { success: false, error: "No API URL" };
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action, payload }),
                redirect: 'follow'
            });
            return await res.json();
        } catch (error) {
            console.error("Auth API Error:", error);
            return { success: false, error: error.message };
        }
    }
};
