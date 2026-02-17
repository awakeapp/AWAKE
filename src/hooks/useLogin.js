import { useState, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

export const useLogin = () => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);


    const login = async (email, password) => {
        setError(null);
        setIsPending(true);

        try {
            const res = await signInWithEmailAndPassword(auth, email, password);

            // Check if email is verified
            if (!res.user.emailVerified) {
               await signOut(auth);
               throw new Error("Please verify your email address to log in.");
            }







            if (!isCancelled) {
                setIsPending(false);
                setError(null);
            }
            return res.user;
        } catch (err) {
            if (!isCancelled) {
                console.error(err);
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
