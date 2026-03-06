/**
 * Singleton Socket Service
 * 
 * This module provides a single shared socket.io instance across the entire frontend.
 * Components should import `getSocket()` to get the current connected socket instance,
 * and BoardView should call `initSocket(boardId)` on mount and `disconnectSocket()` on unmount.
 */
import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (boardId) => {
    if (socket) {
        socket.disconnect();
    }
    socket = io(import.meta.env.VITE_BACKEND_URL);
    socket.emit('join-board', boardId);
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = (boardId) => {
    if (socket) {
        if (boardId) socket.emit('leave-board', boardId);
        socket.disconnect();
        socket = null;
    }
};
