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

const { actualizarCantidadCarrito } = await import('../../../../controllers/carritoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo carrito - Actualizar cantidad', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería actualizar correctamente la cantidad del producto en el carrito', async () => {
        const productoId = '507f1f77bcf86cd799439011';
        const req = {
            usuario: {
                id: 'cliente123'
            },
            params: {
                productoId
            },
            body: {
                cantidad: 3
            }
        };
        const productoMock = {
            _id: productoId,
            stock: 10,
            precioVenta: 1.5,
            tipoIVA: '15%'
        };
        const articuloMock = {
            producto: {
                toString: () => productoId
            },
            cantidad: 1,
            precioUnitario: 1.5,
            tipoPrecio: 'NORMAL',
            porcentajeIva: 0.15
        };
        const carritoMock = {
            _id: 'carrito123',
            cliente: 'cliente123',
            articulos: [articuloMock],
            subtotalGeneral: 0,
            ivaGeneral: 0,
            totalGeneral: 0,
            save: jest.fn().mockResolvedValue(true)
        };
        mockProductoFindOne.mockResolvedValue(productoMock);
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        const res = mockResponse();
        await actualizarCantidadCarrito(req, res);
        expect(articuloMock.cantidad).toBe(3);
        expect(carritoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Cantidad actualizada correctamente',
            carrito: {
                _id: carritoMock._id,
                cliente: carritoMock.cliente,
                articulos: carritoMock.articulos,
                subtotalGeneral: carritoMock.subtotalGeneral,
                ivaGeneral: carritoMock.ivaGeneral,
                totalGeneral: carritoMock.totalGeneral
            }
        });
    });

    test('Debería retornar error si no hay stock suficiente', async () => {
        const productoId = '507f1f77bcf86cd799439011';
        const req = {
            usuario: {
                id: 'cliente123'
            },
            params: {
                productoId
            },
            body: {
                cantidad: 20
            }
        };
        const productoMock = {
            _id: productoId,
            stock: 5,
            precioVenta: 1.5,
            tipoIVA: '15%'
        };
        mockProductoFindOne.mockResolvedValue(productoMock);
        const res = mockResponse();
        await actualizarCantidadCarrito(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Stock insuficiente. Solo hay 5 unidades disponibles'
        });
    });
});