import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useSignup } from '../hooks/useSignup';
import { useAuthContext } from '../hooks/useAuthContext';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import awakeLogo from '../assets/awake_logo_new.png';
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from '../lib/firebase';

const Login = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [identifier, setIdentifier] = useState(''); // Email
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [googleError, setGoogleError] = useState(null);
    const [isGooglePending, setIsGooglePending] = useState(false);

    const { login, error: loginError, isPending: loginPending } = useLogin();
    const { signup, error: signupError, isPending: signupPending } = useSignup();
    const { user, authIsReady } = useAuthContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGoogleError(null);
        if (isSignup) {
            await signup(identifier, password, displayName);
        } else {
            await login(identifier, password);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleError(null);
        setIsGooglePending(true);
        const provider = new GoogleAuthProvider();

        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Error signing in with Google:", err);
            let errorMessage = "Failed to sign in with Google.";
            if (err.code === 'auth/popup-closed-by-user') {
                errorMessage = "Sign-in popup was closed.";
            } else if (err.code === 'auth/cancelled-popup-request') {
                errorMessage = "Only one popup request is allowed at a time.";
            } else if (err.code === 'auth/popup-blocked') {
                errorMessage = "Sign-in popup was blocked by the browser.";
            } else if (err.code === 'auth/operation-not-allowed') {
                errorMessage = "Google Sign-In is not enabled in Firebase Console.";
            } else if (err.code === 'auth/unauthorized-domain') {
                errorMessage = "This domain is not authorized in Firebase Console.";
            } else {
                errorMessage = err.message || "An unknown error occurred.";
            }
            setGoogleError(errorMessage);
            setIsGooglePending(false);
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setIdentifier('');
        setPassword('');
        setDisplayName('');
        setGoogleError(null);
    };

    if (!authIsReady) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    const isPending = isSignup ? signupPending : loginPending;
    const error = isSignup ? signupError : loginError;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dark:bg-slate-950 transition-colors relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-2xl dark:bg-slate-900/80 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-2 text-center pb-6 pt-8">
                        <div className="mx-auto flex justify-center mb-6 relative">
                            <div className="relative">
                                <img src={awakeLogo} alt="Awake Logo" className="h-10 w-auto relative z-10 drop-shadow-sm object-contain dark:brightness-0 dark:invert" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isSignup ? 'Create Account' : 'Welcome Back'}
                        </CardTitle>
                        <p className="text-slate-500 font-medium dark:text-slate-400">
                            {isSignup ? 'Create your universal identity' : 'Sign in to access your space'}
                        </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <AnimatePresence mode="popLayout">
                                {isSignup && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        <Input
                                            type="text"
                                            placeholder="Display Name"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            required
                                            className="h-12 bg-slate-50 border-transparent focus:bg-white transition-all text-lg"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    autoComplete="email"
                                    required
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white transition-all text-lg"
                                />

                                <div className="space-y-1">
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete={isSignup ? "new-password" : "current-password"}
                                        required
                                        className="h-12 bg-slate-50 border-transparent focus:bg-white transition-all text-lg"
                                    />
                                    {!isSignup && (
                                        <div className="flex justify-end">
                                            <Link
                                                to="/forgot-password"
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {(error || googleError) && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {googleError || error?.replace('Firebase:', '').replace('Error', '').trim()}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl"
                                isLoading={isPending}
                            >
                                {isSignup ? 'Create Account' : 'Sign In'}
                                {!isPending && <ArrowRight className="ml-2 w-5 h-5" />}
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                        Or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full h-12 text-base font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-xl flex items-center justify-center gap-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-700"
                                isLoading={isGooglePending}
                            >
                                {!isGooglePending && (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                )}
                                Google
                            </Button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-2 px-4 rounded-lg hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800"
                                >
                                    {isSignup ? (
                                        <>Already have account? <span className="text-indigo-600 dark:text-indigo-400">Sign In</span></>
                                    ) : (
                                        <>New here? <span className="text-indigo-600 dark:text-indigo-400">Create Account</span></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            <div className="absolute bottom-4 left-0 w-full text-center z-10">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] opacity-60">
                    Developed by CoolCraft
                </p>
            </div>
        </div>
    );
};

export default Login;
