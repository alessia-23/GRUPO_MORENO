import { jest } from '@jest/globals';

const mockCarritoFindOne = jest.fn();
const mockProductoFindOne = jest.fn();

jest.unstable_mockModule('../../../../models/Carrito.js', () => ({
    default: {
        findOne: mockCarritoFindOne
    }
}));

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        findOne: mockProductoFindOne
    }
}));

const { validarCompraCarrito } = await import('../../../../controllers/carritoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo carrito - Validar compra del carrito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería permitir continuar con la compra si existe stock suficiente', async () => {
        const productoId = '507f1f77bcf86cd799439011';
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };
        const carritoMock = {
            _id: 'carrito123',
            cliente: 'cliente123',
            articulos: [
                {
                    producto: productoId,
                    nombreProducto: 'Cuaderno',
                    cantidad: 2
                }
            ],
            subtotalGeneral: 3,
            ivaGeneral: 0.45,
            totalGeneral: 3.45
        };
        const productoMock = {
            _id: productoId,
            estado: true,
            stock: 10
        };
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        mockProductoFindOne.mockResolvedValue(productoMock);
        const res = mockResponse();
        await validarCompraCarrito(req, res);
        expect(mockCarritoFindOne).toHaveBeenCalledWith({
            cliente: 'cliente123',
            estado: true
        });
        expect(mockProductoFindOne).toHaveBeenCalledWith({
            _id: productoId,
            estado: true
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            puedeComprar: true,
            msg: 'El carrito está listo para continuar con la compra',
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

    test('Debería impedir la compra si no existe stock suficiente', async () => {
        const productoId = '507f1f77bcf86cd799439011';
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };
        const carritoMock = {
            _id: 'carrito123',
            cliente: 'cliente123',
            articulos: [
                {
                    producto: productoId,
                    nombreProducto: 'Cuaderno',
                    cantidad: 8
                }
            ],
            subtotalGeneral: 12,
            ivaGeneral: 1.8,
            totalGeneral: 13.8
        };
        const productoMock = {
            _id: productoId,
            estado: true,
            stock: 5
        };
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        mockProductoFindOne.mockResolvedValue(productoMock);
        const res = mockResponse();
        await validarCompraCarrito(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            puedeComprar: false,
            msg: 'Algunos productos no tienen stock suficiente',
            productosConProblemas: [
                {
                    productoId: productoMock._id,
                    nombreProducto: 'Cuaderno',
                    cantidadSolicitada: 8,
                    stockDisponible: 5,
                    motivo: 'Solo hay 5 unidades disponibles',
                    accionSugerida: 'Actualiza la cantidad a 5'
                }
            ]
        });
    });
});