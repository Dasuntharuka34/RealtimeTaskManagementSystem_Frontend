import { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanList from './KanbanList';
import KanbanCard from './KanbanCard';
import { useDispatch, useSelector } from 'react-redux';
import { updateListOrderLocally, updateCardOrderLocally, addList, moveCard } from '../../store/slices/kanbanSlice';
import { store } from '../../store/store';
import api from '../../services/api';
import { getSocket } from '../../services/socketService';
import { Plus } from 'lucide-react';

const KanbanBoard = ({ boardId, cards: propCards, onCardSelect }) => {
    const dispatch = useDispatch();
    const { lists, cards: reduxCards } = useSelector((state) => state.kanban);

    // Use cards from props (filtered) or fallback to all cards from redux
    const cards = propCards || reduxCards;

    const [activeCard, setActiveCard] = useState(null);
    const [activeList, setActiveList] = useState(null);
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');

    const listIds = useMemo(() => lists.map((l) => l._id), [lists]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // 5px drag before activation to allow clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            const { data } = await api.post('/lists', {
                title: newListTitle,
                boardId
            });
            dispatch(addList(data));
            setNewListTitle('');
            setIsAddingList(false);

            getSocket()?.emit('list-updated', { boardId });
        } catch (error) {
            console.error('Failed to create list', error);
        }
    };

    const onDragStart = (event) => {
        const { current } = event.active.data;
        if (current?.type === 'List') setActiveList(current.list);
        if (current?.type === 'Card') setActiveCard(current.card);
    };

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;
        if (activeId === overId) return;

        const isActiveCard = active.data.current?.type === 'Card';
        const isOverCard = over.data.current?.type === 'Card';
        const isOverList = over.data.current?.type === 'List';

        if (!isActiveCard) return;

        // Dropping a card over another card
        if (isActiveCard && isOverCard) {
            dispatch(moveCard({ activeId, overId, isOverList: false }));
        }

        // Dropping a card over an empty list or the list container
        if (isActiveCard && isOverList) {
            dispatch(moveCard({ activeId, overId, isOverList: true }));
        }
    };

    const onDragEnd = async (event) => {
        setActiveCard(null);
        setActiveList(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveList = active.data.current?.type === 'List';
        const isActiveCard = active.data.current?.type === 'Card';

        if (isActiveList) {
            if (activeId === overId) return;
            const activeIndex = lists.findIndex((l) => l._id === activeId);
            const overIndex = lists.findIndex((l) => l._id === overId);

            const newLists = arrayMove(lists, activeIndex, overIndex).map((list, idx) => ({
                ...list, position: idx
            }));

            dispatch(updateListOrderLocally(newLists));
            try {
                await api.put('/lists/reorder', { lists: newLists });

                getSocket()?.emit('list-updated', { boardId });
            } catch (error) {
                console.error('Failed to save list order', error);
            }
        }

        if (isActiveCard) {
            // Read latest cards array from store to avoid stale closure
            const latestCards = store.getState().kanban.cards;

            // Re-calculate positions within the lists and save
            const cardsToUpdate = latestCards.map((card, idx) => ({
                ...card, position: idx
            }));

            dispatch(updateCardOrderLocally(cardsToUpdate));

            try {
                await api.put('/cards/reorder', { cards: cardsToUpdate });

                getSocket()?.emit('card-moved', { boardId });
            } catch (error) {
                console.error('Failed to save card order', error);
            }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-3 sm:gap-6 h-full overflow-x-auto pb-4 custom-scrollbar items-start px-1 sm:px-2">
                <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
                    {lists.map((list) => (
                        <KanbanList
                            key={list._id}
                            list={list}
                            cards={cards.filter((c) => c.listId === list._id)}
                            onCardSelect={onCardSelect}
                        />
                    ))}
                </SortableContext>

                {/* Add List Button */}
                <div className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 rounded-xl w-72 sm:w-80 shrink-0 transition-colors">
                    {isAddingList ? (
                        <form onSubmit={handleAddList} className="p-3">
                            <input
                                autoFocus
                                type="text"
                                value={newListTitle}
                                onChange={(e) => setNewListTitle(e.target.value)}
                                placeholder="Enter list title..."
                                className="w-full bg-slate-900 text-slate-200 text-sm border border-blue-500 rounded-lg p-2.5 outline-none mb-3 placeholder-slate-500"
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                                >
                                    Add List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddingList(false);
                                        setNewListTitle('');
                                    }}
                                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-700 p-2 rounded-md transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsAddingList(true)}
                            className="w-full p-4 flex items-center gap-2 text-slate-300 hover:text-white font-medium transition-colors"
                        >
                            <Plus size={20} />
                            Add list
                        </button>
                    )}
                </div>
            </div>

            <DragOverlay>
                {activeList && <KanbanList list={activeList} cards={cards.filter(c => c.listId === activeList._id)} />}
                {activeCard && <KanbanCard card={activeCard} />}
            </DragOverlay>
        </DndContext>
    );
};

export default KanbanBoard;
