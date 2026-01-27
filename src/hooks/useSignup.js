import { useState } from 'react';
import { useAuthContext } from './useAuthContext';
import { api } from '../services/api';

export const useSignup = () => {
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    // dispatch is unused here because signup doesn't auto-login anymore in this secure flow
    // but verifyOtp might want to auto-login or we do it in component.

    const signup = async (email, password, displayName, phone = '') => {
        setError(null);
        setIsPending(true);

        try {
            const res = await api.auth('signUp', {
                email,
                password,
                username: displayName,
                phone
            });

            if (!res.success) {
                throw new Error(res.error.message || 'Signup failed');
            }

            // Return data including the dev_otp for now
            return res.data;

        } catch (err) {
            console.error("Signup Failed:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    const verifyOtp = async (identifier, otp) => {
        setError(null);
        setIsPending(true);
        try {
            const res = await api.auth('verifySignUpOTP', {
                identifier,
                otp
            });

            if (!res.success) {
                throw new Error(res.error.message || 'Verification failed');
            }
            return res.data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsPending(false);
        }
    };

    return { signup, verifyOtp, error, isPending };
};
