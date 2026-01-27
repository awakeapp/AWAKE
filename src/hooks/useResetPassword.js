import { useState } from 'react';
import { api } from '../services/api';

export const useResetPassword = () => {
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [success, setSuccess] = useState(false);

    // Step 1: Request OTP
    const initiateReset = async (identifier) => {
        setError(null);
        setIsPending(true);
        try {
            const res = await api.auth('initiatePasswordReset', { identifier });
            if (!res.success) throw new Error(res.error.message || 'Failed to initiate reset');
            setIsPending(false);
            return res.data; // might contain dev_otp
        } catch (err) {
            setError(err.message);
            setIsPending(false);
            throw err;
        }
    };

    // Step 2 & 3: Verify OTP and Set New Password
    const confirmReset = async (identifier, otp, newPassword) => {
        setError(null);
        setIsPending(true);
        setSuccess(false);

        try {
            const res = await api.auth('completePasswordReset', {
                identifier,
                otp,
                newPassword
            });

            if (!res.success) throw new Error(res.error.message || 'Reset failed');

            setSuccess(true);
            setIsPending(false);
        } catch (err) {
            console.log(err.message);
            setError(err.message);
            setIsPending(false);
        }
    };

    return { initiateReset, confirmReset, error, isPending, success };
};
