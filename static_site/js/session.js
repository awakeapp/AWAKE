// js/session.js

const Session = {
    // Save session token
    setToken: (token) => {
        if (!token) return;
        localStorage.setItem(Config.SESSION_KEY, token);
    },

    // Get session token
    getToken: () => {
        return localStorage.getItem(Config.SESSION_KEY);
    },

    // Clear session and redirect
    clear: (redirect = true) => {
        localStorage.removeItem(Config.SESSION_KEY);
        if (redirect) {
            window.location.href = Config.ROUTES.LOGIN;
        }
    },

    // Check if user is theoretically logged in (existence of token)
    // Real validation happens via API calls
    hasToken: () => {
        return !!localStorage.getItem(Config.SESSION_KEY);
    },

    // Initialize session listeners (Cross-tab logout)
    init: () => {
        window.addEventListener('storage', (event) => {
            if (event.key === Config.SESSION_KEY && !event.newValue) {
                // Token removed in another tab
                window.location.href = Config.ROUTES.LOGIN;
            }
        });
    },

    // HOC-like function for protected pages
    requireAuth: async () => {
        const token = Session.getToken();
        if (!token) {
            Session.clear(true);
            return;
        }

        // Optional: validate token immediately on page load
        // For performance, we might skip this and let the first API call fail, 
        // but strict security prefers validation.
        try {
            await API.post('validateSession', { sessionId: token });
        } catch (e) {
            console.warn('Session invalid on load:', e);
            Session.clear(true);
        }
    }
};

// Initialize listeners immediately
Session.init();
