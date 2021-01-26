const server = require('http').createServer((request, response) => {
    response.write(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    });
    response.end('hello adventure');
});

const socketIo = require('socket.io');
const io = socketIo(server, {
    cors: {
        origin: '*',
        credential: false,
    },
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId) => {
        //add users at the same room
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);
        //disconnecting a user from a room and notify all members
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });
    });
});

const startServer = () => {
    const { address, port } = server.address();
    console.info(`app running at ${address}:${port}`);
};

server.listen(process.env.PORT || 3000, startServer);
