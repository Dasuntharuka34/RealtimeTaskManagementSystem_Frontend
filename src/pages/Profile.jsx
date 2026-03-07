import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile, uploadAvatar, clearError } from '../store/slices/authSlice';
import { User, Mail, Lock, ChevronLeft, Save, AlertCircle, CheckCircle2, Camera } from 'lucide-react';
import { useRef } from 'react';

const Profile = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [success, setSuccess] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { userInfo, isLoading, error } = useSelector((state) => state.auth);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (userInfo) {
            setName(userInfo.name);
            setEmail(userInfo.email);
        }
    }, [userInfo]);

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setSuccess(false);

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        try {
            const result = await dispatch(updateProfile({ name, password })).unwrap();
            if (result) {
                setSuccess(true);
                setPassword('');
                setConfirmPassword('');
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            // Error is handled by Redux state
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage('Image must be smaller than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            await dispatch(uploadAvatar(formData)).unwrap();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setMessage('Failed to upload avatar');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-100">Profile Settings</h1>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-12 max-w-2xl mx-auto w-full">
                <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                            <div 
                                className="relative w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-900/20 group cursor-pointer overflow-hidden border-2 border-slate-700 hover:border-blue-500 transition-colors shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {userInfo?.avatar ? (
                                    <img src={userInfo.avatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white">{userInfo?.name?.charAt(0).toUpperCase()}</span>
                                )}
                                
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>

                                {isLoading && (
                                    <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleAvatarChange} 
                                className="hidden" 
                                accept="image/*"
                            />

                            <div className="text-center sm:text-left mt-2 sm:mt-0">
                                <h2 className="text-2xl font-bold text-slate-100">{userInfo?.name}</h2>
                                <p className="text-slate-400 mt-1">{userInfo?.email}</p>
                                <button 
                                    className="text-blue-400 hover:text-blue-300 text-sm mt-2 font-medium"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                >
                                    Change Profile Picture
                                </button>
                            </div>
                        </div>

                        {(error || message) && (
                            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                                <AlertCircle size={18} className="shrink-0" />
                                <span>{error || message}</span>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-400 text-sm">
                                <CheckCircle2 size={18} className="shrink-0" />
                                <span>Profile updated successfully!</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                    <User size={16} className="text-slate-500" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-100 transition-all"
                                    placeholder="Enter your name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                    <Mail size={16} className="text-slate-500" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg outline-none text-slate-400 bg-slate-800/50 cursor-not-allowed opacity-70 transition-all"
                                    placeholder="Enter your email"
                                    readOnly
                                    disabled
                                />
                                <p className="mt-1.5 text-[10px] text-slate-500 italic">Email cannot be changed once registered.</p>
                            </div>

                            <div className="pt-4 border-t border-slate-700/50">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Change Password</h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                            <Lock size={16} className="text-slate-500" />
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-100 transition-all"
                                            placeholder="Leave blank to keep current"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                                            <Lock size={16} className="text-slate-500" />
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-100 transition-all"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-900/20"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
