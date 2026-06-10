import mongoose from 'mongoose';
import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';
import Pedido from '../models/Pedido.js';
import Carrito from '../models/Carrito.js';
import { calcularTotales } from '../helpers/calcularTotal.js';
import { cobrarConTarjeta } from '../helpers/stripeHelper.js';

// Crear una venta directa en el local
const crearVentaDirecta = async (req, res) => {
    try {
        const vendedorId = req.usuario.id;
        const {
            articulos, datosFacturacion, metodoPago, referenciaPago = '', observaciones = '' } = req.body || {};
        // Validar que se envíe al menos un artículo
        if (!Array.isArray(articulos) || articulos.length === 0) {
            return res.status(400).json({
                msg: 'Debe enviar al menos un artículo para registrar la venta'
            });
        }
        // Validar datos de facturación
        if (!datosFacturacion) {
            return res.status(400).json({
                msg: 'Los datos de facturación son obligatorios'
            });
        }
        // Validar método de pago
        if (!['EFECTIVO', 'TRANSFERENCIA'].includes(metodoPago)) {
            return res.status(400).json({
                msg: 'En venta directa solo se permite EFECTIVO o TRANSFERENCIA'
            });
        }
        // Buscar si el correo pertenece a un cliente registrado
        let clienteVenta = null;
        const correoFacturacion = datosFacturacion.correo?.trim().toLowerCase();
        if (correoFacturacion) {
            const usuarioCliente = await Usuario.findOne({
                email: correoFacturacion,
                rol: 'CLIENTE'
            }).select('_id email rol');
            if (usuarioCliente) {
                clienteVenta = usuarioCliente._id;
            }
        }
        const articulosVenta = [];
        // Recorrer los productos enviados desde el frontend
        for (const item of articulos) {
            const { producto: productoId, cantidad } = item;
            // Validar ID del producto
            if (!mongoose.Types.ObjectId.isValid(productoId)) {
                return res.status(400).json({
                    msg: `ID de producto no válido: ${productoId}`
                });
            }
            const cantidadNumerica = Number(cantidad);
            // Validar cantidad
            if (
                !Number.isInteger(cantidadNumerica) ||
                cantidadNumerica < 1
            ) {
                return res.status(400).json({
                    msg: 'La cantidad debe ser un número entero mayor a cero'
                });
            }
            // Buscar producto activo
            const producto = await Producto.findOne({
                _id: productoId, estado: true
            });
            if (!producto) {
                return res.status(404).json({
                    msg: 'Uno de los productos no existe o no está disponible'
                });
            }
            // Validar stock antes de preparar la venta
            if (producto.stock < cantidadNumerica) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`
                });
            }
            // Definir precio normal o mayorista según la cantidad
            let precioUnitario = producto.precioVenta;
            let tipoPrecio = 'NORMAL';
            if (
                producto.precioMayorista &&
                producto.cantidadMinimaMayorista &&
                cantidadNumerica >= producto.cantidadMinimaMayorista
            ) {
                precioUnitario = producto.precioMayorista;
                tipoPrecio = 'MAYORISTA';
            }
            // Calcular porcentaje de IVA según el producto
            const porcentajeIva = producto.tipoIVA === '15%' ? 0.15 : 0;
            // Congelar datos del producto en la venta
            articulosVenta.push({
                producto: producto._id,
                nombreProducto: producto.nombre,
                codigo: producto.codigo,
                color: producto.color || '',
                tamanio: producto.tamanio || '',
                cantidad: cantidadNumerica,
                precioUnitario,
                tipoPrecio,
                porcentajeIva
            });
        }
        // En venta directa solo EFECTIVO se considera pago inmediato
        const esPagoInmediato = metodoPago === 'EFECTIVO';
        const venta = new Venta({
            origen: 'DIRECTA',
            pedido: null,
            cliente: clienteVenta,
            vendedor: vendedorId,
            articulos: articulosVenta,
            datosFacturacion,
            metodoPago,
            referenciaPago,
            observaciones,
            estadoPago: esPagoInmediato ? 'PAGADO' : 'PENDIENTE',
            estado: esPagoInmediato ? 'FINALIZADO' : 'EN_PROCESO'
        });
        // Validar la venta antes de tocar el stock
        await venta.validate();
        // Si el pago es inmediato, descontar stock de forma segura
        if (esPagoInmediato) {
            for (const item of articulosVenta) {
                const resultadoDescuento = await Producto.updateOne(
                    {
                        _id: item.producto,
                        estado: true,
                        stock: { $gte: item.cantidad }
                    },
                    {
                        $inc: { stock: -item.cantidad }
                    }
                );
                if (resultadoDescuento.modifiedCount === 0) {
                    return res.status(400).json({
                        msg: `Stock insuficiente para "${item.nombreProducto}". Otro vendedor pudo haber vendido este producto antes.`
                    });
                }
            }
        }
        await venta.save();
        return res.status(201).json({
            msg: esPagoInmediato
                ? 'Venta directa registrada correctamente y stock descontado'
                : 'Venta por transferencia registrada. Pendiente de confirmación de pago',
            venta: {
                id: venta._id,
                origen: venta.origen,
                cliente: venta.cliente,
                vendedor: venta.vendedor,
                metodoPago: venta.metodoPago,
                estadoPago: venta.estadoPago,
                estado: venta.estado,
                articulos: venta.articulos,
                datosFacturacion: venta.datosFacturacion,
                resumenPago: venta.resumenPago,
                createdAt: venta.createdAt
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }
        console.log('ERROR AL CREAR VENTA DIRECTA:', error);
        return res.status(500).json({
            msg: 'Error al crear la venta directa', error: error.message
        });
    }
};

const obtenerMisVentas = async (req, res) => {
    try {
        const {
            page = 1, estado, estadoPago, metodoPago, origen, buscar } = req.query;
        const paginaActual = Math.max(Number(page), 1);
        const limite = 15;
        const desde = (paginaActual - 1) * limite;
        const filtro = { vendedor: req.usuario.id };
        if (estado) {
            if (!['PENDIENTE', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO'].includes(estado)) {
                return res.status(400).json({ msg: 'El estado de la venta no es válido' });
            }
            filtro.estado = estado;
        }
        if (estadoPago) {
            if (!['PENDIENTE', 'PAGADO'].includes(estadoPago)) {
                return res.status(400).json({ msg: 'El estado de pago no es válido' });
            }
            filtro.estadoPago = estadoPago;
        }
        if (metodoPago) {
            if (!['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].includes(metodoPago)) {
                return res.status(400).json({ msg: 'El método de pago no es válido' });
            }
            filtro.metodoPago = metodoPago;
        }
        if (origen) {
            if (!['PEDIDO', 'DIRECTA'].includes(origen)) {
                return res.status(400).json({ msg: 'El origen de la venta no es válido' });
            }
            filtro.origen = origen;
        }
        if (buscar?.trim()) {
            filtro['datosFacturacion.nombreCompleto'] = {
                $regex: buscar.trim(),
                $options: 'i'
            };
        }
        const [total, ventas] = await Promise.all([
            Venta.countDocuments(filtro),
            Venta.find(filtro)
                .select(
                    'origen pedido cliente vendedor metodoPago estadoPago estado datosFacturacion resumenPago createdAt updatedAt'
                )
                .populate('cliente', 'email')
                .populate('vendedor', 'email')
                .sort({ createdAt: -1 })
                .skip(desde)
                .limit(limite)
                .lean()
        ]);
        return res.status(200).json({
            total, paginaActual, totalPaginas: Math.ceil(total / limite),
            limite, ventas
        });
    } catch (error) {
        console.log('ERROR AL LISTAR MIS VENTAS:', error);
        return res.status(500).json({
            msg: 'Error al listar mis ventas', error: error.message
        });
    }
};

//  Obtener los detalles de una venta específica realizada por el vendedor
const obtenerDetalleVenta = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID de la venta no es válido'
            });
        }
        const venta = await Venta.findById(id)
            .populate({
                path: 'cliente',
                select: 'email perfilId',
                populate: {
                    path: 'perfilId',
                    select: 'nombre apellido'
                }
            })
            .populate({
                path: 'vendedor',
                select: 'email perfilId',
                populate: {
                    path: 'perfilId',
                    select: 'nombre apellido'
                }
            })
            .populate({
                path: 'pedido',
                select: 'nombrePedido tipoPedido estado estadoPago'
            })
            .select(
                'origen pedido cliente vendedor articulos datosFacturacion metodoPago estadoPago comprobantePago referenciaPago stripe resumenPago estado observaciones createdAt updatedAt'
            )
            .lean();
        if (!venta) {
            return res.status(404).json({
                msg: 'Venta no encontrada'
            });
        }
        return res.status(200).json({
            venta
        });
    } catch (error) {
        console.log('ERROR AL OBTENER DETALLE DE VENTA:', error);
        return res.status(500).json({
            msg: 'Error al obtener el detalle de la venta', error: error.message
        });
    }
};

// Confirmar una venta por transferencia
const confirmarTransferenciaVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { referenciaPago = '' } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID de la venta no es válido'
            });
        }
        const venta = await Venta.findById(id);
        if (!venta) {
            return res.status(404).json({
                msg: 'Venta no encontrada'
            });
        }
        if (venta.metodoPago !== 'TRANSFERENCIA') {
            return res.status(400).json({
                msg: 'Solo se pueden confirmar ventas pagadas por transferencia'
            });
        }
        if (venta.estado !== 'EN_PROCESO' || venta.estadoPago !== 'PENDIENTE') {
            return res.status(400).json({
                msg: 'La venta no está pendiente de confirmación'
            });
        }
        if (!venta.articulos || venta.articulos.length === 0) {
            return res.status(400).json({
                msg: 'La venta no contiene artículos'
            });
        }
        // Descontar stock de forma segura
        for (const item of venta.articulos) {
            const resultadoDescuento = await Producto.updateOne(
                {
                    _id: item.producto,
                    estado: true,
                    stock: { $gte: item.cantidad }
                },
                {
                    $inc: { stock: -item.cantidad }
                }
            );
            if (resultadoDescuento.modifiedCount === 0) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${item.nombreProducto}". No se pudo confirmar la venta.`
                });
            }
        }
        if (referenciaPago?.trim()) {
            venta.referenciaPago = referenciaPago.trim();
        }
        venta.estadoPago = 'PAGADO';
        venta.estado = 'FINALIZADO';
        if (venta.origen === 'PEDIDO' && venta.pedido) {
            await Pedido.findByIdAndUpdate(
                venta.pedido,
                {
                    estadoPago: 'PAGADO',
                    estado: 'FINALIZADO',
                    metodoPago: 'TRANSFERENCIA'
                }
            );
        }
        await venta.save();
        return res.status(200).json({
            msg: 'Transferencia confirmada correctamente. Venta finalizada y stock descontado',
            venta: {
                id: venta._id,
                origen: venta.origen,
                pedido: venta.pedido,
                cliente: venta.cliente,
                vendedor: venta.vendedor,
                metodoPago: venta.metodoPago,
                referenciaPago: venta.referenciaPago,
                estadoPago: venta.estadoPago,
                estado: venta.estado,
                articulos: venta.articulos,
                resumenPago: venta.resumenPago,
                updatedAt: venta.updatedAt
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }
        console.log('ERROR AL CONFIRMAR TRANSFERENCIA:', error);
        return res.status(500).json({
            msg: 'Error al confirmar la transferencia', error: error.message
        });
    }
};

// Crear una venta a partir de un pedido
const crearVentaDesdePedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { observaciones = '' } = req.body || {};
        const vendedorId = req.usuario.id;

        if (!mongoose.Types.ObjectId.isValid(pedidoId)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        const pedido = await Pedido.findById(pedidoId);

        if (!pedido) {
            return res.status(404).json({
                msg: 'Pedido no encontrado'
            });
        }

        const metodoPago = pedido.metodoPago;

        if (!['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].includes(metodoPago)) {
            return res.status(400).json({
                msg: 'El pedido no tiene un método de pago válido'
            });
        }

        if (pedido.vendedor?.toString() !== vendedorId) {
            return res.status(403).json({
                msg: 'No tiene permisos para cobrar este pedido'
            });
        }

        if (pedido.estado !== 'EN_PROCESO') {
            return res.status(400).json({
                msg: 'Solo se pueden cobrar pedidos en proceso'
            });
        }

        if (metodoPago === 'TARJETA' && pedido.estadoPago !== 'PAGADO') {
            return res.status(400).json({
                msg: 'El pedido con tarjeta todavía no está pagado'
            });
        }

        if (metodoPago !== 'TARJETA' && pedido.estadoPago === 'PAGADO') {
            return res.status(400).json({
                msg: 'Este pedido ya fue pagado'
            });
        }

        const ventaExistente = await Venta.findOne({
            pedido: pedido._id,
            origen: 'PEDIDO',
            estado: { $ne: 'CANCELADO' }
        });

        if (ventaExistente) {
            return res.status(400).json({
                msg: 'Ya existe una venta activa asociada a este pedido'
            });
        }

        if (!pedido.articulos || pedido.articulos.length === 0) {
            return res.status(400).json({
                msg: 'El pedido no tiene artículos para cobrar'
            });
        }

        const articulosVenta = [];

        for (const item of pedido.articulos) {
            if (!item.producto) {
                return res.status(400).json({
                    msg: `El artículo "${item.nombreProducto}" no tiene producto asociado`
                });
            }

            const producto = await Producto.findOne({
                _id: item.producto,
                estado: true
            });

            if (!producto) {
                return res.status(404).json({
                    msg: `El producto "${item.nombreProducto}" ya no está disponible`
                });
            }

            if (producto.stock < item.cantidad) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${item.nombreProducto}". Disponible: ${producto.stock}`
                });
            }

            articulosVenta.push({
                producto: item.producto,
                nombreProducto: item.nombreProducto,
                codigo: item.codigo,
                color: item.color || '',
                tamanio: item.tamanio || '',
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                tipoPrecio: item.tipoPrecio || 'NORMAL',
                porcentajeIva: item.porcentajeIva,
                subtotal: item.subtotal
            });
        }

        const esPagoInmediato = ['EFECTIVO', 'TARJETA'].includes(metodoPago);

        const venta = new Venta({
            origen: 'PEDIDO',
            pedido: pedido._id,
            cliente: pedido.cliente,
            vendedor: vendedorId,
            articulos: articulosVenta,
            datosFacturacion: pedido.datosFacturacion,
            metodoPago,
            referenciaPago: '',
            observaciones: observaciones?.trim() || pedido.observaciones || '',
            estadoPago: esPagoInmediato ? 'PAGADO' : 'PENDIENTE',
            estado: esPagoInmediato ? 'FINALIZADO' : 'EN_PROCESO',
            resumenPago: {
                costoEnvio: pedido.resumenPago?.costoEnvio || 0
            }
        });

        await venta.validate();

        if (esPagoInmediato) {
            for (const item of articulosVenta) {
                const resultadoDescuento = await Producto.updateOne(
                    {
                        _id: item.producto,
                        estado: true,
                        stock: { $gte: item.cantidad }
                    },
                    {
                        $inc: { stock: -item.cantidad }
                    }
                );

                if (resultadoDescuento.modifiedCount === 0) {
                    return res.status(400).json({
                        msg: `Stock insuficiente para "${item.nombreProducto}". Otro vendedor pudo haber vendido este producto antes.`
                    });
                }
            }

            pedido.estadoPago = 'PAGADO';
            pedido.estado = 'FINALIZADO';
        } else {
            pedido.estadoPago = 'PENDIENTE';
            pedido.estado = 'EN_PROCESO';
        }

        pedido.metodoPago = metodoPago;

        await venta.save();
        await pedido.save();

        return res.status(201).json({
            msg: esPagoInmediato
                ? 'Venta creada desde pedido correctamente. Pedido finalizado y stock descontado'
                : 'Venta creada desde pedido. Pendiente de confirmar transferencia',
            venta: {
                id: venta._id,
                origen: venta.origen,
                pedido: venta.pedido,
                cliente: venta.cliente,
                vendedor: venta.vendedor,
                metodoPago: venta.metodoPago,
                estadoPago: venta.estadoPago,
                estado: venta.estado,
                stripe: venta.stripe,
                articulos: venta.articulos,
                datosFacturacion: venta.datosFacturacion,
                resumenPago: venta.resumenPago,
                createdAt: venta.createdAt
            },
            pedido: {
                id: pedido._id,
                estado: pedido.estado,
                estadoPago: pedido.estadoPago,
                metodoPago: pedido.metodoPago
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }

        console.log('ERROR AL CREAR VENTA DESDE PEDIDO:', error);

        return res.status(500).json({
            msg: 'Error al crear venta desde pedido',
            error: error.message
        });
    }
};

// Cancelar una venta pendiente
const cancelarVenta = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID de la venta no es válido'
            });
        }
        const venta = await Venta.findById(id);
        if (!venta) {
            return res.status(404).json({
                msg: 'Venta no encontrada'
            });
        }
        // No permitir cancelar una venta ya finalizada
        if (venta.estado === 'FINALIZADO') {
            return res.status(400).json({
                msg: 'No se puede cancelar una venta finalizada'
            });
        }
        if (venta.estado === 'CANCELADO') {
            return res.status(400).json({
                msg: 'La venta ya se encuentra cancelada'
            });
        }
        venta.estado = 'CANCELADO';
        await venta.save();
        // Si proviene de un pedido también cancelar el pedido
        if (venta.origen === 'PEDIDO' && venta.pedido) {
            await Pedido.findByIdAndUpdate(
                venta.pedido,
                {
                    estado: 'CANCELADO'
                }
            );
        }
        return res.status(200).json({
            msg: 'Venta cancelada correctamente',
            venta: {
                id: venta._id,
                estado: venta.estado
            }
        });
    } catch (error) {
        console.log('ERROR AL CANCELAR VENTA:', error);
        return res.status(500).json({
            msg: 'Error al cancelar la venta', error: error.message
        });
    }
};


// Pagar carrito con tarjeta: cobra Stripe, crea pedido pagado y vacía carrito
const pagarCarritoConTarjeta = async (req, res) => {
    try {
        const clienteId = req.usuario.id;
        const { paymentMethodId, nombrePedido, nombreCompleto, identificacion, correo, telefono,
            tipoEntrega, direccion, referencia, observaciones = '' } = req.body || {};
        if (!paymentMethodId?.trim()) {
            return res.status(400).json({ msg: 'El paymentMethodId es obligatorio' });
        }
        if (!nombrePedido?.trim()) {
            return res.status(400).json({ msg: 'El nombre del pedido es obligatorio' });
        }
        if (!nombreCompleto?.trim() || !identificacion?.trim() || !correo?.trim() || !telefono?.trim()) {
            return res.status(400).json({ msg: 'Los datos de facturación son obligatorios' });
        }
        if (!['RETIRO_LOCAL', 'ENVIO_DOMICILIO'].includes(tipoEntrega)) {
            return res.status(400).json({ msg: 'El tipo de entrega no es válido' });
        }
        if (tipoEntrega === 'ENVIO_DOMICILIO' && !direccion?.trim()) {
            return res.status(400).json({ msg: 'La dirección es obligatoria para envío a domicilio' });
        }
        const carrito = await Carrito.findOne({
            cliente: clienteId,
            estado: true
        });
        if (!carrito || carrito.articulos.length === 0) {
            return res.status(400).json({ msg: 'El carrito está vacío' });
        }
        const articulosPedido = [];
        for (const item of carrito.articulos) {
            const producto = await Producto.findOne({
                _id: item.producto,
                estado: true
            });
            if (!producto) {
                return res.status(404).json({
                    msg: `El producto "${item.nombreProducto}" ya no está disponible`
                });
            }
            if (producto.stock < item.cantidad) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${item.nombreProducto}". Solo hay ${producto.stock} unidades disponibles`
                });
            }
            articulosPedido.push({
                producto: producto._id,
                nombreProducto: item.nombreProducto,
                codigo: item.codigo,
                color: item.color || '',
                tamanio: item.tamanio || '',
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                tipoPrecio: item.tipoPrecio || 'NORMAL',
                porcentajeIva: item.porcentajeIva
            });
        }
        const totales = calcularTotales(articulosPedido);
        const costoEnvio = tipoEntrega === 'ENVIO_DOMICILIO' ? 3.50 : 0;
        const totalPagar = Number(
            (totales.subtotalGeneral + totales.ivaGeneral + costoEnvio).toFixed(2)
        );
        const payment = await cobrarConTarjeta({
            totalPagar,
            correo: correo.trim(),
            paymentMethodId,
            descripcion: 'Pago de pedido por carrito'
        });
        if (payment.status !== 'succeeded') {
            return res.status(400).json({
                msg: 'El pago no se completó',
                estadoStripe: payment.status
            });
        }
        const pedido = new Pedido({
            cliente: clienteId,
            tipoPedido: 'CARRITO',
            nombrePedido: nombrePedido.trim(),
            articulos: totales.itemsCalculados,
            datosFacturacion: {
                nombreCompleto: nombreCompleto.trim(),
                identificacion: identificacion.trim(),
                correo: correo.trim(),
                telefono: telefono.trim()
            },
            tipoEntrega,
            direccionEntrega: tipoEntrega === 'ENVIO_DOMICILIO'
                ? {
                    direccion: direccion.trim(),
                    referencia: referencia?.trim() || ''
                }
                : undefined,
            metodoPago: 'TARJETA',
            estadoPago: 'PAGADO',
            resumenPago: {
                subtotalProductos: totales.subtotalGeneral,
                ivaProductos: totales.ivaGeneral,
                costoEnvio
            },
            observaciones: observaciones?.trim() || '',
            estado: 'PENDIENTE'
        });
        await pedido.save();
        carrito.articulos = [];
        await carrito.save();
        const pedidoRespuesta = pedido.toObject();
        if (pedidoRespuesta.tipoEntrega === 'RETIRO_LOCAL') {
            delete pedidoRespuesta.direccionEntrega;
        }
        return res.status(201).json({
            msg: 'Pago con tarjeta realizado correctamente. Pedido creado y enviado al muro de vendedores',
            pedido: pedidoRespuesta,
            stripe: {
                paymentIntentId: payment.id,
                status: payment.status
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }
        console.log('ERROR AL PAGAR CARRITO CON TARJETA:', error);
        return res.status(500).json({
            msg: 'Error al pagar el carrito con tarjeta',
            error: error.message
        });
    }
};

export {
    crearVentaDirecta, obtenerMisVentas, obtenerDetalleVenta, confirmarTransferenciaVenta, crearVentaDesdePedido, cancelarVenta, pagarCarritoConTarjeta
};