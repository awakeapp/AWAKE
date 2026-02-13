import { useState, useEffect } from 'react';
import { useAuthContext } from './useAuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const useLogout = () => {
    const [isCancelled, setIsCancelled] = useState(false);
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);


    const logout = async () => {
        setError(null);
        setIsPending(true);

        try {
            await signOut(auth);

            // Dispatch logout action


            if (!isCancelled) {
                setIsPending(false);
                setError(null);
            }
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

    return { logout, error, isPending };
};
