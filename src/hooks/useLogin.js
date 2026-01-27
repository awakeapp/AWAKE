import { useState, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import { api } from '../services/api';

export const useLogin = () => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();

    const login = async (identifier, password) => {
        setError(null);
        setIsPending(true);

        try {
            const res = await api.auth('signIn', { identifier, password });

            if (!res.success) {
                throw new Error(res.error.message || 'Login failed');
            }

            const data = res.data;

            // Create session object compatible with app
            const sessionUser = {
                uid: data.userId,
                sessionId: data.sessionId,
                email: data.user.email,
                phone: data.user.phone,
                displayName: data.user.username
            };

            localStorage.setItem('awake_session', JSON.stringify(sessionUser));
            dispatch({ type: 'LOGIN', payload: sessionUser });

            // Hydration/Sync logic would go here, but backend currently supports Auth only.

            if (!isCancelled) {
                setIsPending(false);
                setError(null);
            }
            return sessionUser;
        } catch (err) {
            if (!isCancelled) {
                console.log(err.message);
                setError(err.message);
                setIsPending(false);
            }
        }
    };

    useEffect(() => {
        return () => setIsCancelled(true);
    }, []);

    return { login, error, isPending };
};
