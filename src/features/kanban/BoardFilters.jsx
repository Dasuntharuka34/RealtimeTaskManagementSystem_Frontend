import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const BoardFilters = ({
    filters,
    setFilters,
    boardMembers,
    allLabels
}) => {
    const [showLabelFilter, setShowLabelFilter] = useState(false);
    const [showPriorityFilter, setShowPriorityFilter] = useState(false);
    const [showMemberFilter, setShowMemberFilter] = useState(false);

    const toggleLabel = (label) => {
        const newLabels = filters.labels.includes(label)
            ? filters.labels.filter(l => l !== label)
            : [...filters.labels, label];
        setFilters({ ...filters, labels: newLabels });
    };

    const togglePriority = (priority) => {
        const newPriorities = filters.priorities.includes(priority)
            ? filters.priorities.filter(p => p !== priority)
            : [...filters.priorities, priority];
        setFilters({ ...filters, priorities: newPriorities });
    };

    const toggleMember = (memberId) => {
        const newMembers = filters.members.includes(memberId)
            ? filters.members.filter(m => m !== memberId)
            : [...filters.members, memberId];
        setFilters({ ...filters, members: newMembers });
    };

    const clearFilters = () => {
        setFilters({
            text: '',
            labels: [],
            priorities: [],
            members: []
        });
    };

    const hasActiveFilters = filters.text !== '' || filters.labels.length > 0 || filters.priorities.length > 0 || filters.members.length > 0;

    return (
        <div className="flex flex-wrap items-center gap-3 py-2 px-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                    type="text"
                    placeholder="Search cards..."
                    value={filters.text}
                    onChange={(e) => setFilters({ ...filters, text: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 outline-none focus:border-blue-500 transition-colors"
                />
                {filters.text && (
                    <button
                        onClick={() => setFilters({ ...filters, text: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {/* Priority Filter */}
                <div className="relative">
                    <button
                        onClick={() => setShowPriorityFilter(!showPriorityFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${filters.priorities.length > 0 ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                        Priority {filters.priorities.length > 0 && `(${filters.priorities.length})`}
                        <ChevronDown size={14} />
                    </button>
                    {showPriorityFilter && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1">
                            {['Low', 'Mid', 'High'].map(p => (
                                <label key={p} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={filters.priorities.includes(p)}
                                        onChange={() => togglePriority(p)}
                                        className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                    />
                                    {p}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Label Filter */}
                <div className="relative">
                    <button
                        onClick={() => setShowLabelFilter(!showLabelFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${filters.labels.length > 0 ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                        Labels {filters.labels.length > 0 && `(${filters.labels.length})`}
                        <ChevronDown size={14} />
                    </button>
                    {showLabelFilter && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1">
                            {allLabels.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto">
                                    {allLabels.map(label => (
                                        <label key={label} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={filters.labels.includes(label)}
                                                onChange={() => toggleLabel(label)}
                                                className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                            />
                                            <span className="truncate">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-2 text-xs text-slate-500 italic">No labels on this board</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Member Filter */}
                <div className="relative">
                    <button
                        onClick={() => setShowMemberFilter(!showMemberFilter)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${filters.members.length > 0 ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    >
                        Members {filters.members.length > 0 && `(${filters.members.length})`}
                        <ChevronDown size={14} />
                    </button>
                    {showMemberFilter && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1">
                            {boardMembers.length > 0 ? (
                                <div className="max-h-48 overflow-y-auto">
                                    {boardMembers.map(member => (
                                        <label key={member._id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={filters.members.includes(member._id)}
                                                onChange={() => toggleMember(member._id)}
                                                className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                                            />
                                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0 overflow-hidden">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="truncate">{member.name || member.email}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-3 py-2 text-xs text-slate-500 italic">No members available</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X size={14} /> Clear
                    </button>
                )}
            </div>
        </div>
    );
};

export default BoardFilters;
