import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'DELETE']
        }
    });

    io.on('connection', (socket) => {
        console.log(`🟢 New WebSocket connection: ${socket.id}`);
        socket.on('disconnect', () => {
            console.log(`🔴 WebSocket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        console.warn('Socket.io not initialized yet!');
        return null;
    }
    return io;
};
