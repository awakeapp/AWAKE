// js/config.js

const Config = {
    API_URL: 'https://script.google.com/macros/s/AKfycbwcWspJ2bZSEv2TUOuJWWl1P0ATYvVHr9pZXqvjUQcDYn3ixcG3SRaXrFnAg2_0c4iewg/exec', // Deployed Web App URL

    // Key used for localStorage
    SESSION_KEY: 'awake_session_token',

    // Routes
    ROUTES: {
        LOGIN: '/login.html',
        DASHBOARD: '/dashboard.html',
        SIGNUP: '/signup.html'
    }
};

// Prevent modification
Object.freeze(Config);
