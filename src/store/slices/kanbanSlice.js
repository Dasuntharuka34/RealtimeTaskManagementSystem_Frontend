import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    boards: [],
    currentBoard: null,
    lists: [],
    cards: [],
    isLoading: false,
    error: null,
};

const kanbanSlice = createSlice({
    name: 'kanban',
    initialState,
    reducers: {
        setBoards: (state, action) => {
            state.boards = action.payload;
        },
        setCurrentBoard: (state, action) => {
            state.currentBoard = action.payload;
        },
        setLists: (state, action) => {
            state.lists = action.payload;
        },
        setCards: (state, action) => {
            state.cards = action.payload;
        },
        updateListOrderLocally: (state, action) => {
            state.lists = action.payload; // Already reordered array
        },
        updateCardOrderLocally: (state, action) => {
            state.cards = action.payload; // Already reordered array
        },
        addList: (state, action) => {
            state.lists.push(action.payload);
        },
        addCard: (state, action) => {
            state.cards.push(action.payload);
        },
        updateCardLocally: (state, action) => {
            const index = state.cards.findIndex(c => c._id === action.payload._id);
            if (index !== -1) {
                state.cards[index] = { ...state.cards[index], ...action.payload };
            }
        },
        deleteCardLocally: (state, action) => {
            state.cards = state.cards.filter(c => c._id !== action.payload);
        },
        updateListLocally: (state, action) => {
            const index = state.lists.findIndex(l => l._id === action.payload._id);
            if (index !== -1) {
                state.lists[index] = action.payload;
            }
        },
        deleteListLocally: (state, action) => {
            state.lists = state.lists.filter(l => l._id !== action.payload);
            state.cards = state.cards.filter(c => c.listId !== action.payload); // OPTIONAL depending on fetching, but keeps state clean
        },
        updateCurrentBoard: (state, action) => {
            state.currentBoard = { ...state.currentBoard, ...action.payload };
        },
        moveCard: (state, action) => {
            const { activeId, overId, isOverList } = action.payload;
            const activeIndex = state.cards.findIndex(c => c._id === activeId);
            if (activeIndex === -1) return;

            if (isOverList) {
                if (state.cards[activeIndex].listId !== overId) {
                    state.cards[activeIndex].listId = overId;
                    const item = state.cards[activeIndex];
                    state.cards.splice(activeIndex, 1);
                    state.cards.push(item);
                }
            } else {
                const overIndex = state.cards.findIndex(c => c._id === overId);
                if (overIndex === -1) return;

                state.cards[activeIndex].listId = state.cards[overIndex].listId;
                const item = state.cards[activeIndex];
                state.cards.splice(activeIndex, 1);
                state.cards.splice(overIndex, 0, item);
            }
        }
    },
});

export const {
    setBoards, setCurrentBoard, setLists, setCards,
    updateListOrderLocally, updateCardOrderLocally,
    addList, addCard, updateCardLocally, deleteCardLocally, updateListLocally, deleteListLocally, updateCurrentBoard, moveCard
} = kanbanSlice.actions;

export default kanbanSlice.reducer;
