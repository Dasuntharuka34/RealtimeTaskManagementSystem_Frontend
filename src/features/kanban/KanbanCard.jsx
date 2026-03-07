import { useState, useRef, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MoreHorizontal, MessageSquare, Edit2, Trash2, Flag, AlignLeft, GripHorizontal, CheckSquare, Paperclip } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCardLocally, deleteCardLocally } from '../../store/slices/kanbanSlice';
import api from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

const KanbanCard = ({ card, onCardSelect }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState(card.title);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const optionsRef = useRef(null);
    const titleInputRef = useRef(null);

    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.auth);
    const { currentBoard } = useSelector((state) => state.kanban);

    const canEdit = useMemo(() => {
        if (!userInfo || !currentBoard) return false;
        const boardOwnerId = currentBoard.owner._id || currentBoard.owner;
        const isOwner = boardOwnerId.toString() === userInfo._id.toString();
        const assignedIds = card.assignedTo?.map(u => u._id || u) || [];
        const isAssigned = assignedIds.includes(userInfo._id);
        return isOwner || isAssigned;
    }, [userInfo, currentBoard, card.assignedTo]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleRenameSubmit = async () => {
        if (!editTitleValue.trim() || editTitleValue === card.title) {
            setIsEditingTitle(false);
            setEditTitleValue(card.title);
            return;
        }

        try {
            const { data } = await api.put(`/cards/${card._id}`, { title: editTitleValue });
            dispatch(updateCardLocally(data));
            setIsEditingTitle(false);
        } catch (error) {
            console.error('Failed to rename card', error);
            setEditTitleValue(card.title);
            setIsEditingTitle(false);
        }
    };

    const handleDeleteCard = async () => {
        try {
            await api.delete(`/cards/${card._id}`);
            dispatch(deleteCardLocally(card._id));
        } catch (error) {
            console.error('Failed to delete card', error);
        }
    };

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: card._id,
        data: {
            type: 'Card',
            card,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const totalSubtasks = (card.subtasks || []).length;
    const completedSubtasks = (card.subtasks || []).filter(st => st.isCompleted).length;
    const allSubtasksCompleted = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-700/50 border border-blue-500 rounded-lg p-4 mb-3 opacity-50 h-24"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-lg mb-3 shadow-sm hover:shadow-md transition-all group select-none flex flex-col"
        >
            {/* Cover Image or Color Bar */}
            {card.attachments?.some(a => a.mimetype?.startsWith('image/')) ? (
                <div className="w-full h-32 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.3)] rounded-t-lg overflow-hidden group-hover:opacity-90 transition-opacity">
                    <img 
                        src={card.attachments.find(a => a.mimetype?.startsWith('image/')).url} 
                        alt="attachment preview" 
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : card.coverColor && (
                <div
                    className="w-full h-1 shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.3)] rounded-t-lg"
                    style={{ backgroundColor: card.coverColor }}
                />
            )}
            {/* Minimal Drag Handle Header */}
            <div
                {...(canEdit ? attributes : {})}
                {...(canEdit ? listeners : {})}
                className={`w-full h-4 flex justify-center items-center ${canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} opacity-0 group-hover:opacity-100 bg-slate-700/30 rounded-t-lg transition-opacity`}
            >
                {canEdit && <GripHorizontal size={14} className="text-slate-500" />}
            </div>

            {/* Clickable Card Body */}
            <div
                className="p-3 pt-1 w-full flex-1 text-left cursor-pointer"
                onClick={(e) => {
                    // Ignore clicks if they originated from interactive elements
                    if (
                        e.target.tagName.toLowerCase() === 'button' ||
                        e.target.tagName.toLowerCase() === 'textarea' ||
                        e.target.tagName.toLowerCase() === 'input' ||
                        e.target.closest('button')
                    ) {
                        return;
                    }

                    if (!isEditingTitle && !showOptions && onCardSelect) {
                        onCardSelect(card);
                    }
                }}
            >
                <div className="flex justify-between items-start mb-2 relative z-20">
                    {isEditingTitle ? (
                        <textarea
                            ref={titleInputRef}
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleRenameSubmit();
                                }
                                if (e.key === 'Escape') {
                                    setIsEditingTitle(false);
                                    setEditTitleValue(card.title);
                                }
                            }}
                            className="text-sm font-medium text-slate-200 bg-slate-900 border-blue-500 rounded-md px-2 py-1 outline-none w-full mr-2 resize-none overflow-hidden"
                            rows={2}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <h4 className="text-sm font-medium text-slate-200 pr-6 break-words">{card.title}</h4>
                    )}

                    <div className="absolute right-0 top-0" ref={optionsRef}>
                        {canEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptions(!showOptions);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="text-slate-500 hover:text-slate-300 bg-slate-800 rounded-md p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                        )}

                        {showOptions && (
                            <div
                                className="absolute top-full right-0 mt-1 w-36 bg-slate-700 border border-slate-600 rounded-md shadow-xl z-50 py-1"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowOptions(false);
                                        setIsEditingTitle(true);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-600 flex items-center gap-2"
                                >
                                    <Edit2 size={13} /> Edit Title
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowOptions(false);
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-slate-600 hover:text-red-300 flex items-center gap-2"
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative z-10">
                    {card.labels && card.labels.length > 0 && (
                        <div className="flex gap-1.5 mb-3 flex-wrap">
                            {card.labels.map((label, idx) => (
                                <span key={idx} className="px-2 py-0.5 text-[10px] font-medium rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 line-clamp-1 truncate max-w-full">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    {card.description && (
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{card.description}</p>
                    )}

                    {totalSubtasks > 0 && (
                        <div className="space-y-1.5 mb-3">
                            {card.subtasks.map((subtask, idx) => (
                                <div key={idx} className="flex items-center gap-2 group/subtask">
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${subtask.isCompleted ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-slate-600 text-transparent'}`}>
                                        <CheckSquare size={10} strokeWidth={3} className={subtask.isCompleted ? 'opacity-100' : 'opacity-0'} />
                                    </div>
                                    <span className={`text-[11px] truncate flex-1 ${subtask.isCompleted ? 'text-green-400/80' : 'text-slate-300'}`}>
                                        {subtask.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                        <div className="flex items-center gap-3 text-slate-500 flex-wrap">
                            {(card.priority && card.priority !== 'Low') && (
                                <div className={`flex items-center gap-1 text-xs font-medium ${card.priority === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    <Flag size={12} />
                                    <span>{card.priority}</span>
                                </div>
                            )}
                            {card.dueDate && (
                                <div className={`flex items-center gap-1 text-xs ${new Date(card.dueDate) < new Date() ? 'text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded' : 'text-slate-400'}`}>
                                    <Calendar size={12} />
                                    <span>{new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                            {card.description && (
                                <div className="flex items-center gap-1 text-xs text-slate-400" title="Has description">
                                    <AlignLeft size={12} />
                                </div>
                            )}
                            {totalSubtasks > 0 && (
                                <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${allSubtasksCompleted ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-700/50'}`} title="Checklist items">
                                    <CheckSquare size={12} />
                                    <span>{completedSubtasks}/{totalSubtasks}</span>
                                </div>
                            )}
                            {card.comments?.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                                    <MessageSquare size={12} />
                                    <span>{card.comments.length}</span>
                                </div>
                            )}
                            {card.attachments?.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded" title="Attachments">
                                    <Paperclip size={12} />
                                    <span>{card.attachments.length}</span>
                                </div>
                            )}
                        </div>

                        {/* Assigned Users Placeholder */}
                        <div className="flex -space-x-2 shrink-0">
                            {card.assignedTo?.slice(0, 3).map((user, idx) => (
                                <div key={idx} className="w-6 h-6 rounded-full bg-indigo-500 border border-slate-800 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden" title={user.name || user.email}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteCard}
                title="Delete Card"
                message={`Are you sure you want to delete "${card.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default KanbanCard;
