import { jest } from '@jest/globals';

const mockPedidoFindById = jest.fn();

jest.unstable_mockModule('../../../../models/Pedido.js', () => ({
    default: {
        findById: mockPedidoFindById
    }
}));

jest.unstable_mockModule('../../../../helpers/stripeHelper.js', () => ({
    cobrarConTarjeta: jest.fn()
}));

jest.unstable_mockModule('../../../../helpers/alertaStockHelper.js', () => ({
    default: jest.fn()
}));

const { cambiarEstadoPedido } = await import('../../../../controllers/pedidoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockApp = () => ({
    get: jest.fn().mockReturnValue({
        to: jest.fn().mockReturnThis(),
        emit: jest.fn()
    })
});

describe('Módulo pedidos - Cambiar estado del pedido', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería cancelar correctamente un pedido pendiente del cliente', async () => {
        const req = {
            params: {
                id: '507f1f77bcf86cd799439011'
            },
            body: {
                estado: 'CANCELADO'
            },
            usuario: {
                id: 'cliente123',
                rol: 'CLIENTE'
            },
            app: mockApp()
        };
        const pedidoMock = {
            _id: '507f1f77bcf86cd799439011',
            cliente: {
                toString: () => 'cliente123'
            },
            vendedor: null,
            estado: 'PENDIENTE',
            estadoPago: 'PENDIENTE',
            metodoPago: 'EFECTIVO',
            save: jest.fn().mockResolvedValue(true)
        };
        mockPedidoFindById.mockResolvedValue(pedidoMock);
        const res = mockResponse();
        await cambiarEstadoPedido(req, res);
        expect(pedidoMock.estado).toBe('CANCELADO');
        expect(pedidoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Pedido cancelado correctamente',
            pedido: {
                id: pedidoMock._id,
                estado: 'CANCELADO',
                estadoPago: pedidoMock.estadoPago,
                metodoPago: pedidoMock.metodoPago
            }
        });
    });

    test('Debería retornar error si el pedido no existe', async () => {
        const req = {
            params: {
                id: '507f1f77bcf86cd799439011'
            },
            body: {
                estado: 'CANCELADO'
            },
            usuario: {
                id: 'cliente123',
                rol: 'CLIENTE'
            },
            app: mockApp()
        };
        mockPedidoFindById.mockResolvedValue(null);
        const res = mockResponse();
        await cambiarEstadoPedido(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Pedido no encontrado'
        });
    });
});