import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useSignup } from '../hooks/useSignup';
import { useAuthContext } from '../hooks/useAuthContext';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { UserCircle2, ArrowRight, Sparkles, Smartphone, Mail, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import awakeLogo from '../assets/awake_logo_new.png';

const Login = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [signupMethod, setSignupMethod] = useState('email'); // 'email' or 'phone'
    const [isOtpPhase, setIsOtpPhase] = useState(false);
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');

    const { login, error: loginError, isPending: loginPending } = useLogin();
    const { signup, verifyOtp, error: signupError, isPending: signupPending } = useSignup();
    const { user } = useAuthContext();
    const [migrating, setMigrating] = useState(false);
    const [localUsersFound, setLocalUsersFound] = useState(false);

    // Check for local users on mount
    useState(() => {
        const localUsers = JSON.parse(localStorage.getItem('awake_users') || '[]');
        if (localUsers.length > 0) {
            setLocalUsersFound(true);
        }
    }, []);

    const handleMigration = async () => {
        if (!confirm("This will upload your local accounts to the cloud. You will need to Reset Your Password to log in afterwards. Continue?")) return;

        setMigrating(true);
        try {
            const localUsers = JSON.parse(localStorage.getItem('awake_users') || '[]');
            const { api } = await import('../services/api'); // Dynamic import to avoid circular dep if any, or just import at top

            // We need to shape the data for backend
            // Backend expects: [{ email, phone, displayName, uid }]
            const usersToMigrate = localUsers.map(u => ({
                email: u.email,
                phone: u.phone,
                displayName: u.displayName,
                uid: u.uid
            }));

            const res = await api.auth('migrateUsers', { users: usersToMigrate });

            if (res.success) {
                alert(`Migration Successful! \nSuccess: ${res.data.success}, Failed/Example: ${res.data.failed}\n\nPlease 'Forgot Password' to set your new secure password.`);
                // Clear local users to prevent re-migration
                localStorage.removeItem('awake_users');
                setLocalUsersFound(false);
            } else {
                alert("Migration encountered an error: " + (res.data?.message || res.error?.message));
            }
        } catch (e) {
            console.error(e);
            alert("Migration Failed");
        } finally {
            setMigrating(false);
        }
    };

    const handleSignupInitiate = async (e) => {
        e.preventDefault();
        try {
            const data = await signup(
                signupMethod === 'email' ? identifier : '',
                password,
                displayName,
                signupMethod === 'phone' ? identifier : ''
            );

            if (data) {
                setIsOtpPhase(true);
                if (data.dev_otp) {
                    alert(`Verification Code (Dev Mode): ${data.dev_otp}`);
                } else {
                    alert('Verification code sent to your device.');
                }
            }
        } catch (e) {
            console.error("Signup Init Failed", e);
        }
    };

    const handleOtpVerify = async (e) => {
        e.preventDefault();
        try {
            await verifyOtp(identifier, otp);
            // Verification successful, now auto-login
            await login(identifier, password);
        } catch (e) {
            console.error("Verification Failed", e);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSignup) {
            handleSignupInitiate(e);
        } else {
            await login(identifier, password);
        }
    };

    const toggleMode = () => {
        setIsSignup(!isSignup);
        setIsOtpPhase(false);
        setIdentifier('');
        setPassword('');
        setDisplayName('');
        setOtp('');
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
                        <div className="mx-auto flex justify-center mb-6 relative">
                            <div className="relative">
                                <img src={awakeLogo} alt="Awake Logo" className="h-10 w-auto relative z-10 drop-shadow-sm object-contain dark:brightness-0 dark:invert" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {isSignup ? (isOtpPhase ? 'Verify Identity' : 'Begin Journey') : 'Welcome Back'}
                        </CardTitle>
                        <p className="text-slate-500 font-medium dark:text-slate-400">
                            {isOtpPhase
                                ? `Enter the 6-digit code sent to your ${signupMethod}`
                                : isSignup ? 'Create your universal identity' : 'Enter credentials to access your space'}
                        </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        {!isOtpPhase ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <AnimatePresence mode="popLayout">
                                    {isSignup && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setSignupMethod('email')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${signupMethod === 'email' ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <Mail className="w-3 h-3" /> Email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setSignupMethod('phone')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${signupMethod === 'phone' ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    <Smartphone className="w-3 h-3" /> Phone
                                                </button>
                                            </div>

                                            <Input
                                                type="text"
                                                placeholder="Unique Username"
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
                                        type={isSignup ? (signupMethod === 'email' ? "email" : "tel") : "text"}
                                        placeholder={isSignup ? (signupMethod === 'email' ? "Email Address" : "Phone Number") : "Email, Phone or Username"}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        autoComplete={isSignup ? (signupMethod === 'email' ? "email" : "tel") : "username"}
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
                                    {isSignup ? 'Send Code' : 'Sign In'}
                                    {!isPending && <ArrowRight className="ml-2 w-5 h-5" />}
                                </Button>

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
                        ) : (
                            <form onSubmit={handleOtpVerify} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-center gap-2">
                                        <Input
                                            type="text"
                                            maxLength="6"
                                            placeholder="Enter 6-digit code"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            required
                                            className="h-16 text-center text-2xl tracking-[0.5em] font-black bg-slate-50 border-transparent focus:bg-white transition-all"
                                        />
                                    </div>
                                    <p className="text-center text-xs text-slate-400">
                                        Didn't receive code? <button type="button" onClick={handleSignupInitiate} className="text-indigo-600 font-bold hover:underline">Resend</button>
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none rounded-xl"
                                    isLoading={isPending}
                                >
                                    Verify & Create Account
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setIsOtpPhase(false)}
                                    className="w-full text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                                >
                                    Change email/phone
                                </button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {localUsersFound && (
                <div className="absolute bottom-16 left-0 w-full flex justify-center z-20">
                    <button
                        onClick={handleMigration}
                        disabled={migrating}
                        className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-amber-200 transition-colors flex items-center gap-2"
                    >
                        {migrating ? 'Syncing...' : '⚠️ Sync Local Accounts to Cloud'}
                    </button>
                </div>
            )}

            <div className="absolute bottom-4 left-0 w-full text-center z-10">
                <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] opacity-60">
                    Developed by CoolCraft
                </p>
            </div>
        </div>
    );
};

export default Login;
