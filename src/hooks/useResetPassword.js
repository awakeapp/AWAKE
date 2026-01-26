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
            console.log(err.message);
            setError(err.message);
            setIsPending(false);
        }
    };

    return { resetPassword, error, isPending, success };
};
