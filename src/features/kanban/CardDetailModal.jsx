import { useState, useRef, useEffect, useMemo } from 'react';
import { X, AlignLeft, Users, Calendar, Activity, CheckSquare, Plus, Flag, Tag, Palette, Paperclip, File, Download } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCardLocally } from '../../store/slices/kanbanSlice';
import api from '../../services/api';

const CardDetailModal = ({ card, onClose, boardMembers }) => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.auth);
    const { currentBoard } = useSelector(state => state.kanban);

    const canEdit = useMemo(() => {
        if (!userInfo || !currentBoard) return false;
        const boardOwnerId = currentBoard.owner._id || currentBoard.owner;
        const isOwner = boardOwnerId.toString() === userInfo._id.toString();
        const assignedIds = card.assignedTo?.map(u => u._id || u) || [];
        const isAssigned = assignedIds.includes(userInfo._id);
        return isOwner || isAssigned;
    }, [userInfo, currentBoard, card.assignedTo]);

    const isOwner = useMemo(() => {
        if (!userInfo || !currentBoard) return false;
        const boardOwnerId = currentBoard.owner._id || currentBoard.owner;
        return boardOwnerId.toString() === userInfo._id.toString();
    }, [userInfo, currentBoard]);
    const [description, setDescription] = useState(card.description || '');
    const [commentText, setCommentText] = useState('');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [showMemberSelect, setShowMemberSelect] = useState(false);
    const [showPrioritySelect, setShowPrioritySelect] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showLabelSelect, setShowLabelSelect] = useState(false);
    const [localDueDate, setLocalDueDate] = useState('');
    const [newLabelText, setNewLabelText] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [showCoverSelect, setShowCoverSelect] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Convert assigned API objects to their IDs for easy checking
    const assignedIds = card.assignedTo?.map(u => u._id || u) || [];

    const descInputRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isEditingDesc && descInputRef.current) {
            descInputRef.current.focus();
            descInputRef.current.setSelectionRange(description.length, description.length);
        }
    }, [isEditingDesc, description.length]);

    useEffect(() => {
        if (card.dueDate) {
            setLocalDueDate(new Date(card.dueDate).toISOString().split('T')[0]);
        } else {
            setLocalDueDate('');
        }
    }, [card.dueDate]);

    const handleSaveDescription = async () => {
        setIsEditingDesc(false);
        if (description === card.description) return;

        try {
            const { data } = await api.put(`/cards/${card._id}`, { description });
            dispatch(updateCardLocally(data));
        } catch (error) {
            console.error('Failed to update description', error);
            setDescription(card.description || '');
        }
    };

    const toggleMember = async (member) => {
        const isAssigned = assignedIds.includes(member._id);

        let newAssignedTo;
        if (isAssigned) {
            newAssignedTo = card.assignedTo.filter(u => (u._id || u) !== member._id);
        } else {
            // Include full member object for immediate UI feedback
            newAssignedTo = [...(card.assignedTo || []), member];
        }

        try {
            const mappedIds = newAssignedTo.map(u => u._id || u);
            const { data } = await api.put(`/cards/${card._id}`, { assignedTo: mappedIds });

            // To ensure UI has member details (name, avatar etc)
            const cardToUpdate = { ...data, assignedTo: newAssignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to update card assignment', error);
        }
    };

    const handlePrioritySelect = async (newPriority) => {
        setShowPrioritySelect(false);
        if ((card.priority || 'Low') === newPriority) return;

        try {
            const { data } = await api.put(`/cards/${card._id}`, { priority: newPriority });

            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));

        } catch (error) {
            console.error('Failed to update priority', error);
        }
    };

    const handleDateSave = async (newDate) => {
        setShowDatePicker(false);
        try {
            const { data } = await api.put(`/cards/${card._id}`, { dueDate: newDate });

            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));

        } catch (error) {
            console.error('Failed to update due date', error);
        }
    };

    const handleAddLabel = async () => {
        if (!newLabelText.trim()) return;
        const currentLabels = card.labels || [];
        if (currentLabels.includes(newLabelText.trim())) return;

        const updatedLabels = [...currentLabels, newLabelText.trim()];

        try {
            const { data } = await api.put(`/cards/${card._id}`, { labels: updatedLabels });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
            setNewLabelText('');
        } catch (error) {
            console.error('Failed to add label', error);
        }
    };

    const handleRemoveLabel = async (labelToRemove) => {
        const currentLabels = card.labels || [];
        const updatedLabels = currentLabels.filter(l => l !== labelToRemove);

        try {
            const { data } = await api.put(`/cards/${card._id}`, { labels: updatedLabels });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to remove label', error);
        }
    };

    const handleCoverSelect = async (color) => {
        setShowCoverSelect(false);
        if (card.coverColor === color) return;

        try {
            const { data } = await api.put(`/cards/${card._id}`, { coverColor: color });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to update cover color', error);
        }
    };

    const handlePostComment = async () => {
        if (!commentText.trim()) return;

        const newComment = {
            user: userInfo._id,
            text: commentText.trim()
        };

        const updatedComments = [...(card.comments || []), newComment];

        try {
            const { data } = await api.put(`/cards/${card._id}`, { comments: updatedComments });

            const newlyAddedComment = {
                ...newComment,
                user: { _id: userInfo._id, name: userInfo.name, email: userInfo.email },
                createdAt: new Date().toISOString()
            };

            const cardToUpdate = {
                ...data,
                assignedTo: card.assignedTo,
                comments: [...(card.comments || []), newlyAddedComment]
            };
            dispatch(updateCardLocally(cardToUpdate));
            setCommentText('');
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    // --- Subtasks Logic ---
    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;

        const newSubtask = { title: newSubtaskTitle.trim(), isCompleted: false };
        const updatedSubtasks = [...(card.subtasks || []), newSubtask];

        try {
            const { data } = await api.put(`/cards/${card._id}`, { subtasks: updatedSubtasks });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
            setNewSubtaskTitle('');
        } catch (error) {
            console.error('Failed to add subtask', error);
        }
    };

    const handleToggleSubtask = async (subtaskId) => {
        const updatedSubtasks = (card.subtasks || []).map(st =>
            st._id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
        );

        try {
            const { data } = await api.put(`/cards/${card._id}`, { subtasks: updatedSubtasks });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to toggle subtask', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId) => {
        const updatedSubtasks = (card.subtasks || []).filter(st => st._id !== subtaskId);

        try {
            const { data } = await api.put(`/cards/${card._id}`, { subtasks: updatedSubtasks });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to delete subtask', error);
        }
    };

    // --- Attachments Logic ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Ensure file is smaller than 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('File must be smaller than 5MB');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post(`/cards/${card._id}/attachments`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to upload attachment', error);
            alert('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm('Are you sure you want to delete this attachment?')) return;

        try {
            const { data } = await api.delete(`/cards/${card._id}/attachments/${attachmentId}`);
            const cardToUpdate = { ...data, assignedTo: card.assignedTo };
            dispatch(updateCardLocally(cardToUpdate));
        } catch (error) {
            console.error('Failed to delete attachment', error);
            alert('Failed to delete attachment');
        }
    };

    const completedSubtasksCount = (card.subtasks || []).filter(st => st.isCompleted).length;
    const totalSubtasksCount = (card.subtasks || []).length;
    const subtasksProgress = totalSubtasksCount === 0 ? 0 : Math.round((completedSubtasksCount / totalSubtasksCount) * 100);

    const priorityColors = {
        'Low': 'bg-slate-700 text-slate-300 border-slate-600',
        'Mid': 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
        'High': 'bg-red-500/20 text-red-500 border-red-500/30'
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start pt-10 sm:pt-20 z-50 p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl relative mb-20 text-slate-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="p-6 pb-2 border-b border-slate-800">
                    <div className="flex items-start gap-4 mb-2 pr-12">
                        <CheckSquare className="text-slate-400 shrink-0 mt-1" size={24} />
                        <div>
                            <h2 className="text-xl font-bold text-slate-100">{card.title}</h2>
                            <p className="text-sm text-slate-500 mt-1">in list <span className="underline cursor-pointer">List</span></p>
                        </div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="p-6 flex flex-col md:flex-row gap-8">

                    {/* Left Column - Core info */}
                    <div className="flex-1 space-y-8">

                        {/* Description block */}
                        <div className="flex items-start gap-4">
                            <AlignLeft className="text-slate-400 mt-1" size={24} />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-200 mb-3">Description</h3>

                                {isEditingDesc ? (
                                    <div className="space-y-3">
                                        <textarea
                                            ref={descInputRef}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Add a more detailed description..."
                                            className="w-full bg-slate-800 text-slate-200 text-sm border border-blue-500 rounded-lg p-3 min-h-[120px] outline-none resize-y"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    setIsEditingDesc(false);
                                                    setDescription(card.description || '');
                                                }
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveDescription}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium text-sm transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingDesc(false);
                                                    setDescription(card.description || '');
                                                }}
                                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-3 py-2 rounded-md font-medium text-sm transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => canEdit && setIsEditingDesc(true)}
                                        className={`bg-slate-800/50 ${canEdit ? 'hover:bg-slate-800 cursor-pointer' : 'cursor-default'} rounded-lg p-3 min-h-[80px] text-sm transition-colors ${!description && 'text-slate-500 italic'}`}
                                    >
                                        {description || (canEdit ? 'Add a more detailed description...' : 'No description provided')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attachments Section */}
                        {((card.attachments && card.attachments.length > 0) || isUploading) && (
                            <div className="flex items-start gap-4">
                                <Paperclip className="text-slate-400 mt-1" size={24} />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-3">Attachments</h3>
                                    <div className="space-y-3">
                                        {(card.attachments || []).map((attachment) => (
                                            <div key={attachment._id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors group">
                                                <div className="w-12 h-12 bg-slate-900 rounded-md flex items-center justify-center shrink-0 border border-slate-700">
                                                    {attachment.mimetype?.startsWith('image/') ? (
                                                        <img src={attachment.url} alt="thumbnail" className="w-full h-full object-cover rounded-md" />
                                                    ) : (
                                                        <File className="text-slate-400" size={20} />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-200 text-sm truncate">{attachment.filename}</p>
                                                    <span className="text-xs text-slate-500">
                                                        Added {new Date(attachment.uploadedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-900/50 rounded transition-colors"
                                                        title="Download / View"
                                                        download
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => handleDeleteAttachment(attachment._id)}
                                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900/50 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {isUploading && (
                                            <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 animate-pulse">
                                                <div className="w-12 h-12 bg-slate-900 rounded-md"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                                                    <div className="h-3 bg-slate-800 rounded w-1/4"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subtasks / Checklist Section */}
                        <div className="flex items-start gap-4">
                            <CheckSquare className="text-slate-400 mt-1" size={24} />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-200 mb-3">Checklist</h3>

                                {/* Progress Bar */}
                                {totalSubtasksCount > 0 && (
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xs font-semibold text-slate-400 w-8">{subtasksProgress}%</span>
                                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${subtasksProgress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${subtasksProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Subtasks List */}
                                <div className="space-y-2 mb-4">
                                    {(card.subtasks || []).map((subtask) => (
                                        <div key={subtask._id} className="flex items-center gap-3 group/subtask hover:bg-slate-800/50 p-2 rounded-lg transition-colors -mx-2">
                                            <input
                                                type="checkbox"
                                                checked={subtask.isCompleted}
                                                disabled={!canEdit}
                                                onChange={() => handleToggleSubtask(subtask._id)}
                                                className={`w-4 h-4 rounded border-slate-600 bg-slate-800 checked:bg-blue-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                                            />
                                            <span className={`flex-1 text-sm transition-all ${subtask.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                                {subtask.title}
                                            </span>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleDeleteSubtask(subtask._id)}
                                                    className="opacity-0 group-hover/subtask:opacity-100 text-slate-500 hover:text-red-400 p-1 rounded transition-all"
                                                    title="Delete subtask"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {canEdit && (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newSubtaskTitle}
                                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                            placeholder="Add an item..."
                                            className="bg-slate-800 text-slate-200 text-sm border border-slate-700 focus:border-blue-500 rounded-md px-3 py-2 outline-none flex-1 placeholder-slate-500"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddSubtask();
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleAddSubtask}
                                            disabled={!newSubtaskTitle.trim()}
                                            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-3 py-2 rounded-md transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments / Activity Section */}
                        <div className="flex items-start gap-4">
                            <Activity className="text-slate-400 mt-1" size={24} />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-200 mb-4">Activity</h3>

                                {/* Comment Input */}
                                <div className="flex gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold shrink-0 mt-1">
                                        {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="w-full bg-transparent text-slate-200 text-sm p-3 min-h-[80px] outline-none resize-y"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                        handlePostComment();
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-t border-slate-700/50">
                                                <span className="text-xs text-slate-500">Pro tip: press <kbd className="font-sans px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Ctrl</kbd> + <kbd className="font-sans px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Enter</kbd> to save</span>
                                                <button
                                                    onClick={handlePostComment}
                                                    disabled={!commentText.trim()}
                                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-4">
                                    {card.comments && card.comments.length > 0 ? (
                                        [...card.comments].reverse().map((comment, idx) => {
                                            const isPopulated = comment.user && comment.user.name;
                                            const userId = isPopulated ? comment.user._id : comment.user;
                                            const memberData = isPopulated ? comment.user : (boardMembers?.find(m => m._id === userId) || {});
                                            const userName = memberData.name || 'Unknown User';
                                            const userAvatar = userName.charAt(0).toUpperCase();

                                            return (
                                                <div key={comment._id || idx} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold shrink-0">
                                                        {userAvatar}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline gap-2 mb-1">
                                                            <span className="font-semibold text-slate-200 text-sm">{userName}</span>
                                                            <span className="text-xs text-slate-500">
                                                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                                }) : 'Just now'}
                                                            </span>
                                                        </div>
                                                        <div className="bg-slate-800 text-slate-200 text-sm rounded-lg p-3 whitespace-pre-wrap border border-slate-700/50">
                                                            {comment.text}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm italic text-slate-500 text-center py-4">
                                            No comments yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Sidebar actions */}
                    <div className="w-full md:w-48 space-y-6">

                        {/* Actions block */}
                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Add to card</h4>

                            <div className={`space-y-2 relative ${!canEdit && 'opacity-50 pointer-events-none'}`}>
                                {isOwner && (
                                    <button
                                        className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                        onClick={() => setShowMemberSelect(!showMemberSelect)}
                                    >
                                        <Users size={16} /> Members
                                    </button>
                                )}

                                {showMemberSelect && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-10 py-2">
                                        <h5 className="text-xs font-semibold text-slate-400 px-3 mb-2">Board Members</h5>
                                        <div className="max-h-48 overflow-y-auto">
                                            {boardMembers?.map(member => (
                                                <div
                                                    key={member._id}
                                                    onClick={() => toggleMember(member)}
                                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 cursor-pointer"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                                                        {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="text-sm truncate flex-1">{member.name || member.email}</span>
                                                    {assignedIds.includes(member._id) && (
                                                        <span className="text-blue-400 text-xs shrink-0">✓</span>
                                                    )}
                                                </div>
                                            ))}
                                            {(!boardMembers || boardMembers.length === 0) && (
                                                <div className="px-3 py-2 text-sm text-slate-500 italic">No members available</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                    onClick={() => canEdit && setShowDatePicker(!showDatePicker)}
                                    disabled={!canEdit}
                                >
                                    <Calendar size={16} /> Dates
                                </button>

                                {showDatePicker && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-20 p-3">
                                        <h5 className="text-xs font-semibold text-slate-400 mb-2">Due Date</h5>
                                        <input
                                            type="date"
                                            value={localDueDate}
                                            onChange={(e) => setLocalDueDate(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-md p-2 mb-3 outline-none focus:border-blue-500"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDateSave(localDueDate)}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => handleDateSave(null)}
                                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded text-xs font-medium transition-colors"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                    onClick={() => canEdit && setShowPrioritySelect(!showPrioritySelect)}
                                    disabled={!canEdit}
                                >
                                    <Flag size={16} /> Priority
                                </button>

                                {showPrioritySelect && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-20 py-2">
                                        <h5 className="text-xs font-semibold text-slate-400 px-3 mb-2">Select Priority</h5>
                                        <div>
                                            {['Low', 'Mid', 'High'].map(p => (
                                                <div
                                                    key={p}
                                                    onClick={() => handlePrioritySelect(p)}
                                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-700 cursor-pointer text-sm"
                                                >
                                                    <span className={`w-3 h-3 rounded-full ${p === 'High' ? 'bg-red-500' : p === 'Mid' ? 'bg-yellow-500' : 'bg-slate-400'}`}></span>
                                                    <span className="flex-1 text-slate-200">{p}</span>
                                                    {(card.priority || 'Low') === p && <span className="text-blue-400 text-xs shrink-0">✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                    onClick={() => canEdit && setShowLabelSelect(!showLabelSelect)}
                                    disabled={!canEdit}
                                >
                                    <Tag size={16} /> Labels
                                </button>

                                {showLabelSelect && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-20 py-2">
                                        <h5 className="text-xs font-semibold text-slate-400 px-3 mb-2">Labels</h5>
                                        <div className="px-3">
                                            <input
                                                type="text"
                                                value={newLabelText}
                                                onChange={(e) => setNewLabelText(e.target.value)}
                                                placeholder="Add label..."
                                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-md p-2 outline-none focus:border-blue-500 mb-2"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleAddLabel();
                                                }}
                                            />
                                            <button
                                                onClick={handleAddLabel}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium transition-colors"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <button
                                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                    onClick={() => canEdit && setShowCoverSelect(!showCoverSelect)}
                                    disabled={!canEdit}
                                >
                                    <Palette size={16} /> Cover
                                </button>

                                {showCoverSelect && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-20 py-2">
                                        <h5 className="text-xs font-semibold text-slate-400 px-3 mb-2">Select Color</h5>
                                        <div className="px-3 grid grid-cols-4 gap-2">
                                            {[
                                                { name: 'None', color: null },
                                                { name: 'Indigo', color: '#6366f1' },
                                                { name: 'Emerald', color: '#10b981' },
                                                { name: 'Rose', color: '#f43f5e' },
                                                { name: 'Amber', color: '#f59e0b' },
                                                { name: 'Sky', color: '#0ea5e9' },
                                                { name: 'Violet', color: '#8b5cf6' },
                                                { name: 'Slate', color: '#64748b' }
                                            ].map((c, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => handleCoverSelect(c.color)}
                                                    title={c.name}
                                                    className={`w-full h-8 rounded cursor-pointer border-2 transition-transform hover:scale-110 ${card.coverColor === c.color ? 'border-white' : 'border-transparent'}`}
                                                    style={{ backgroundColor: c.color || '#334155' }}
                                                >
                                                    {!c.color && <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">/</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Hidden file input for attachments */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    className="w-full flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-700"
                                    onClick={() => canEdit && fileInputRef.current?.click()}
                                    disabled={!canEdit || isUploading}
                                >
                                    <Paperclip size={16} /> Attachment
                                </button>
                            </div>
                        </div>

                        {/* Current Attributes Display */}
                        {card.labels && card.labels.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Labels</h4>
                                <div className="flex flex-wrap gap-2">
                                    {card.labels.map((label, idx) => (
                                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group">
                                            {label}
                                            <button 
                                                onClick={() => canEdit && handleRemoveLabel(label)} 
                                                disabled={!canEdit}
                                                className={`text-indigo-400 hover:text-indigo-200 ${canEdit ? 'opacity-0 group-hover:opacity-100' : 'hidden'} transition-opacity ml-1`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Priority</h4>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${priorityColors[card.priority || 'Low']}`}>
                                <Flag size={12} />
                                {card.priority || 'Low'}
                            </span>
                        </div>

                        {card.dueDate && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Due Date</h4>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${new Date(card.dueDate) < new Date() ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                    <Calendar size={12} />
                                    {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                        )}

                        {/* Current Assignments Display */}
                        {card.assignedTo && card.assignedTo.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Members</h4>
                                <div className="flex flex-wrap gap-2">
                                    {card.assignedTo.map((user, idx) => (
                                        <div
                                            key={idx}
                                            className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white font-bold cursor-pointer hover:bg-indigo-600 transition-colors"
                                            title={user.name || user.email}
                                        >
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    ))}
                                    {isOwner && (
                                        <button
                                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                                            onClick={() => setShowMemberSelect(!showMemberSelect)}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default CardDetailModal;
