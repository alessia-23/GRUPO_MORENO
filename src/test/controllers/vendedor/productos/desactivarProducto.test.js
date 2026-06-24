import { jest } from '@jest/globals';

const mockProductoFindById = jest.fn();

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        findById: mockProductoFindById
    }
}));

const { desactivarProducto } = await import('../../../../controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo productos - Desactivar producto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería desactivar correctamente un producto', async () => {
        const req = {
            params: {
                id: 'producto123'
            }
        };
        const productoMock = {
            _id: 'producto123',
            estado: true,
            save: jest.fn().mockResolvedValue(true)
        }
        mockProductoFindById.mockResolvedValue(productoMock);
        const res = mockResponse();
        await desactivarProducto(req, res);
        expect(mockProductoFindById).toHaveBeenCalledWith('producto123');
        expect(productoMock.estado).toBe(false);
        expect(productoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto desactivado correctamente'
        });
    });

    test('Debería retornar error si el producto no existe', async () => {
        const req = {
            params: {id: 'producto-no-existe'}
        };
        mockProductoFindById.mockResolvedValue(null);
        const res = mockResponse();
        await desactivarProducto(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto no encontrado'
        });
    });

    test('Debería retornar error si el producto ya está desactivado', async () => {
        const req = {
            params: {
                id: 'producto123'
            }
        };

        const productoMock = {
            _id: 'producto123',
            estado: false,
            save: jest.fn()
        };

        mockProductoFindById.mockResolvedValue(productoMock);

        const res = mockResponse();

        await desactivarProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El producto ya se encuentra desactivado'
        });
    });
});