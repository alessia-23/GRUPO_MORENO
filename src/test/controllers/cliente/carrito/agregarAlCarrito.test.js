import { jest } from '@jest/globals';

const mockProductoFindOne = jest.fn();
const mockCarritoFindOne = jest.fn();

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        findOne: mockProductoFindOne
    }
}));

jest.unstable_mockModule('../../../../models/Carrito.js', () => ({
    default: {
        findOne: mockCarritoFindOne
    }
}));

const { agregarAlCarrito } = await import('../../../../controllers/carritoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo carrito - Agregar producto al carrito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería agregar correctamente un producto al carrito', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            },
            body: {
                productoId: '507f1f77bcf86cd799439011',
                cantidad: 2
            }
        };
        const productoMock = {
            _id: '507f1f77bcf86cd799439011',
            nombre: 'Cuaderno',
            codigo: 'CUAD-001',
            precioVenta: 1.5,
            tipoIVA: '15%',
            stock: 20
        };
        const carritoMock = {
            _id: 'carrito123',
            cliente: 'cliente123',
            articulos: [],
            subtotalGeneral: 0,
            ivaGeneral: 0,
            totalGeneral: 0,
            save: jest.fn().mockResolvedValue(true)
        };
        mockProductoFindOne.mockResolvedValue(productoMock);
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        const res = mockResponse();
        await agregarAlCarrito(req, res);
        expect(carritoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería retornar error si no existe stock suficiente', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            },
            body: {
                productoId: '507f1f77bcf86cd799439011',
                cantidad: 10
            }
        };
        const productoMock = {
            _id: '507f1f77bcf86cd799439011',
            stock: 5,
            precioVenta: 1.5,
            tipoIVA: '15%'
        };
        const carritoMock = {
            cliente: 'cliente123',
            articulos: []
        };
        mockProductoFindOne.mockResolvedValue(productoMock);
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        const res = mockResponse();
        await agregarAlCarrito(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Stock insuficiente. Solo hay 5 unidades disponibles'
        });
    });
});