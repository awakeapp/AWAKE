import { useState } from 'react';
import { useAuthContext } from './useAuthContext';

export const useSignup = () => {
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const { dispatch } = useAuthContext();

    const signup = async (email, password, displayName) => {
        setError(null);
        setIsPending(true);

        try {
            // Mimic Network Delay
            await new Promise(resolve => setTimeout(resolve, 800));

            const users = JSON.parse(localStorage.getItem('awake_users') || '[]');

            // Check if email exists
            if (users.some(u => u.email === email)) {
                throw new Error('Email already in use');
            }

            const newUser = {
                uid: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email,
                password, // In a real app we'd hash this, but per requirements "simple login system... local storage"
                displayName,
                createdAt: Date.now()
            };

            users.push(newUser);
            localStorage.setItem('awake_users', JSON.stringify(users));

            // Create session (don't store password in session)
            const sessionUser = {
                uid: newUser.uid,
                email: newUser.email,
                displayName: newUser.displayName
            };
            localStorage.setItem('awake_session', JSON.stringify(sessionUser));

            // Dispatch login action
            dispatch({ type: 'LOGIN', payload: sessionUser });

            setIsPending(false);
            return sessionUser;

        } catch (err) {
            console.log(err.message);
            setError(err.message);
            setIsPending(false);
        }
    };

    return { signup, error, isPending };
};
