import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setLists, setCards, setCurrentBoard } from '../store/slices/kanbanSlice';
import api from '../services/api';
import { initPusher, disconnectPusher } from '../services/pusherService';
import KanbanBoard from '../features/kanban/KanbanBoard';
import BoardSettingsPanel from '../features/kanban/BoardSettingsPanel';
import InviteModal from '../features/kanban/InviteModal';
import CardDetailModal from '../features/kanban/CardDetailModal';
import BoardFilters from '../features/kanban/BoardFilters';
import { LayoutDashboard, Users, Lock, Globe, Settings, ChevronLeft, Search, Filter, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const BoardView = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBoard, cards } = useSelector((state) => state.kanban);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [filters, setFilters] = useState({
        text: '',
        labels: [],
        priorities: [],
        members: []
    });

    const selectedCard = cards?.find(c => c._id === selectedCardId);

    // Extract all unique labels from all cards for the filter dropdown
    const allLabels = useMemo(() => {
        const labels = new Set();
        cards?.forEach(card => {
            card.labels?.forEach(label => labels.add(label));
        });
        return Array.from(labels).sort();
    }, [cards]);

    // Apply filters
    const filteredCards = useMemo(() => {
        if (!cards) return [];

        return cards.filter(card => {
            // Text search (Title or Description)
            if (filters.text) {
                const searchLower = filters.text.toLowerCase();
                const titleMatch = card.title?.toLowerCase().includes(searchLower);
                const descMatch = card.description?.toLowerCase().includes(searchLower);
                if (!titleMatch && !descMatch) return false;
            }

            // Priority filter
            if (filters.priorities.length > 0) {
                if (!filters.priorities.includes(card.priority || 'Low')) return false;
            }

            // Label filter (Card must have AT LEAST ONE of the selected labels)
            if (filters.labels.length > 0) {
                const cardLabels = card.labels || [];
                const hasLabel = filters.labels.some(l => cardLabels.includes(l));
                if (!hasLabel) return false;
            }

            // Member filter (Card must be assigned to AT LEAST ONE of the selected members)
            if (filters.members.length > 0) {
                const assignedIds = card.assignedTo?.map(u => u._id || u) || [];
                const hasMember = filters.members.some(mId => assignedIds.includes(mId));
                if (!hasMember) return false;
            }

            return true;
        });
    }, [cards, filters]);

    // Fetch Board Data
    const fetchBoardData = async () => {
        try {
            const [boardRes, listsRes, cardsRes] = await Promise.all([
                api.get(`/boards/${id}`),
                api.get(`/lists/${id}`),
                api.get(`/cards/board/${id}`)
            ]);

            dispatch(setCurrentBoard(boardRes.data));
            dispatch(setLists(listsRes.data));
            dispatch(setCards(cardsRes.data));
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch board data', error);
            navigate('/dashboard');
        }
    };

    useEffect(() => {
        fetchBoardData();

        // Setup Pusher for real-time updates
        initPusher(id, () => {
            fetchBoardData();
        });

        return () => {
            disconnectPusher(id);
        };
        // eslint-disable-next-line
    }, [id, dispatch]);

    // Called after settings/invite changes
    const handleBoardUpdated = () => {
        // Triggers are now handled by the backend
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-400 font-medium">Loading workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
            {/* Board Header */}
            <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/80 px-3 py-2 sm:p-4 shrink-0 z-10">
                {/* Row 1: Back + Title */}
                <div className="flex items-center gap-2 sm:gap-4 text-slate-100 mb-2 sm:mb-0">
                    <Link to="/dashboard" className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors shrink-0">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="hidden sm:block h-6 w-px bg-slate-700"></div>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <LayoutDashboard className="text-blue-500 shrink-0" size={18} />
                        <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">{currentBoard?.title}</h1>
                        <span className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md flex items-center gap-1 sm:gap-1.5 border border-slate-600/50 shrink-0">
                            {currentBoard?.privacy === 'Private' ? <Lock size={11} /> : <Globe size={11} />}
                            <span className="hidden xs:inline">{currentBoard?.privacy}</span>
                        </span>
                    </div>

                    {/* Desktop: Members + Actions */}
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                        <div className="flex -space-x-2 mr-2">
                            {currentBoard?.members?.slice(0, 4).map((member, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-800 flex items-center justify-center text-xs text-white font-bold" title={member.name}>
                                    {member.name?.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {currentBoard?.members?.length > 4 && (
                                <div className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-300 font-bold">
                                    +{currentBoard.members.length - 4}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md font-medium transition-colors text-sm border border-slate-600/50"
                        >
                            <Users size={16} />
                            <span>Invite</span>
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-md transition-colors"
                            title="Board Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <Link
                            to="/profile"
                            className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-md transition-colors"
                            title="Profile Settings"
                        >
                            <User size={20} />
                        </Link>
                    </div>
                </div>

                {/* Row 2: Members + Actions on mobile */}
                <div className="flex sm:hidden items-center justify-between pl-9 mt-1">
                    <div className="flex -space-x-2">
                        {currentBoard?.members?.slice(0, 3).map((member, idx) => (
                            <div key={idx} className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-slate-800 flex items-center justify-center text-[10px] text-white font-bold" title={member.name}>
                                {member.name?.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {currentBoard?.members?.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                                +{currentBoard.members.length - 3}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors text-xs border border-slate-600/50"
                        >
                            <Users size={13} />
                            <span>Invite</span>
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-md transition-colors"
                            title="Board Settings"
                        >
                            <Settings size={17} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-slate-800/40 border-b border-slate-700/50 px-4 sm:px-6">
                <BoardFilters
                    filters={filters}
                    setFilters={setFilters}
                    boardMembers={currentBoard?.members || []}
                    allLabels={allLabels}
                />
            </div>

            {/* Board Canvas */}
            <main className="flex-1 p-3 sm:p-6 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-slate-900/95">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-slate-900 to-slate-900 pointer-events-none"></div>
                <div className="h-full relative z-10">
                    <KanbanBoard
                        boardId={id}
                        cards={filteredCards}
                        onCardSelect={(card) => setSelectedCardId(card._id)}
                    />
                </div>
            </main>

            {/* Card Detail Modal */}
            {selectedCard && (
                <CardDetailModal
                    card={selectedCard}
                    boardMembers={currentBoard?.members || []}
                    onClose={() => setSelectedCardId(null)}
                />
            )}

            {/* Settings Panel */}
            {showSettings && (
                <BoardSettingsPanel
                    onClose={() => setShowSettings(false)}
                    onBoardUpdated={handleBoardUpdated}
                />
            )}

            {/* Invite Modal */}
            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onBoardUpdated={handleBoardUpdated}
                />
            )}
        </div>
    );
};

export default BoardView;
