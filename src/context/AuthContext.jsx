import { createContext, useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import md5 from 'blueimp-md5';

export const AuthContext = createContext();

export const normalizeUser = (firebaseUser) => {
    if (!firebaseUser) return null;
    const name = firebaseUser.displayName || 'User';
    const email = firebaseUser.email || '';

    // Logic: PhotoURL -> Gravatar -> UI Avatars
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=404`;

    // We prefer firebaseUser.photoURL if it exists (custom upload or google),
    // otherwise we just use ui-avatars as a safe default.
    // Note: To truly fallback to Gravatar only if valid, we'd need to check image existence,
    // but typically we can just set Gravatar's 'd' param to the ui-avatars URL.

    const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`;
    const robustAvatar = firebaseUser.photoURL || `https://www.gravatar.com/avatar/${md5(email.trim().toLowerCase())}?d=${encodeURIComponent(uiAvatarUrl)}`;

    // Generate consistent profile color
    const colors = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500',
        'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
        'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
        'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
        'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const profileColor = colors[Math.abs(hash) % colors.length];

    return {
        ...firebaseUser, // Keep original fields valid
        uid: firebaseUser.uid,
        email: email,
        name: name,
        avatar: robustAvatar,
        initials: name.charAt(0).toUpperCase(),
        profileColor
    };
};

export const AuthContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(normalizeUser(firebaseUser));
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = () => signOut(auth);

    // Legacy dispatch for backward compatibility
    const dispatch = (action) => {
        // No-op: State is managed by Firebase Auth listener
        console.log('AuthContext dispatch called (ignored due to Firebase Auth listener):', action);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, dispatch, authIsReady: !loading }}>
            {children}
        </AuthContext.Provider>
    );
};
