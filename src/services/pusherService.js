import Pusher from 'pusher-js';

let pusher = null;

export const initPusher = (boardId, onUpdate) => {
    if (!pusher) {
        pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
            cluster: import.meta.env.VITE_PUSHER_CLUSTER,
        });
    }

    const channel = pusher.subscribe(`board-${boardId}`);
    channel.bind('board-updated', () => {
        console.log('Real-time update received via Pusher');
        onUpdate();
    });

    return pusher;
};

export const disconnectPusher = (boardId) => {
    if (pusher) {
        pusher.unsubscribe(`board-${boardId}`);
    }
};
