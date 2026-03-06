import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
    const { token } = useParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const triggered = useRef(false);

    useEffect(() => {
        const verify = async () => {
            if (triggered.current) return;
            triggered.current = true;

            try {
                const { data } = await api.get(`/users/verify/${token}`);
                setStatus('success');
                setMessage(data.message);
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed');
            }
        };

        if (token) {
            verify();
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 p-4">
            <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700 text-center">
                {status === 'loading' && (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mx-auto" />
                        <h2 className="text-2xl font-bold">Verifying your email...</h2>
                        <p className="text-slate-400 text-sm">Please wait while we confirm your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-4">
                        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold text-white">Verified!</h2>
                        <p className="text-slate-300">{message}</p>
                        <div className="pt-4">
                            <Link
                                to="/login"
                                className="inline-block w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-colors shadow-lg shadow-teal-900/20"
                            >
                                Continue to Login
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-4">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" strokeWidth={1.5} />
                        <h2 className="text-2xl font-bold text-white">Oops!</h2>
                        <p className="text-slate-300">{message}</p>
                        <div className="pt-4">
                            <Link
                                to="/register"
                                className="inline-block w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md transition-colors"
                            >
                                Back to Registration
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
