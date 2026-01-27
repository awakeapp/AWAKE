import { useState } from 'react';
import { auth, sendPasswordResetEmail } from '../lib/firebase';

export const useResetPassword = () => {
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [success, setSuccess] = useState(false);

    const resetPassword = async (email) => {
        setError(null);
        setIsPending(true);
        setSuccess(false);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            setIsPending(false);
        } catch (err) {
            console.error(err);
            let errorMessage = "Failed to send reset email";
            if (err.code === 'auth/user-not-found') {
                // Security: usually we shouldn't reveal this, but for UX requests we often do. 
                // Standard security practice: "If that email exists, we sent a link."
                // But for this project's scope, let's keep it helpful or generic as per instructions?
                // Instructions: "Generic error messages".
                errorMessage = "If an account exists, a reset link has been sent.";
                // Actually returning success even if not found is the most secure way (User Enumeration prevention).
                setSuccess(true);
                setIsPending(false);
                return;
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = "Invalid email address";
            }
            setError(errorMessage);
            setIsPending(false);
        }
    };

    return { resetPassword, error, isPending, success };
};
