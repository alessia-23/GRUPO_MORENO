import { jest } from '@jest/globals';

const mockCountDocuments = jest.fn();
const mockFind = jest.fn();

jest.unstable_mockModule('../../../../models/Pedido.js', () => ({
    default: {
        countDocuments: mockCountDocuments,
        find: mockFind
    }
}));

jest.unstable_mockModule('../../../../helpers/stripeHelper.js', () => ({
    cobrarConTarjeta: jest.fn()
}));

jest.unstable_mockModule('../../../../helpers/alertaStockHelper.js', () => ({
    default: jest.fn()
}));

const { obtenerMisPedidos } = await import('../../../../controllers/pedidoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockQueryChain = (pedidosMock) => ({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(pedidosMock)
});

describe('Módulo pedidos - Obtener mis pedidos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería listar correctamente los pedidos del cliente', async () => {
        const req = {
            usuario: {
                id: 'cliente123',
                rol: 'CLIENTE'
            },
            query: {}
        };

        const pedidosMock = [
            {
                _id: 'pedido123',
                cliente: 'cliente123',
                nombrePedido: 'Pedido de útiles escolares',
                estado: 'PENDIENTE'
            }
        ];

        mockCountDocuments.mockResolvedValue(1);
        mockFind.mockReturnValue(mockQueryChain(pedidosMock));

        const res = mockResponse();

        await obtenerMisPedidos(req, res);

        expect(mockCountDocuments).toHaveBeenCalledWith({
            cliente: 'cliente123'
        });

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería retornar error si el usuario no tiene permisos', async () => {
        const req = {
            usuario: {
                id: 'admin123',
                rol: 'ADMINISTRADOR'
            },
            query: {}
        };
        const res = mockResponse();
        await obtenerMisPedidos(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No tiene permisos para consultar pedidos'
        });
    });
});