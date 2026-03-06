import { useMemo, useState, useRef, useEffect } from 'react';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';
import { Plus, MoreHorizontal, Trash2, Edit2, GripHorizontal } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addCard, updateListLocally, deleteListLocally } from '../../store/slices/kanbanSlice';
import api from '../../services/api';
import { getSocket } from '../../services/socketService';
import ConfirmModal from '../../components/common/ConfirmModal';

const KanbanList = ({ list, cards, onCardSelect }) => {
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [showOptions, setShowOptions] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitleValue, setEditTitleValue] = useState(list.title);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const optionsRef = useRef(null);
    const titleInputRef = useRef(null);

    const dispatch = useDispatch();

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

    const cardIds = useMemo(() => cards.map((c) => c._id), [cards]);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: list._id,
        data: {
            type: 'List',
            list,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;

        try {
            const { data } = await api.post('/cards', {
                title: newCardTitle,
                listId: list._id,
                boardId: list.boardId
            });
            dispatch(addCard(data));
            setNewCardTitle('');
            setIsAddingCard(false);

            // Emit socket event to notify other clients
            getSocket()?.emit('list-updated', { boardId: list.boardId });
        } catch (error) {
            console.error('Failed to create card', error);
        }
    };

    const handleRenameSubmit = async () => {
        if (!editTitleValue.trim() || editTitleValue === list.title) {
            setIsEditingTitle(false);
            setEditTitleValue(list.title);
            return;
        }

        try {
            const { data } = await api.put(`/lists/${list._id}`, { title: editTitleValue });
            dispatch(updateListLocally(data));
            setIsEditingTitle(false);

            // Emit socket event
            getSocket()?.emit('list-updated', { boardId: list.boardId });
        } catch (error) {
            console.error('Failed to rename list', error);
            setEditTitleValue(list.title);
            setIsEditingTitle(false);
        }
    };

    const handleDeleteList = async () => {
        try {
            await api.delete(`/lists/${list._id}`);
            dispatch(deleteListLocally(list._id));

            // Emit socket event
            getSocket()?.emit('list-updated', { boardId: list.boardId });
        } catch (error) {
            console.error('Failed to delete list', error);
        }
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-slate-800/50 border border-blue-500 rounded-xl w-72 sm:w-80 shrink-0 opacity-50 flex flex-col max-h-[calc(100vh-140px)] p-2"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-slate-900 border border-slate-700 rounded-xl w-72 sm:w-80 shrink-0 flex flex-col max-h-[calc(100vh-140px)] group/list"
        >
            <div
                className="p-3 flex items-center justify-between border-b border-transparent group-hover/list:border-slate-800 transition-colors bg-slate-800/20"
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Dedicated Drag Handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 opacity-0 group-hover/list:opacity-100 transition-opacity"
                    >
                        <GripHorizontal size={16} />
                    </div>

                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onBlur={handleRenameSubmit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit();
                                if (e.key === 'Escape') {
                                    setIsEditingTitle(false);
                                    setEditTitleValue(list.title);
                                }
                            }}
                            className="font-semibold text-slate-200 text-sm bg-slate-800 border-blue-500 rounded-md px-2 py-1 outline-none w-full mr-2"
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <h3 className="font-semibold text-slate-200 text-sm tracking-wide bg-slate-800/50 px-3 py-1 rounded-md max-w-[80%] truncate">
                            {list.title} <span className="text-slate-500 font-normal ml-1">({cards.length})</span>
                        </h3>
                    )}
                </div>

                <div className="relative" ref={optionsRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOptions(!showOptions);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {showOptions && (
                        <div
                            className="absolute top-full right-0 mt-1 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 py-1"
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptions(false);
                                    setIsEditingTitle(true);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                            >
                                <Edit2 size={14} /> Rename
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowOptions(false);
                                    setShowDeleteConfirm(true);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete List
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <KanbanCard key={card._id} card={card} onCardSelect={onCardSelect} />
                    ))}
                </SortableContext>

                {isAddingCard ? (
                    <form onSubmit={handleAddCard} className="mt-2">
                        <textarea
                            autoFocus
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            placeholder="Enter a title for this card..."
                            className="w-full bg-slate-800 text-slate-200 text-sm border border-blue-500 rounded-lg p-3 outline-none resize-none mb-2 placeholder-slate-500 shadow-sm"
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddCard(e);
                                }
                            }}
                        />
                        <div className="flex items-center gap-2">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
                            >
                                Add Card
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingCard(false);
                                    setNewCardTitle('');
                                }}
                                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-1.5 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAddingCard(true)}
                        className="w-full mt-2 flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-2.5 rounded-lg transition-colors font-medium"
                    >
                        <Plus size={16} />
                        Add a card
                    </button>
                )}
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteList}
                title="Delete List"
                message={`Are you sure you want to delete "${list.title}" and all its cards? This action cannot be undone.`}
                confirmText="Delete List"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default KanbanList;
