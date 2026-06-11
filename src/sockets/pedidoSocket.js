import Pedido from '../models/Pedido.js';

const pedidoSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);

        // Sala para vendedores
        socket.on('vendedores:unirse', () => {
            socket.join('vendedores');
            console.log(`Socket ${socket.id} unido a sala vendedores`);
        });

        // Sala para cliente específico
        socket.on('cliente:unirse', (clienteId) => {
            if (clienteId) {
                socket.join(`cliente:${clienteId}`);
                console.log(`Socket ${socket.id} unido a sala cliente:${clienteId}`);
            }
        });
        // Sala para vendedor específico
        socket.on('vendedor:unirse', (vendedorId) => {
            if (vendedorId) {
                socket.join(`vendedor:${vendedorId}`);
                console.log(`Socket ${socket.id} unido a sala vendedor:${vendedorId}`);
            }
        });
        // Listar pedidos pendientes del muro
        socket.on('pedidos:pendientes', async (filtros = {}) => {
            try {
                const {
                    page = 1,
                    tipoPedido,
                    tipoEntrega
                } = filtros;

                const paginaActual = Math.max(Number(page), 1);
                const limite = 15;
                const desde = (paginaActual - 1) * limite;

                const filtro = {
                    estado: 'PENDIENTE',
                    vendedor: null
                };

                if (tipoPedido) {
                    filtro.tipoPedido = tipoPedido;
                }

                if (tipoEntrega) {
                    filtro.tipoEntrega = tipoEntrega;
                }

                const [total, pedidos] = await Promise.all([
                    Pedido.countDocuments(filtro),

                    Pedido.find(filtro)
                        .populate({
                            path: 'cliente',
                            select: 'email perfilId perfilModelo',
                            populate: {
                                path: 'perfilId',
                                select: 'nombre apellido'
                            }
                        })
                        .select(
                            'cliente tipoPedido nombrePedido listaCliente articulos tipoEntrega direccionEntrega estado observaciones createdAt'
                        )
                        .sort({ createdAt: -1 })
                        .skip(desde)
                        .limit(limite)
                        .lean()
                ]);

                socket.emit('pedidos:pendientes:listado', {
                    total,
                    paginaActual,
                    totalPaginas: Math.ceil(total / limite),
                    limite,
                    pedidos
                });

            } catch (error) {
                socket.emit('pedidos:error', {
                    msg: 'Error al listar pedidos pendientes',
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