const chatPedidoSocket = (io) => {
    io.on('connection', (socket) => {

        // Unirse a la sala del chat de un pedido
        socket.on('unirse-chat-pedido', (pedidoId) => {
            socket.join(`pedido-chat-${pedidoId}`);
            console.log(`Socket ${socket.id} unido al chat del pedido ${pedidoId}`);
        });

        // Salir de la sala del chat de un pedido
        socket.on('salir-chat-pedido', (pedidoId) => {
            socket.leave(`pedido-chat-${pedidoId}`);
            console.log(`Socket ${socket.id} salió del chat del pedido ${pedidoId}`);
        });
    });
};

export default chatPedidoSocket;