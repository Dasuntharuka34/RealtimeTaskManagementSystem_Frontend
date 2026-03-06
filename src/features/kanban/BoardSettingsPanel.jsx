import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal';
import { X, Save, Trash2, Globe, Lock, ChevronRight, AlertTriangle, User, Crown } from 'lucide-react';
import api from '../../services/api';
import { updateCurrentBoard } from '../../store/slices/kanbanSlice';

const TABS = ['General', 'Members', 'Danger Zone'];

const BoardSettingsPanel = ({ onClose, onBoardUpdated }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBoard } = useSelector((state) => state.kanban);
    const { userInfo } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('General');
    const [title, setTitle] = useState(currentBoard?.title || '');
    const [description, setDescription] = useState(currentBoard?.description || '');
    const [privacy, setPrivacy] = useState(currentBoard?.privacy || 'Private');
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const [removingId, setRemovingId] = useState(null);

    const isOwner = currentBoard?.owner?._id === userInfo?._id ||
        currentBoard?.owner === userInfo?._id;

    useEffect(() => {
        setTitle(currentBoard?.title || '');
        setDescription(currentBoard?.description || '');
        setPrivacy(currentBoard?.privacy || 'Private');
    }, [currentBoard]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setIsSaving(true);
        setSaveError('');
        setSaveSuccess(false);
        try {
            const { data } = await api.patch(`/boards/${currentBoard._id}`, { title, description, privacy });
            dispatch(updateCurrentBoard(data));
            setSaveSuccess(true);
            onBoardUpdated?.();
            setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm !== currentBoard?.title) return;
        setIsDeleting(true);
        setDeleteError('');
        try {
            await api.delete(`/boards/${currentBoard._id}`);
            navigate('/dashboard');
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'Failed to delete board');
            setIsDeleting(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
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
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-slate-900 border-l border-slate-700 shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
                    <h2 className="text-lg font-bold text-slate-100">Board Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-700 shrink-0 px-4">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? tab === 'Danger Zone'
                                        ? 'border-red-500 text-red-400'
                                        : 'border-blue-500 text-blue-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {/* ── General Tab ── */}
                    {activeTab === 'General' && (
                        <form onSubmit={handleSave} className="p-5 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Board Title <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={!isOwner}
                                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Board title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={!isOwner}
                                    rows={3}
                                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Add a description..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">Visibility</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'Private', icon: Lock, label: 'Private', desc: 'Only members can view' },
                                        { value: 'Public', icon: Globe, label: 'Public', desc: 'Anyone can view' },
                                    ].map(({ value, icon: Icon, label, desc }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            disabled={!isOwner}
                                            onClick={() => setPrivacy(value)}
                                            className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${privacy === value
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon size={15} className={privacy === value ? 'text-blue-400' : 'text-slate-400'} />
                                                <span className={`text-sm font-semibold ${privacy === value ? 'text-blue-300' : 'text-slate-300'}`}>{label}</span>
                                            </div>
                                            <span className="text-xs text-slate-500">{desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!isOwner && (
                                <p className="text-xs text-slate-500 italic">Only the board owner can change settings.</p>
                            )}

                            {saveError && (
                                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-sm">{saveError}</div>
                            )}
                            {saveSuccess && (
                                <div className="p-3 bg-green-500/15 border border-green-500/40 rounded-lg text-green-300 text-sm">✓ Settings saved successfully!</div>
                            )}

                            {isOwner && (
                                <button
                                    type="submit"
                                    disabled={isSaving || !title.trim()}
                                    className="flex items-center gap-2 w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <Save size={16} />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                        </form>
                    )}

                    {/* ── Members Tab ── */}
                    {activeTab === 'Members' && (
                        <div className="p-5 space-y-2">
                            <p className="text-xs text-slate-500 mb-4">{currentBoard?.members?.length} member{currentBoard?.members?.length !== 1 ? 's' : ''} on this board</p>
                            {currentBoard?.members?.map((member) => {
                                const isThisOwner = currentBoard.owner?._id === member._id || currentBoard.owner === member._id;
                                const isYou = member._id === userInfo?._id;
                                return (
                                    <div key={member._id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                        <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                            {member.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-slate-200 truncate">{member.name}</p>
                                                {isYou && <span className="text-xs text-slate-500">(you)</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{member.email}</p>
                                        </div>
                                        {isThisOwner ? (
                                            <span className="flex items-center gap-1 text-xs text-amber-400 font-medium shrink-0 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                                <Crown size={11} /> Owner
                                            </span>
                                        ) : isOwner && !isYou ? (
                                            <button
                                                onClick={() => handleRemoveMember(member._id)}
                                                disabled={removingId === member._id}
                                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors disabled:opacity-50"
                                                title="Remove member"
                                            >
                                                {removingId === member._id ? (
                                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <X size={15} />
                                                )}
                                            </button>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Danger Zone Tab ── */}
                    {activeTab === 'Danger Zone' && (
                        <div className="p-5">
                            <div className="border border-red-500/40 rounded-xl overflow-hidden">
                                <div className="bg-red-500/10 px-4 py-3 border-b border-red-500/30 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-red-400" />
                                    <h3 className="text-sm font-semibold text-red-400">Delete This Board</h3>
                                </div>
                                <div className="p-4 space-y-4">
                                    <p className="text-sm text-slate-400">
                                        This will permanently delete <strong className="text-slate-200">{currentBoard?.title}</strong>, including all its lists and cards. <strong className="text-red-400">This action cannot be undone.</strong>
                                    </p>

                                    {!isOwner ? (
                                        <p className="text-sm text-slate-500 italic">Only the board owner can delete this board.</p>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                                    To confirm, type <span className="text-slate-200 font-bold">"{currentBoard?.title}"</span> below:
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deleteConfirm}
                                                    onChange={(e) => setDeleteConfirm(e.target.value)}
                                                    placeholder="Type board name to confirm"
                                                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all text-sm"
                                                />
                                            </div>

                                            {deleteError && (
                                                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-lg text-red-300 text-sm">{deleteError}</div>
                                            )}

                                            <button
                                                onClick={handleDelete}
                                                disabled={deleteConfirm !== currentBoard?.title || isDeleting}
                                                className="flex items-center gap-2 w-full justify-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={16} />
                                                {isDeleting ? 'Deleting...' : 'Delete Board Forever'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default BoardSettingsPanel;
