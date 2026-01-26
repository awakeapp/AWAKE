import { useState, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';

export const useLogin = () => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();

    const login = async (identifier, password) => {
        setError(null);
        setIsPending(true);

        try {
            // Mimic Network Delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = JSON.parse(localStorage.getItem('awake_users') || '[]');
            const user = users.find(u => (u.email === identifier || u.displayName === identifier) && u.password === password);

            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Create session
            const sessionUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            };

            localStorage.setItem('awake_session', JSON.stringify(sessionUser));

            // Dispatch login action
            dispatch({ type: 'LOGIN', payload: sessionUser });

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
