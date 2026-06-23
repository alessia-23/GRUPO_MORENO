import { jest } from '@jest/globals';

const mockUsuarioFindOne = jest.fn();
const mockProductoFindOne = jest.fn();
const mockProductoUpdateOne = jest.fn();
const mockVentaValidate = jest.fn();
const mockVentaSave = jest.fn();
const mockRevisarAlertaStock = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/Usuario.js', () => ({
    default: {
        findOne: mockUsuarioFindOne
    }
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Producto.js', () => ({
    default: {
        findOne: mockProductoFindOne,
        updateOne: mockProductoUpdateOne
    }
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Venta.js', () => ({
    default: jest.fn().mockImplementation((data) => ({
        _id: 'venta123',
        ...data,
        resumenPago: {
            subtotalProductos: 3,
            ivaProductos: 0.45,
            costoEnvio: 0,
            totalPagar: 3.45
        },
        validate: mockVentaValidate,
        save: mockVentaSave,
        createdAt: new Date()
    }))
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Pedido.js', () => ({
    default: {}
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Carrito.js', () => ({
    default: {}
}));

jest.unstable_mockModule(process.cwd() + '/src/helpers/alertaStockHelper.js', () => ({
    default: mockRevisarAlertaStock
}));

jest.unstable_mockModule(process.cwd() + '/src/helpers/stripeHelper.js', () => ({
    cobrarConTarjeta: jest.fn()
}));

jest.unstable_mockModule(process.cwd() + '/src/helpers/calcularTotal.js', () => ({
    calcularTotales: jest.fn()
}));

const { crearVentaDirecta } = await import(process.cwd() + '/src/controllers/ventaController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const ventaValida = {
    articulos: [
        {
            producto: '507f1f77bcf86cd799439011',
            cantidad: 2
        }
    ],
    datosFacturacion: {
        nombreCompleto: 'Richard Perez',
        identificacion: '0912723061',
        correo: 'richard@test.com',
        telefono: '0980868422'
    },
    metodoPago: 'EFECTIVO',
    referenciaPago: '',
    observaciones: 'Venta directa en local'
};

describe('Módulo vendedor - Venta directa en local', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería registrar una venta directa en efectivo y descontar stock', async () => {
        const req = {
            usuario: {
                id: 'vendedor123'
            },
            body: ventaValida
        };

        mockUsuarioFindOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        mockProductoFindOne.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            nombre: 'Cuaderno Norma',
            codigo: 'CUAD-001',
            color: '',
            tamanio: '',
            stock: 10,
            precioVenta: 1.5,
            tipoIVA: '15%'
        });

        mockVentaValidate.mockResolvedValue(true);
        mockProductoUpdateOne.mockResolvedValue({
            modifiedCount: 1
        });
        mockRevisarAlertaStock.mockResolvedValue(true);
        mockVentaSave.mockResolvedValue(true);

        const res = mockResponse();

        await crearVentaDirecta(req, res);

        expect(mockProductoUpdateOne).toHaveBeenCalled();
        expect(mockVentaSave).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Venta directa registrada correctamente y stock descontado'
            })
        );
    });

    test('Debería validar que exista al menos un artículo', async () => {
        const req = {
            usuario: {
                id: 'vendedor123'
            },
            body: {
                ...ventaValida,
                articulos: []
            }
        };

        const res = mockResponse();

        await crearVentaDirecta(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Debe enviar al menos un artículo para registrar la venta'
        });
    });

    test('Debería validar que existan datos de facturación', async () => {
        const req = {
            usuario: {
                id: 'vendedor123'
            },
            body: {
                ...ventaValida,
                datosFacturacion: null
            }
        };

        const res = mockResponse();

        await crearVentaDirecta(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Los datos de facturación son obligatorios'
        });
    });

    test('Debería rechazar un método de pago no permitido', async () => {
        const req = {
            usuario: {
                id: 'vendedor123'
            },
            body: {
                ...ventaValida,
                metodoPago: 'TARJETA'
            }
        };

        const res = mockResponse();

        await crearVentaDirecta(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'En venta directa solo se permite EFECTIVO o TRANSFERENCIA'
        });
    });

    test('Debería rechazar la venta si no hay stock suficiente', async () => {
        const req = {
            usuario: {
                id: 'vendedor123'
            },
            body: ventaValida
        };

        mockUsuarioFindOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(null)
        });

        mockProductoFindOne.mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            nombre: 'Cuaderno Norma',
            codigo: 'CUAD-001',
            stock: 1,
            precioVenta: 1.5,
            tipoIVA: '15%'
        });

        const res = mockResponse();

        await crearVentaDirecta(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Stock insuficiente para "Cuaderno Norma". Disponible: 1'
        });
    });
});