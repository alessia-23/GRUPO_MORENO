import { jest } from '@jest/globals';

const mockProductoFindById = jest.fn();
const mockCategoriaFindById = jest.fn();

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        findById: mockProductoFindById
    }
}));

jest.unstable_mockModule('../../../../models/Categoria.js', () => ({
    default: {
        findById: mockCategoriaFindById
    }
}));

const { activarProducto } = await import('../../../../controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo productos - Activar producto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería activar correctamente un producto', async () => {
        const req = {
            params: {
                id: 'producto123'
            }
        };
        const productoMock = {
            _id: 'producto123',
            estado: false,
            categoria: 'categoria123',
            save: jest.fn().mockResolvedValue(true)
        };
        const categoriaMock = {
            _id: 'categoria123',
            estado: true
        };
        mockProductoFindById.mockResolvedValue(productoMock);
        mockCategoriaFindById.mockResolvedValue(categoriaMock);
        const res = mockResponse();
        await activarProducto(req, res);
        expect(mockProductoFindById).toHaveBeenCalledWith('producto123');
        expect(mockCategoriaFindById).toHaveBeenCalledWith('categoria123');
        expect(productoMock.estado).toBe(true);
        expect(productoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto activado correctamente'
        });
    });

    test('Debería retornar error si el producto no existe', async () => {
        const req = {
            params: {id: 'producto-no-existe'}
        };
        mockProductoFindById.mockResolvedValue(null);
        const res = mockResponse();
        await activarProducto(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto no encontrado'
        });
    });

    test('Debería retornar error si la categoría está inactiva', async () => {
        const req = {
            params: {
                id: 'producto123'
            }
        };
        const productoMock = {
            _id: 'producto123',
            estado: false,
            categoria: 'categoria123',
            save: jest.fn()
        };
        const categoriaMock = {
            _id: 'categoria123',
            estado: false
        };
        mockProductoFindById.mockResolvedValue(productoMock);
        mockCategoriaFindById.mockResolvedValue(categoriaMock);
        const res = mockResponse();
        await activarProducto(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No se puede activar el producto porque su categoría está inactiva'
        });
    });
});