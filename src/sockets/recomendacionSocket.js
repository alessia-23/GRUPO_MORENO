const recomendacionSocket = (io) => {
    io.on('connection', (socket) => {
        // Sala general donde se conectan los administradores
        socket.on('unirse-recomendaciones-admin', () => {
            socket.join('recomendaciones-admin');
            console.log(`Socket ${socket.id} unido a recomendaciones-admin`);
        });

        // Sala personal del vendedor
        socket.on('unirse-mis-recomendaciones', (vendedorId) => {
            socket.join(`mis-recomendaciones-${vendedorId}`);
            console.log(`Socket ${socket.id} unido a mis-recomendaciones-${vendedorId}`);
        });

        socket.on('salir-recomendaciones-admin', () => {
            socket.leave('recomendaciones-admin');
        });

        socket.on('salir-mis-recomendaciones', (vendedorId) => {
            socket.leave(`mis-recomendaciones-${vendedorId}`);
        });
    });
};

export default recomendacionSocket;