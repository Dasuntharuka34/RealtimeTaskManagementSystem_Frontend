import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { userInfo, isLoading, error } = useSelector((state) => state.auth);

    useEffect(() => {
        if (userInfo) {
            navigate('/dashboard');
        }
        return () => dispatch(clearError());
    }, [navigate, userInfo, dispatch]);

    const submitHandler = async (e) => {
        e.preventDefault();
        const result = await dispatch(register({ name, email, password }));
        if (register.fulfilled.match(result)) {
            // Check if it's a message-only response (verification case)
            if (!result.payload._id) {
                setIsSuccess(true);
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 px-4 py-8">
                <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/10 mb-4 animate-pulse">
                        <Mail className="w-10 h-10 text-teal-400" />
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">Verify your email</h2>
                    <p className="text-slate-300 leading-relaxed">
                        We've sent a verification link to <span className="text-teal-400 font-semibold">{email}</span>.
                        Please check your inbox to activate your account.
                    </p>
                    <div className="pt-4">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md transition-all shadow-lg shadow-teal-900/40"
                        >
                            Back to Login <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-100 px-4 py-8">
            <div className="w-full max-w-md p-6 sm:p-8 bg-slate-800 rounded-lg shadow-xl shadow-slate-900/50 border border-slate-700">
                <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-teal-400 to-indigo-500 bg-clip-text text-transparent">Sign Up</h1>
                {error && <div className="mb-4 bg-red-500/20 text-red-200 border border-red-500/50 p-3 rounded">{error}</div>}
                <form onSubmit={submitHandler} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                        <input
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-500 shadow-inner shadow-slate-950/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-500 shadow-inner shadow-slate-950/20"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all placeholder-slate-500 shadow-inner shadow-slate-950/20"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full auth-btn bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-md transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-teal-900/30"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Registering...</span>
                            </div>
                        ) : 'Create Account'}
                    </button>
                </form>
                <div className="mt-8 text-center text-slate-400 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium hover:underline transition-all underline-offset-4">
                        Login here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
