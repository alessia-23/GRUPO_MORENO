import mongoose from 'mongoose';
import Venta from '../models/Venta.js';
import Pedido from '../models/Pedido.js';

// Dashboard completo del vendedor
const obtenerDashboardVendedor = async (req, res) => {
    try {
        const vendedorObjectId = new mongoose.Types.ObjectId(req.usuario.id);

        const ahora = new Date();

        const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

        const inicioMes = new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1
        );

        const inicioHoy = new Date();
        inicioHoy.setHours(0, 0, 0, 0);

        const finHoy = new Date();
        finHoy.setHours(23, 59, 59, 999);

        const [
            totalMisVentas,
            ventasMes,
            ventasHoy,
            pedidosPendientes,
            ventasPorMes,
            pedidosPorEstado,
            ventasPorMetodoPago
        ] = await Promise.all([
            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId,
                        estado: { $ne: 'CANCELADO' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$resumenPago.totalPagar' }
                    }
                }
            ]),

            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId,
                        estado: { $ne: 'CANCELADO' },
                        createdAt: { $gte: inicioMes }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$resumenPago.totalPagar' }
                    }
                }
            ]),

            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId,
                        estado: { $ne: 'CANCELADO' },
                        createdAt: {
                            $gte: inicioHoy,
                            $lte: finHoy
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$resumenPago.totalPagar' }
                    }
                }
            ]),

            Pedido.countDocuments({
                vendedor: vendedorObjectId,
                estado: 'EN_PROCESO'
            }),

            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId,
                        estado: { $ne: 'CANCELADO' },
                        createdAt: { $gte: inicioAnio }
                    }
                },
                {
                    $group: {
                        _id: { $month: '$createdAt' },
                        total: { $sum: '$resumenPago.totalPagar' },
                        cantidad: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            Pedido.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId
                    }
                },
                {
                    $group: {
                        _id: '$estado',
                        cantidad: { $sum: 1 }
                    }
                }
            ]),

            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorObjectId,
                        estado: { $ne: 'CANCELADO' }
                    }
                },
                {
                    $group: {
                        _id: '$metodoPago',
                        cantidad: { $sum: 1 },
                        total: { $sum: '$resumenPago.totalPagar' }
                    }
                },
                { $sort: { total: -1 } }
            ])
        ]);

        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        return res.status(200).json({
            msg: 'Dashboard del vendedor obtenido correctamente',
            resumen: {
                misVentas: Number((totalMisVentas[0]?.total || 0).toFixed(2)),
                ventasMes: Number((ventasMes[0]?.total || 0).toFixed(2)),
                ventasHoy: Number((ventasHoy[0]?.total || 0).toFixed(2)),
                pedidosPendientes
            },
            graficas: {
                ventasPorMes: ventasPorMes.map(item => ({
                    mes: meses[item._id - 1],
                    total: Number(item.total.toFixed(2)),
                    cantidad: item.cantidad
                })),
                pedidosPorEstado: pedidosPorEstado.map(item => ({
                    estado: item._id,
                    cantidad: item.cantidad
                })),
                ventasPorMetodoPago: ventasPorMetodoPago.map(item => ({
                    metodoPago: item._id,
                    cantidad: item.cantidad,
                    total: Number(item.total.toFixed(2))
                }))
            }
        });

    } catch (error) {
        console.error('Error al obtener dashboard del vendedor:', error);

        return res.status(500).json({
            msg: 'Error al obtener el dashboard del vendedor'
        });
    }
};

export {
    obtenerDashboardVendedor
};