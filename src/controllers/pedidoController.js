import Pedido from '../models/Pedido.js';
import Producto from '../models/Producto.js';
import mongoose from 'mongoose';

export const crearPedido = async (req, res) => {
    try {
        const { cliente, articulos, vendedor, observaciones, metodoPago } = req.body;

        if (!cliente || !articulos || articulos.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El cliente y los artículos son obligatorios'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(cliente)) {
            return res.status(400).json({
                ok: false,
                msg: 'El ID del cliente proporcionado no es válido'
            });
        }

        if (vendedor && !mongoose.Types.ObjectId.isValid(vendedor)) {
            return res.status(400).json({
                ok: false,
                msg: 'El ID del vendedor proporcionado no es válido'
            });
        }

        const articulosValinados = [];

        for (const item of articulos) {
            const { producto: productoId, cantidad, precioUnitario, ivaRate } = item;

            if (!mongoose.Types.ObjectId.isValid(productoId)) {
                return res.status(400).json({
                    ok: false,
                    msg: `El ID del producto ${productoId} no es válido`
                });
            }

            const productoDB = await Producto.findById(productoId);

            if (!productoDB) {
                return res.status(404).json({
                    ok: false,
                    msg: `El producto con ID ${productoId} no existe`
                });
            }

            if (!productoDB.estado) {
                return res.status(400).json({
                    ok: false,
                    msg: `El producto "${productoDB.nombre}" está inactivo`
                });
            }

            if (productoDB.stock < cantidad) {
                return res.status(400).json({
                    ok: false,
                    msg: `Stock insuficiente para "${productoDB.nombre}". Disponible: ${productoDB.stock}`
                });
            }

            articulosValinados.push({
                productoDB,
                cantidad,
                precioUnitario: Number(precioUnitario),
                ivaRate: ivaRate !== undefined ? Number(ivaRate) : 0.15
            });
        }

        // Restar el stock
        for (const item of articulosValinados) {
            item.productoDB.stock -= item.cantidad;
            await item.productoDB.save();
        }

        const articulosParaGuardar = articulosValinados.map(item => ({
            producto: item.productoDB._id,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            ivaRate: item.ivaRate
        }));

        const nuevoPedido = new Pedido({
            cliente,
            vendedor: vendedor || null,
            articulos: articulosParaGuardar,
            observaciones: observaciones?.trim() || '',
            metodoPago: metodoPago || 'PENDIENTE_PAGO',
            estado: vendedor ? 'ASIGNADO' : 'PENDIENTE' 
        });

        await nuevoPedido.save();

        return res.status(201).json({
            ok: true,
            msg: 'Pedido procesado y stock actualizado correctamente',
            pedido: nuevoPedido
        });

    } catch (error) {
        console.error('ERROR AL CREAR PEDIDO:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno en el servidor al intentar registrar el pedido',
            error: error.message
        });
    }
};