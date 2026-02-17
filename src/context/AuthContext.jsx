import { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'; 
import { db } from '../lib/firebase';
import md5 from 'blueimp-md5';
import { setAnalyticsUserId, setAnalyticsUserProperties } from '../lib/analytics';

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
                const normalized = normalizeUser(firebaseUser);
                
                // Fetch Role and then set user
                const userRef = doc(db, 'users', firebaseUser.uid);
                getDoc(userRef).then((snapshot) => {
                    let role = 'user';
                    if (snapshot.exists()) {
                        role = snapshot.data().role || 'user';
                    } else {
                        // Create doc if missing
                        setDoc(userRef, {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || 'User',
                            role: 'user',
                            createdAt: serverTimestamp()
                        }).catch(err => console.error("Error creating user doc:", err));
                    }
                    
                    setUser({ ...normalized, role });
                    setLoading(false);
                    
                    // Track user in analytics
                    setAnalyticsUserId(firebaseUser.uid);
                    setAnalyticsUserProperties({
                        user_role: role,
                        user_email: firebaseUser.email
                    });
                }).catch(err => {
                    console.error("Error fetching user role:", err);
                    setUser(normalized); // Fallback
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
        // Analytics logout event is tracked in useLogin/useLogout hooks
    }, []);

    // Legacy dispatch for backward compatibility
    const dispatch = useCallback((action) => {
        // No-op: State is managed by Firebase Auth listener
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        logout,
        dispatch,
        authIsReady: !loading,
        isAdmin: user?.role === 'admin'
    }), [user, loading, logout, dispatch]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
