import { jest } from '@jest/globals';

const mockVentaAggregate = jest.fn();
const mockVentaCountDocuments = jest.fn();
const mockProductoCountDocuments = jest.fn();
const mockProductoAggregate = jest.fn();
const mockPedidoCountDocuments = jest.fn();
const mockPedidoAggregate = jest.fn();
const mockQuejaCountDocuments = jest.fn();
const mockQuejaAggregate = jest.fn();

jest.unstable_mockModule('../../../../models/Venta.js', () => ({
    default: {
        aggregate: mockVentaAggregate,
        countDocuments: mockVentaCountDocuments
    }
}));

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        countDocuments: mockProductoCountDocuments,
        aggregate: mockProductoAggregate
    }
}));

jest.unstable_mockModule('../../../../models/Pedido.js', () => ({
    default: {
        countDocuments: mockPedidoCountDocuments,
        aggregate: mockPedidoAggregate
    }
}));

jest.unstable_mockModule('../../../../models/QuejaSugerencia.js', () => ({
    default: {
        countDocuments: mockQuejaCountDocuments,
        aggregate: mockQuejaAggregate
    }
}));

const { obtenerDashboardAdmin } = await import('../../../../controllers/dashboardController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo administrador - Visualización de estadísticas', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería obtener el dashboard del administrador correctamente', async () => {
        mockVentaAggregate
            .mockResolvedValueOnce([{ total: 150.75 }])
            .mockResolvedValueOnce([{ total: 80.5 }])
            .mockResolvedValueOnce([{ total: 25 }])
            .mockResolvedValueOnce([{ _id: 1, total: 100, cantidad: 2 }])
            .mockResolvedValueOnce([{ _id: 'EFECTIVO', cantidad: 2, total: 100 }]);

        mockVentaCountDocuments.mockResolvedValue(4);
        mockProductoCountDocuments
            .mockResolvedValueOnce(10)
            .mockResolvedValueOnce(2);
        mockPedidoCountDocuments.mockResolvedValue(3);
        mockQuejaCountDocuments.mockResolvedValue(1);
        mockPedidoAggregate.mockResolvedValue([{ _id: 'PENDIENTE', cantidad: 3 }]);
        mockQuejaAggregate.mockResolvedValue([{ _id: 'PENDIENTE', cantidad: 1 }]);
        mockProductoAggregate.mockResolvedValue([{ _id: 'Papelería', cantidad: 5 }]);

        const req = {};
        const res = mockResponse();

        await obtenerDashboardAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Dashboard del administrador obtenido correctamente'
            })
        );
    });

    test('Debería mostrar resumen general del negocio', async () => {
        mockVentaAggregate
            .mockResolvedValueOnce([{ total: 150 }])
            .mockResolvedValueOnce([{ total: 70 }])
            .mockResolvedValueOnce([{ total: 20 }])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        mockVentaCountDocuments.mockResolvedValue(5);
        mockProductoCountDocuments
            .mockResolvedValueOnce(12)
            .mockResolvedValueOnce(3);
        mockPedidoCountDocuments.mockResolvedValue(4);
        mockQuejaCountDocuments.mockResolvedValue(2);
        mockPedidoAggregate.mockResolvedValue([]);
        mockQuejaAggregate.mockResolvedValue([]);
        mockProductoAggregate.mockResolvedValue([]);

        const res = mockResponse();

        await obtenerDashboardAdmin({}, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                resumen: {
                    ingresosTotales: 150,
                    ingresosMes: 70,
                    ingresosHoy: 20,
                    totalVentas: 5,
                    totalProductos: 12,
                    productosStockBajo: 3,
                    pedidosPendientes: 4,
                    quejasPendientes: 2
                }
            })
        );
    });

    test('Debería mostrar gráficas de ventas, pedidos, quejas y productos', async () => {
        mockVentaAggregate
            .mockResolvedValueOnce([{ total: 100 }])
            .mockResolvedValueOnce([{ total: 50 }])
            .mockResolvedValueOnce([{ total: 10 }])
            .mockResolvedValueOnce([{ _id: 1, total: 100, cantidad: 2 }])
            .mockResolvedValueOnce([{ _id: 'TRANSFERENCIA', cantidad: 1, total: 50 }]);

        mockVentaCountDocuments.mockResolvedValue(2);
        mockProductoCountDocuments
            .mockResolvedValueOnce(8)
            .mockResolvedValueOnce(1);
        mockPedidoCountDocuments.mockResolvedValue(1);
        mockQuejaCountDocuments.mockResolvedValue(1);
        mockPedidoAggregate.mockResolvedValue([{ _id: 'FINALIZADO', cantidad: 2 }]);
        mockQuejaAggregate.mockResolvedValue([{ _id: 'FINALIZADA', cantidad: 1 }]);
        mockProductoAggregate.mockResolvedValue([{ _id: 'Oficina', cantidad: 4 }]);

        const res = mockResponse();

        await obtenerDashboardAdmin({}, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                graficas: expect.objectContaining({
                    ventasPorMes: [{ mes: 'Ene', total: 100, cantidad: 2 }],
                    pedidosPorEstado: [{ estado: 'FINALIZADO', cantidad: 2 }],
                    ventasPorMetodoPago: [{ metodoPago: 'TRANSFERENCIA', cantidad: 1, total: 50 }],
                    quejasPorEstado: [{ estado: 'FINALIZADA', cantidad: 1 }],
                    productosPorCategoria: [{ categoria: 'Oficina', cantidad: 4 }]
                })
            })
        );
    });

    test('Debería manejar errores al obtener estadísticas', async () => {
        mockVentaAggregate.mockRejectedValue(new Error('Error de base de datos'));

        const res = mockResponse();

        await obtenerDashboardAdmin({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al obtener el dashboard del administrador'
        });
    });
});