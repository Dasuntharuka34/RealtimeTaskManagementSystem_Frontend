import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Mail, Send, Crown, UserMinus, Users } from 'lucide-react';
import api from '../../services/api';
import { updateCurrentBoard } from '../../store/slices/kanbanSlice';

const InviteModal = ({ onClose, onBoardUpdated }) => {
    const dispatch = useDispatch();
    const { currentBoard } = useSelector((state) => state.kanban);
    const { userInfo } = useSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteSuccess, setInviteSuccess] = useState('');
    const [removingId, setRemovingId] = useState(null);

    const isOwner = currentBoard?.owner?._id === userInfo?._id ||
        currentBoard?.owner === userInfo?._id;

    const handleInvite = async (e) => {
        e.preventDefault();
        const trimmed = email.trim();
        if (!trimmed) return;

        setIsInviting(true);
        setInviteError('');
        setInviteSuccess('');

        try {
            const { data } = await api.post(`/boards/${currentBoard._id}/invite`, { email: trimmed });
            dispatch(updateCurrentBoard(data));
            onBoardUpdated?.();
            setEmail('');
            setInviteSuccess(`${trimmed} has been added to the board!`);
            setTimeout(() => setInviteSuccess(''), 3000);
        } catch (err) {
            setInviteError(err.response?.data?.message || 'Failed to invite user');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (memberId) => {
        setRemovingId(memberId);
        try {
            const { data } = await api.delete(`/boards/${currentBoard._id}/members/${memberId}`);
            dispatch(updateCurrentBoard(data));
            onBoardUpdated?.();
        } catch (err) {
            console.error('Failed to remove member', err);
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="bg-slate-800 border border-slate-700 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                <Users size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-100">Invite Members</h2>
                                <p className="text-xs text-slate-500">{currentBoard?.title}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Invite Form */}
                    <div className="p-5">
                        <form onSubmit={handleInvite} className="flex gap-2">
                            <div className="relative flex-1">
                                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setInviteError('');
                                    }}
                                    placeholder="Enter email address..."
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isInviting || !email.trim()}
                                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                            >
                                <Send size={14} />
                                {isInviting ? 'Inviting...' : 'Invite'}
                            </button>
                        </form>

                        {/* Feedback */}
                        {inviteError && (
                            <div className="mt-3 px-3 py-2 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-sm">
                                {inviteError}
                            </div>
                        )}
                        {inviteSuccess && (
                            <div className="mt-3 px-3 py-2 bg-green-500/15 border border-green-500/40 rounded-lg text-green-300 text-sm flex items-center gap-2">
                                <span>✓</span> {inviteSuccess}
                            </div>
                        )}
                    </div>

                    {/* Members List */}
                    <div className="px-5 pb-5">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Current Members ({currentBoard?.members?.length})
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {currentBoard?.members?.map((member) => {
                                const isMemberOwner = currentBoard.owner?._id === member._id ||
                                    currentBoard.owner === member._id;
                                const isYou = member._id === userInfo?._id;
                                return (
                                    <div
                                        key={member._id}
                                        className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50"
                                    >
                                        {/* Avatar */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isMemberOwner ? 'bg-amber-600' : 'bg-indigo-600'
                                            }`}>
                                            {member.name?.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-slate-200 truncate">{member.name}</p>
                                                {isYou && <span className="text-[10px] text-slate-500 font-normal">(you)</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                        </div>

                                        {/* Role / Action */}
                                        {isMemberOwner ? (
                                            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
                                                <Crown size={10} />Owner
                                            </span>
                                        ) : isOwner && !isYou ? (
                                            <button
                                                onClick={() => handleRemove(member._id)}
                                                disabled={removingId === member._id}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50 shrink-0"
                                                title={`Remove ${member.name}`}
                                            >
                                                {removingId === member._id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <UserMinus size={14} />
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-slate-500 font-medium shrink-0">Member</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default InviteModal;
