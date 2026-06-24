import { jest } from '@jest/globals';

const mockCountDocuments = jest.fn();
const mockFind = jest.fn();

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        countDocuments: mockCountDocuments,
        find: mockFind
    }
}));

const { obtenerGestionVende } = await import('../../../../controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockQueryChain = (productosMock) => ({
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(productosMock)
});

describe('Módulo productos - Gestión de productos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería listar correctamente los productos', async () => {
        const req = {
            query: {}
        };
        const productosMock = [
            {
                _id: 'producto123',
                nombre: 'Cuaderno'
            }
        ];
        mockCountDocuments.mockResolvedValue(1);
        mockFind.mockReturnValue(
            mockQueryChain(productosMock)
        );
        const res = mockResponse();
        await obtenerGestionVende(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería filtrar productos por estado activo', async () => {
        const req = {
            query: {
                estado: 'true'
            }
        };
        mockCountDocuments.mockResolvedValue(1);
        mockFind.mockReturnValue(
            mockQueryChain([])
        );
        const res = mockResponse();
        await obtenerGestionVende(req, res);
        expect(mockCountDocuments).toHaveBeenCalledWith({
            estado: true
        });
    });

    test('Debería retornar error si la categoría es inválida', async () => {
        const req = {
            query: {categoria: 'categoria-invalida'}
        };
        const res = mockResponse();
        await obtenerGestionVende(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El ID de la categoría no es válido'
        });
    });
});