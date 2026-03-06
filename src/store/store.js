import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import kanbanReducer from './slices/kanbanSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        kanban: kanbanReducer,
    },
});
