import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResetPassword } from '../hooks/useResetPassword';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import awakeLogo from '../assets/awake_logo_new.png';
import ErrorDisplay from '../components/molecules/ErrorDisplay';

const ForgotPassword = () => {
    const [identifier, setIdentifier] = useState('');
    // Removed OTP state as Firebase handles via link

    const { resetPassword, error, isPending, success } = useResetPassword();

    const handleIdentify = async (e) => {
        e.preventDefault();
        await resetPassword(identifier.trim());
    };

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
                className="w-full max-w-md relative z-10"
            >
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-2xl dark:bg-slate-900/80 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <CardHeader className="space-y-2 text-center pb-6 pt-8">
                        <div className="mx-auto flex justify-center mb-6">
                            <img src={awakeLogo} alt="Awake Logo" className="h-10 w-auto dark:brightness-0 dark:invert" />
                        </div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {success ? 'Check Your Email' : 'Reset Password'}
                        </CardTitle>
                        <p className="text-slate-500 font-medium dark:text-slate-400">
                            {success
                                ? 'We have sent a password reset link to your email address.'
                                : 'Enter your email address to receive a reset link.'}
                        </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-10">
                        {success ? (
                            <div className="space-y-6 text-center">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                </div>
                                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    <Link to="/login">Back to Sign In</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleIdentify} className="space-y-5">
                                <Input
                                    type="email"
                                    placeholder="Email address"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className="h-12 bg-slate-50 border-transparent focus:bg-white transition-all text-lg"
                                />

                                {error && (
                                    <ErrorDisplay
                                        type="auth"
                                        title="Reset Failed"
                                        message={error}
                                    />
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-xl"
                                    isLoading={isPending}
                                >
                                    Send Password Reset Link
                                </Button>

                                <div className="text-center">
                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" /> Back to Sign In
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
