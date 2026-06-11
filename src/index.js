import 'dotenv/config';

import http from 'http';
import { Server } from 'socket.io';

import app from './server.js';
import connection from './config/database.js';
import createAdminSeed from './Seeds/AdministradorSeed.js';
import pedidoSocket from './sockets/pedidoSocket.js';
import chatPedidoSocket from './sockets/chatPedidoSocket.js';
import quejaSugerenciaSocket from './sockets/quejaSugerenciaSocket.js';

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Guardar io en express
app.set('io', io);
pedidoSocket(io);
chatPedidoSocket(io);
quejaSugerenciaSocket(io);

// Eventos socket
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Iniciar servidor
const iniciarServidor = async () => {
    try {
        await connection();
        await createAdminSeed();

        server.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar servidor:', error.message);
    }
};

iniciarServidor();