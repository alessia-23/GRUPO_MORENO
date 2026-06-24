import { jest } from '@jest/globals';

const mockVentaFindById = jest.fn();
const mockPedidoFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../../../../models/Venta.js', () => ({
    default: {
        findById: mockVentaFindById
    }
}));

jest.unstable_mockModule('../../../../models/Pedido.js', () => ({
    default: {
        findByIdAndUpdate: mockPedidoFindByIdAndUpdate
    }
}));

jest.unstable_mockModule('../../../../helpers/stripeHelper.js', () => ({
    cobrarConTarjeta: jest.fn()
}));

jest.unstable_mockModule('../../../../helpers/alertaStockHelper.js', () => ({
    default: jest.fn()
}));

const { cancelarVenta } = await import('../../../../controllers/ventaController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo ventas - Cancelar venta', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería cancelar correctamente una venta en proceso', async () => {
        const req = {
            params: {
                id: '507f1f77bcf86cd799439011'
            }
        };
        const ventaMock = {
            _id: '507f1f77bcf86cd799439011',
            origen: 'DIRECTA',
            pedido: null,
            estado: 'EN_PROCESO',
            save: jest.fn().mockResolvedValue(true)
        };
        mockVentaFindById.mockResolvedValue(ventaMock);
        const res = mockResponse();
        await cancelarVenta(req, res);
        expect(ventaMock.estado).toBe('CANCELADO');
        expect(ventaMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Venta cancelada correctamente',
            venta: {
                id: ventaMock._id,
                estado: 'CANCELADO'
            }
        });
    });

    test('Debería retornar error si la venta no existe', async () => {
        const req = {
            params: {
                id: '507f1f77bcf86cd799439011'
            }
        };

        mockVentaFindById.mockResolvedValue(null);

        const res = mockResponse();

        await cancelarVenta(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Venta no encontrada'
        });
    });
});