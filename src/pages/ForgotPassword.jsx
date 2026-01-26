import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResetPassword } from '../hooks/useResetPassword';
import Button from '../components/atoms/Button';
import Input from '../components/atoms/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/atoms/Card';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { resetPassword, error, isPending, success } = useResetPassword();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await resetPassword(email);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 dark:bg-slate-950 transition-colors">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90 dark:border-slate-800">
                    <CardHeader className="space-y-4 text-center pb-2">
                        <div className="mx-auto flex justify-center">
                            <div className="bg-indigo-100 p-4 rounded-full dark:bg-indigo-900/30">
                                <KeyRound className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                                Forgot password?
                            </CardTitle>
                            <p className="text-slate-500 text-sm dark:text-slate-400">
                                No worries, we'll send you reset instructions.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4 py-4"
                            >
                                <div className="flex justify-center">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Check your email</h3>
                                    <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">
                                        We sent a password reset link to <span className="font-medium text-slate-900 dark:text-slate-200">{email}</span>
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full mt-4"
                                    onClick={() => window.location.href = '/login'}
                                >
                                    Back to Login
                                </Button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                        Email Address
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-12 text-lg"
                                        autoFocus
                                    />
                                </div>

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {error.replace('Firebase:', '').replace('Error', '').trim()}
                                    </motion.div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                                    isLoading={isPending}
                                >
                                    Send Reset Link
                                </Button>

                                <div className="flex justify-center">
                                    <Link
                                        to="/login"
                                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back to Login
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
