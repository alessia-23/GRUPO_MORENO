import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import mongoose from 'mongoose';

// Crear pedido realizado por el cliente
const crearPedido = async (req, res) => {
    try {
        const {
            cliente,
            articulos,
            metodoPago,
            observaciones
        } = req.body;

        // Validar cliente
        if (!cliente || !mongoose.Types.ObjectId.isValid(cliente)) {
            return res.status(400).json({
                msg: 'El cliente es obligatorio o no es válido'
            });
        }

        // Validar productos enviados
        if (!articulos || articulos.length === 0) {
            return res.status(400).json({
                msg: 'El pedido debe tener al menos un producto'
            });
        }

        const articulosPedido = [];

        // Validar cada producto
        for (const item of articulos) {
            const { producto, cantidad } = item;

            if (!producto || !mongoose.Types.ObjectId.isValid(producto)) {
                return res.status(400).json({
                    msg: 'El producto es obligatorio o no es válido'
                });
            }

            if (!cantidad || Number(cantidad) < 1) {
                return res.status(400).json({
                    msg: 'La cantidad debe ser mayor a 0'
                });
            }

            const productoDB = await Producto.findById(producto)
                .populate('categoria');

            if (!productoDB) {
                return res.status(404).json({
                    msg: 'El producto no existe'
                });
            }

            if (!productoDB.estado) {
                return res.status(400).json({
                    msg: `El producto "${productoDB.nombre}" está inactivo`
                });
            }

            if (!productoDB.categoria || !productoDB.categoria.estado) {
                return res.status(400).json({
                    msg: `La categoría del producto "${productoDB.nombre}" está inactiva`
                });
            }

            if (productoDB.stock < Number(cantidad)) {
                return res.status(400).json({
                    msg: `No hay stock suficiente para "${productoDB.nombre}". Stock disponible: ${productoDB.stock}`
                });
            }

            if (productoDB.precioVenta === undefined || productoDB.precioVenta === null) {
                return res.status(400).json({
                    msg: `El producto "${productoDB.nombre}" no tiene precio registrado`
                });
            }

            articulosPedido.push({
                producto: productoDB._id,
                cantidad: Number(cantidad),
                precioUnitario: productoDB.precioVenta,
                ivaRate: 0.15
            });
        }

        // El pedido nace sin vendedor, porque luego un vendedor lo toma
        const pedido = new Pedido({
            cliente,
            vendedor: null,
            articulos: articulosPedido,
            metodoPago: metodoPago || 'PENDIENTE_PAGO',
            observaciones: observaciones?.trim() || '',
            estado: 'PENDIENTE'
        });

        await pedido.save();

        // Descontar stock
        for (const item of articulosPedido) {
            await Producto.findByIdAndUpdate(
                item.producto,
                {
                    $inc: {
                        stock: -item.cantidad
                    }
                }
            );
        }

        req.app.get('io').emit('pedido:creado', {
            msg: 'Nuevo pedido creado',
            pedidoId: pedido._id
        });

        return res.status(201).json({
            msg: 'Pedido creado correctamente',
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al crear el pedido',
            error: error.message
        });
    }
};

// Asignar pedido a un vendedor
const asignarPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { vendedor } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        if (!vendedor || !mongoose.Types.ObjectId.isValid(vendedor)) {
            return res.status(400).json({
                msg: 'El vendedor es obligatorio o no es válido'
            });
        }

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({
                msg: 'El pedido no existe'
            });
        }

        if (pedido.estado !== 'PENDIENTE') {
            return res.status(400).json({
                msg: 'Solo se pueden asignar pedidos pendientes'
            });
        }

        pedido.vendedor = vendedor;
        pedido.estado = 'EN_PROCESO';

        await pedido.save();

        req.app.get('io').emit('pedido:actualizado', {
            msg: 'Pedido asignado a vendedor',
            pedidoId: pedido._id,
            estado: pedido.estado
        });

        return res.status(200).json({
            msg: 'Pedido asignado correctamente',
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al asignar el pedido',
            error: error.message
        });
    }
};


// Marcar pedido como listo para retirar
const marcarListoRetiro = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({
                msg: 'El pedido no existe'
            });
        }

        if (pedido.estado !== 'EN_PROCESO') {
            return res.status(400).json({
                msg: 'Solo los pedidos en proceso pueden marcarse como listos para retirar'
            });
        }

        pedido.estado = 'LISTO_RETIRO';

        await pedido.save();
        req.app.get('io').emit('pedido:actualizado', {
            msg: 'Pedido listo para retiro',
            pedidoId: pedido._id,
            estado: pedido.estado
        });

        return res.status(200).json({
            msg: 'Pedido listo para retirar',
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al actualizar el pedido',
            error: error.message
        });
    }
};

// Marcar pedido como entregado
const entregarPedido = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({
                msg: 'El pedido no existe'
            });
        }

        if (pedido.estado !== 'LISTO_RETIRO') {
            return res.status(400).json({
                msg: 'Solo los pedidos listos para retiro pueden entregarse'
            });
        }

        pedido.estado = 'ENTREGADO';

        await pedido.save();
        req.app.get('io').emit('pedido:actualizado', {
            msg: 'Pedido entregado',
            pedidoId: pedido._id,
            estado: pedido.estado
        });
        return res.status(200).json({
            msg: 'Pedido entregado correctamente',
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al entregar el pedido',
            error: error.message
        });
    }
};

// Listar pedidos con paginación, filtros y datos resumidos
const listarPedidos = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            estado,
            cliente,
            vendedor
        } = req.query;

        const paginaActual = Number(page);
        const limite = Number(limit);

        if (paginaActual < 1 || limite < 1) {
            return res.status(400).json({
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
                return res.status(400).json({
                    msg: 'El ID del cliente no es válido'
                });
            }

            filtro.cliente = cliente;
        }

        if (vendedor) {
            if (!mongoose.Types.ObjectId.isValid(vendedor)) {
                return res.status(400).json({
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
        ]);

        return res.status(200).json({
            total,
            paginaActual,
            totalPaginas: Math.ceil(total / limite),
            limite,
            pedidos
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar los pedidos',
            error: error.message
        });
    }
};
// Cancelar pedido
const cancelarPedido = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({
                msg: 'El pedido no existe'
            });
        }

        if (pedido.estado === 'ENTREGADO') {
            return res.status(400).json({
                msg: 'No se puede cancelar un pedido entregado'
            });
        }

        if (pedido.estado === 'CANCELADO') {
            return res.status(400).json({
                msg: 'El pedido ya está cancelado'
            });
        }

        //Preguntar
        // if (pedido.estado === 'LISTO_RETIRO') {
        //     return res.status(400).json({
        //         msg: 'El pedido ya está listo para retiro'
        //     });
        // }

        pedido.estado = 'CANCELADO';
        await pedido.save();


        // Devolver stock al cancelar
        for (const item of pedido.articulos) {
            await Producto.findByIdAndUpdate(
                item.producto,
                {
                    $inc: {
                        stock: item.cantidad
                    }
                }
            );
        }
        req.app.get('io').emit('pedido:actualizado', {
            msg: 'Pedido cancelado',
            pedidoId: pedido._id,
            estado: pedido.estado
        });
        return res.status(200).json({
            msg: 'Pedido cancelado correctamente',
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al cancelar el pedido',
            error: error.message
        });
    }
};

// Obtener detalle completo de un pedido
const obtenerPedidoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        const pedido = await Pedido.findById(id)
            .populate('cliente', 'nombre email')
            .populate('vendedor', 'nombre email')
            .populate('articulos.producto', 'nombre precioVenta stock imagen');

        if (!pedido) {
            return res.status(404).json({
                msg: 'El pedido no existe'
            });
        }

        return res.status(200).json({
            pedido
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al obtener el pedido',
            error: error.message
        });
    }
};


// Listar pedidos del cliente autenticado
const listarMisPedidos = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            estado
        } = req.query;

        const paginaActual = Number(page);
        const limite = Number(limit);

        if (paginaActual < 1 || limite < 1) {
            return res.status(400).json({
                msg: 'La página y el límite deben ser mayores a 0'
            });
        }

        const desde = (paginaActual - 1) * limite;
        const filtro = {
            cliente: req.usuario.id
        };

        if (estado) {
            filtro.estado = estado;
        }

        const [total, pedidos] = await Promise.all([
            Pedido.countDocuments(filtro),

            Pedido.find(filtro)
                .select('cliente total estado metodoPago estadoPago createdAt')
                .populate('cliente', 'nombre email')
                .sort({ createdAt: -1 })
                .skip(desde)
                .limit(limite)
        ]);

        return res.status(200).json({
            total,
            paginaActual,
            totalPaginas: Math.ceil(total / limite),
            limite,
            pedidos
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar tus pedidos',
            error: error.message
        });
    }
};

export {
    crearPedido,
    asignarPedido,
    marcarListoRetiro,
    entregarPedido,
    listarPedidos,
    cancelarPedido,
    obtenerPedidoPorId,
    listarMisPedidos
};