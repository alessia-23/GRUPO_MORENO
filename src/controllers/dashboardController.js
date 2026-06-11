import Venta from '../models/Venta.js';
import Pedido from '../models/Pedido.js';

// Gráficas del dashboard del vendedor
const obtenerGraficasDashboardVendedor = async (req, res) => {
    try {
        const vendedorId = req.usuario.id;

        const inicioAnio = new Date(new Date().getFullYear(), 0, 1);

        const [
            ventasPorMes,
            pedidosPorEstado,
            ventasPorMetodoPago
        ] = await Promise.all([
            Venta.aggregate([
                {
                    $match: {
                        vendedor: vendedorId,
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
                        vendedor: vendedorId
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
                        vendedor: vendedorId,
                        estado: { $ne: 'CANCELADO' }
                    }
                },
                {
                    $group: {
                        _id: '$metodoPago',
                        cantidad: { $sum: 1 },
                        total: { $sum: '$resumenPago.totalPagar' }
                    }
                }
            ])
        ]);

        const meses = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        return res.status(200).json({
            msg: 'Gráficas del vendedor obtenidas correctamente',
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
        console.error('Error al obtener gráficas del vendedor:', error);

        return res.status(500).json({
            msg: 'Error al obtener las gráficas del vendedor'
        });
    }
};

export {
    obtenerGraficasDashboardVendedor
};