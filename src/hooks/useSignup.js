import { useState } from 'react';
import { useAuthContext } from './useAuthContext';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';

export const useSignup = () => {
    const [error, setError] = useState(null);
    const [isPending, setIsPending] = useState(false);


    const signup = async (email, password, displayName) => {
        setError(null);
        setIsPending(true);

        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);

            if (!res) {
                throw new Error('Could not complete signup');
            }

            // Generate default avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&bold=true`;

            // Update display name and photoURL
            await updateProfile(res.user, {
                displayName,
                photoURL: avatarUrl
            });

            // Send verification email
            await sendEmailVerification(res.user);

            // Sign out immediately so they can't access app
            await signOut(auth);

            // Do NOT dispatch login. Instead, return specific flag
 

            setIsPending(false);
            return { verificationRequired: true };

        } catch (err) {
            console.error("Signup Failed:", err);
            setError(err.message);
            setIsPending(false);
            throw err; // Re-throw so component knows it failed
        }
    };

    return { signup, error, isPending };
};
