import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setBoards } from '../store/slices/kanbanSlice';
import { logout } from '../store/slices/authSlice';
import api from '../services/api';
import { initSocket, disconnectSocket } from '../services/socketService';
import { LogOut, Plus, Layout, User } from 'lucide-react';

const Dashboard = () => {
    const [showModal, setShowModal] = useState(false);
    const [newBoardTitle, setNewBoardTitle] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const { boards } = useSelector((state) => state.kanban);

    useEffect(() => {
        const fetchBoards = async () => {
            try {
                const { data } = await api.get('/boards');
                dispatch(setBoards(data));
            } catch (error) {
                console.error('Failed to fetch boards', error);
            }
        };
        fetchBoards();

        const socket = initSocket('dashboard');
        socket.on('dashboard-updated', () => {
            fetchBoards();
        });

        return () => disconnectSocket('dashboard');
    }, [dispatch]);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle.trim()) return;
        try {
            const { data } = await api.post('/boards', { title: newBoardTitle });
            dispatch(setBoards([...boards, data]));
            setShowModal(false);
            setNewBoardTitle('');
            navigate(`/b/${data._id}`);
        } catch (error) {
            console.error('Failed to create board', error);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-lg sm:text-xl font-bold min-w-0">
                    <Layout className="text-blue-400 shrink-0" />
                    <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent truncate">Kanban Workspace</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <Link to="/profile" className="flex items-center gap-2 hover:bg-slate-700/50 p-1.5 rounded-md transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
                            {userInfo?.avatar ? (
                                <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full object-cover" />
                            ) : (
                                userInfo?.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <span className="text-sm text-slate-300 hidden sm:block group-hover:text-white">{userInfo?.name}</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-red-400 p-2 rounded-md hover:bg-slate-700/50 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 sm:p-6 md:p-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-200">Your Boards</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-colors shrink-0 text-sm sm:text-base"
                    >
                        <Plus size={18} />
                        <span className="hidden xs:inline sm:inline">Create Board</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {boards.map((board) => (
                        <Link
                            key={board._id}
                            to={`/b/${board._id}`}
                            className="bg-slate-800 border border-slate-700 hover:border-blue-500 rounded-lg p-6 flex flex-col items-start justify-between h-32 group transition-all hover:shadow-lg hover:shadow-blue-900/20"
                        >
                            <h3 className="font-semibold text-lg text-slate-200 group-hover:text-blue-400 transition-colors">{board.title}</h3>
                            <span className="text-xs text-slate-500 mt-2 line-clamp-2">{board.description || 'No description'}</span>
                        </Link>
                    ))}

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-slate-800/50 border border-dashed border-slate-600 hover:border-slate-400 rounded-lg p-6 flex flex-col items-center justify-center h-32 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <Plus size={24} className="mb-2" />
                        <span className="font-medium">Create new board</span>
                    </button>
                </div>
            </main>

            {/* Create Board Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-100 mb-4">Create Board</h3>
                            <form onSubmit={handleCreateBoard}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Board Title</label>
                                    <input
                                        type="text"
                                        value={newBoardTitle}
                                        onChange={(e) => setNewBoardTitle(e.target.value)}
                                        placeholder="e.g. Project Alpha"
                                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-slate-100 placeholder-slate-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-md transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
