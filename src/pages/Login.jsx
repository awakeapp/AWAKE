import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useSignup } from '../hooks/useSignup';
import { useAuthContext } from '../hooks/useAuthContext';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { UserCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const { login, error: loginError, isPending: loginPending } = useLogin();
    const { signup, error: signupError, isPending: signupPending } = useSignup();
    const { user } = useAuthContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSignup) {
            await signup(identifier, password, displayName);
        } else {
            await login(identifier, password);
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setIdentifier('');
        setPassword('');
        setDisplayName('');
    };

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
                        <div className="mx-auto flex justify-center mb-4 relative">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
                                <img src="/logo.png" alt="Awake Logo" className="h-16 w-auto relative z-10 drop-shadow-sm" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isSignup ? 'Begin Journey' : 'Welcome Back'}
                        </CardTitle>
                        <p className="text-slate-500 font-medium dark:text-slate-400">
                            {isSignup ? 'Create your universal identity' : 'Enter credentials to access your space'}
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
                                        className="space-y-2 overflow-hidden"
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
                                    type={isSignup ? "email" : "text"}
                                    placeholder={isSignup ? "Email Address" : "Username"}
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    autoComplete={isSignup ? "email" : "username"}
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

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {error.replace('Firebase:', '').replace('Error', '').trim()}
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

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-slate-400 font-medium dark:bg-slate-900">Or continue with</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={toggleMode}
                                    className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors py-2 px-4 rounded-lg hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-slate-800"
                                >
                                    {isSignup ? (
                                        <>Already have credentials? <span className="text-indigo-600 dark:text-indigo-400">Sign In</span></>
                                    ) : (
                                        <>New here? <span className="text-indigo-600 dark:text-indigo-400">Create Account</span></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
