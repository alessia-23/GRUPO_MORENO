import mongoose from 'mongoose';
import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';

// Crear una venta directa en el local
const crearVentaDirecta = async (req, res) => {
    try {
        const vendedorId = req.usuario.id;

        const {
            articulos,
            datosFacturacion,
            metodoPago,
            referenciaPago = '',
            observaciones = ''
        } = req.body || {};

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
        if (!['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].includes(metodoPago)) {
            return res.status(400).json({
                msg: 'Método de pago no válido'
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
                _id: productoId,
                estado: true
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

        // EFECTIVO y TARJETA se consideran pagos inmediatos en caja
        const esPagoInmediato = ['EFECTIVO', 'TARJETA'].includes(metodoPago);

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
            estado: esPagoInmediato ? 'FINALIZADA' : 'PENDIENTE_PAGO'
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
            msg: 'Error al crear la venta directa',
            error: error.message
        });
    }
};

export {
    crearVentaDirecta
};