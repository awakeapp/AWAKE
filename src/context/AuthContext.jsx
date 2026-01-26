import { createContext, useEffect, useReducer, useMemo } from 'react';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, user: action.payload };
        case 'LOGOUT':
            return { ...state, user: null };
        case 'AUTH_IS_READY':
            return { ...state, user: action.payload, authIsReady: true };
        default:
            return state;
    }
};

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        authIsReady: false
    });

    useEffect(() => {
        // Check for existing session in localStorage
        const storedSession = localStorage.getItem('awake_session');

        if (storedSession) {
            try {
                const user = JSON.parse(storedSession);
                dispatch({ type: 'AUTH_IS_READY', payload: user });
            } catch (e) {
                console.error("Failed to parse session", e);
                dispatch({ type: 'AUTH_IS_READY', payload: null });
            }
        } else {
            dispatch({ type: 'AUTH_IS_READY', payload: null });
        }
    }, []);

    const value = useMemo(() => ({ ...state, dispatch }), [state]);

    console.log('AuthContext state:', state);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
