import { jest } from '@jest/globals';

const mockCarritoFindOne = jest.fn();
const mockProductoFindOne = jest.fn();
const mockPedidoConstructor = jest.fn();
const mockCalcularTotales = jest.fn();

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

jest.unstable_mockModule('../../../../models/Pedido.js', () => ({
    default: mockPedidoConstructor
}));

jest.unstable_mockModule('../../../../helpers/calcularTotal.js', () => ({
    calcularTotales: mockCalcularTotales
}));

jest.unstable_mockModule('../../../../helpers/stripeHelper.js', () => ({
    cobrarConTarjeta: jest.fn()
}));

jest.unstable_mockModule('../../../../helpers/alertaStockHelper.js', () => ({
    default: jest.fn()
}));

const { crearPedidoDesdeCarrito } = await import('../../../../controllers/pedidoController.js');

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

describe('Módulo pedidos - Crear pedido desde carrito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería crear correctamente un pedido desde el carrito', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            },
            body: {
                nombrePedido: 'Pedido de útiles escolares',
                nombreCompleto: 'Richard Perez',
                identificacion: '0912723061',
                correo: 'richard@gmail.com',
                telefono: '0980868422',
                tipoEntrega: 'RETIRO_LOCAL',
                metodoPago: 'EFECTIVO',
                observaciones: 'Pedido de prueba'
            },
            app: mockApp()
        };
        const carritoMock = {
            _id: 'carrito123',
            cliente: 'cliente123',
            articulos: [
                {
                    producto: '507f1f77bcf86cd799439011',
                    nombreProducto: 'Cuaderno',
                    codigo: 'CUAD-001',
                    color: 'Azul',
                    tamanio: 'A4',
                    cantidad: 2,
                    precioUnitario: 1.5,
                    porcentajeIva: 0.15
                }
            ],
            save: jest.fn().mockResolvedValue(true)
        };
        const productoMock = {
            _id: '507f1f77bcf86cd799439011',
            estado: true,
            stock: 10
        };
        const pedidoMock = {
            _id: 'pedido123',
            cliente: 'cliente123',
            tipoPedido: 'CARRITO',
            nombrePedido: 'Pedido de útiles escolares',
            tipoEntrega: 'RETIRO_LOCAL',
            estado: 'PENDIENTE',
            save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({
                _id: 'pedido123',
                cliente: 'cliente123',
                tipoPedido: 'CARRITO',
                nombrePedido: 'Pedido de útiles escolares',
                tipoEntrega: 'RETIRO_LOCAL',
                estado: 'PENDIENTE'
            })
        };
        mockCarritoFindOne.mockResolvedValue(carritoMock);
        mockProductoFindOne.mockResolvedValue(productoMock);
        mockCalcularTotales.mockReturnValue({
            itemsCalculados: carritoMock.articulos,
            subtotalGeneral: 3,
            ivaGeneral: 0.45
        });
        mockPedidoConstructor.mockImplementation(() => pedidoMock);
        const res = mockResponse();
        await crearPedidoDesdeCarrito(req, res);
        expect(pedidoMock.save).toHaveBeenCalled();
        expect(carritoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Pedido creado desde el carrito correctamente',
            pedido: {
                _id: 'pedido123',
                cliente: 'cliente123',
                tipoPedido: 'CARRITO',
                nombrePedido: 'Pedido de útiles escolares',
                tipoEntrega: 'RETIRO_LOCAL',
                estado: 'PENDIENTE'
            }
        });
    });

    test('Debería retornar error si el carrito está vacío', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            },
            body: {
                nombrePedido: 'Pedido de útiles escolares',
                nombreCompleto: 'Richard Perez',
                identificacion: '0912723061',
                correo: 'richard@gmail.com',
                telefono: '0980868422',
                tipoEntrega: 'RETIRO_LOCAL',
                metodoPago: 'EFECTIVO'
            },
            app: mockApp()
        };
        mockCarritoFindOne.mockResolvedValue({
            articulos: []
        });
        const res = mockResponse();
        await crearPedidoDesdeCarrito(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El carrito está vacío'
        });
    });
});