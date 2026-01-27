// js/auth.js

const Auth = {
    // State helpers
    setLoading: (form, isLoading) => {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = isLoading;
            const originalText = btn.getAttribute('data-text') || btn.innerText;
            if (isLoading) {
                btn.setAttribute('data-text', originalText);
                btn.innerText = 'Processing...';
                btn.classList.add('loading');
            } else {
                btn.innerText = originalText;
                btn.classList.remove('loading');
            }
        }
    },

    setError: (form, message) => {
        const errorEl = form.querySelector('.form-error');
        if (errorEl) {
            errorEl.innerText = message || '';
            errorEl.style.display = message ? 'block' : 'none';
        }
    },

    // ---- Flows ----

    signIn: async (form) => {
        const identifier = form.identifier.value.trim();
        const password = form.password.value;

        try {
            Auth.setError(form, null);
            Auth.setLoading(form, true);

            const data = await API.post('signIn', {
                identifier: identifier,
                password: password
            });

            // Success
            Session.setToken(data.sessionId);
            window.location.href = Config.ROUTES.DASHBOARD;

        } catch (e) {
            Auth.setError(form, e.message);
        } finally {
            Auth.setLoading(form, false);
        }
    },

    signUp: async (form) => {
        const email = form.email.value.trim();
        const phone = form.phone.value.trim();
        const username = form.username.value.trim();
        const password = form.password.value;

        // Simple client-side validation
        if (password.length < 8) {
            Auth.setError(form, "Password must be at least 8 characters");
            return;
        }

        try {
            Auth.setError(form, null);
            Auth.setLoading(form, true);

            const data = await API.post('signUp', {
                email, phone, username, password
            });

            // If success, we receive a message (and in dev mode, maybe the otp)
            // Switch to OTP view
            localStorage.setItem('temp_signup_identifier', email || phone || username);
            window.location.href = '/verify-otp.html?type=signup';

        } catch (e) {
            Auth.setError(form, e.message);
        } finally {
            Auth.setLoading(form, false);
        }
    },

    verifyOtp: async (form, purpose) => {
        const otp = form.otp.value.trim();
        const identifier = localStorage.getItem('temp_signup_identifier');

        if (!identifier) {
            Auth.setError(form, "Session lost. Please restart.");
            return;
        }

        try {
            Auth.setError(form, null);
            Auth.setLoading(form, true);

            const action = purpose === 'signup' ? 'verifySignUpOTP' : 'verifyResetOTP';

            await API.post(action, {
                identifier: identifier,
                otp: otp
            });

            // Success
            if (purpose === 'signup') {
                // Redirect to login after verification
                alert('Account verified! Please log in.');
                window.location.href = Config.ROUTES.LOGIN;
            } else {
                // Redirect to new password reset page
                window.location.href = '/reset-password.html';
            }

        } catch (e) {
            Auth.setError(form, e.message);
        } finally {
            Auth.setLoading(form, false);
        }
    },

    signOut: () => {
        // Optimistically clear local state
        const token = Session.getToken();
        Session.clear(false); // don't redirect yet

        // Inform backend
        if (token) {
            // We verify session first inside API.post but signOut might not need return
            // We use fetch directly to avoid loops if token is bad
            const url = Config.API_URL;
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'signOut',
                    payload: { sessionId: token }
                })
            }).finally(() => {
                window.location.href = Config.ROUTES.LOGIN;
            });
        } else {
            window.location.href = Config.ROUTES.LOGIN;
        }
    }
};

// UI Helpers (Show/Hide Password)
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.closest('.input-group').querySelector('input');
            if (input.type === 'password') {
                input.type = 'text';
                e.target.textContent = 'Hide';
            } else {
                input.type = 'password';
                e.target.textContent = 'Show';
            }
        });
    });

    // Auto-setup forms based on ID
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); Auth.signIn(loginForm); });

    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.addEventListener('submit', (e) => { e.preventDefault(); Auth.signUp(signupForm); });

    const otpForm = document.getElementById('otp-form');
    if (otpForm) otpForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type') || 'signup';
        Auth.verifyOtp(otpForm, type);
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); Auth.signOut(); });
});
