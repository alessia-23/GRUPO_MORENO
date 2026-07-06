import { jest } from '@jest/globals';

const mockCountDocuments = jest.fn();
const mockLean = jest.fn();
const mockLimit = jest.fn(() => ({ lean: mockLean }));
const mockSkip = jest.fn(() => ({ limit: mockLimit }));
const mockSort = jest.fn(() => ({ skip: mockSkip }));
const mockSelect = jest.fn(() => ({ sort: mockSort }));
const mockPopulate = jest.fn(() => ({ select: mockSelect }));
const mockFind = jest.fn(() => ({ populate: mockPopulate }));

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
const { obtenerPedidosPendientes } = await import('../../../../controllers/pedidoController.js');
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
describe('Módulo pedidos - Obtener pedidos pendientes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería listar correctamente los pedidos pendientes', async () => {
        const pedidosMock = [
            {
                _id: '1',
                nombrePedido: 'Pedido prueba',
                estado: 'PENDIENTE'
            }
        ];
        mockCountDocuments.mockResolvedValue(1);
        mockLean.mockResolvedValue(pedidosMock);
        const req = {
            query: {}
        };
        const res = mockResponse();
        await obtenerPedidosPendientes(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            total: 1,
            paginaActual: 1,
            totalPaginas: 1,
            limite: 15,
            pedidos: pedidosMock
        });
    });
    test('Debería retornar error si el tipo de pedido no es válido', async () => {
        const req = {
            query: {
                tipoPedido: 'PRUEBA'
            }
        };
        const res = mockResponse();
        await obtenerPedidosPendientes(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El tipo de pedido no es válido'
        });
    });
});