const quejaSugerenciaSocket = (io) => {
    io.on('connection', (socket) => {
        // Sala general donde se conectan los administradores
        socket.on('unirse-quejas-admin', () => {
            socket.join('quejas-admin');
            console.log(`Socket ${socket.id} unido a quejas-admin`);
        });
        // Sala personal del usuario cliente
        socket.on('unirse-mis-quejas', (usuarioId) => {
            socket.join(`mis-quejas-${usuarioId}`);
            console.log(`Socket ${socket.id} unido a mis-quejas-${usuarioId}`);
        });
        socket.on('salir-quejas-admin', () => {
            socket.leave('quejas-admin');
        });
        socket.on('salir-mis-quejas', (usuarioId) => {
            socket.leave(`mis-quejas-${usuarioId}`);
        });
    });
};

export default quejaSugerenciaSocket;