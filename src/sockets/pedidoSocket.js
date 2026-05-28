import mongoose from 'mongoose';
import Pedido from '../models/Pedido.js';

const pedidoSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        socket.on('pedidos:listar', async (filtros = {}) => {
            try {
                const {
                    page = 1,
                    limit = 10,
                    estado,
                    cliente,
                    vendedor
                } = filtros;

                const paginaActual = Number(page);
                const limite = Number(limit);

                if (paginaActual < 1 || limite < 1) {
                    return socket.emit('pedidos:error', {
                        msg: 'La página y el límite deben ser mayores a 0'
                    });
                }

                const desde = (paginaActual - 1) * limite;

                const filtro = {};

                if (estado) {
                    filtro.estado = estado;
                }

                if (cliente) {
                    if (!mongoose.Types.ObjectId.isValid(cliente)) {
                        return socket.emit('pedidos:error', {
                            msg: 'El ID del cliente no es válido'
                        });
                    }

                    filtro.cliente = cliente;
                }

                if (vendedor) {
                    if (!mongoose.Types.ObjectId.isValid(vendedor)) {
                        return socket.emit('pedidos:error', {
                            msg: 'El ID del vendedor no es válido'
                        });
                    }

                    filtro.vendedor = vendedor;
                }

                const [total, pedidos] = await Promise.all([
                    Pedido.countDocuments(filtro),

                    Pedido.find(filtro)
                        .select('cliente vendedor total estado metodoPago estadoPago createdAt')
                        .populate('cliente', 'nombre email')
                        .populate('vendedor', 'nombre email')
                        .sort({ createdAt: -1 })
                        .skip(desde)
                        .limit(limite)
                        .lean()
                ]);

                socket.emit('pedidos:listado', {
                    total,
                    paginaActual,
                    totalPaginas: Math.ceil(total / limite),
                    limite,
                    pedidos
                });

            } catch (error) {
                socket.emit('pedidos:error', {
                    msg: 'Error al listar pedidos',
                    error: error.message
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
};

export default pedidoSocket;