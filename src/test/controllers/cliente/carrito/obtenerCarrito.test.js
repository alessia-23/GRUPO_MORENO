import { jest } from '@jest/globals';

const mockCarritoFindOne = jest.fn();
const mockProductoFindById = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/Carrito.js', () => ({
    default: {
        findOne: mockCarritoFindOne
    }
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Producto.js', () => ({
    default: {
        findById: mockProductoFindById
    }
}));

const { obtenerCarrito } = await import(process.cwd() + '/src/controllers/carritoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockConsultaCarrito = (carrito) => {
    mockCarritoFindOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(carrito)
        })
    });
};

const mockConsultaStock = (stock = 10) => {
    mockProductoFindById.mockReturnValue({
        select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ stock })
        })
    });
};

describe('Módulo cliente - Obtener carrito', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería obtener el carrito del cliente correctamente', async () => {
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
                    producto: 'producto123',
                    nombreProducto: 'Cuaderno Norma',
                    cantidad: 2,
                    precioUnitario: 1.5
                }
            ],
            subtotalGeneral: 3,
            ivaGeneral: 0.45,
            totalGeneral: 3.45,
            estado: true
        };

        mockConsultaCarrito(carritoMock);
        mockConsultaStock(20);

        const res = mockResponse();

        await obtenerCarrito(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Carrito obtenido correctamente',
            carrito: {
                ...carritoMock,
                articulos: [
                    {
                        ...carritoMock.articulos[0],
                        stockDisponible: 20
                    }
                ]
            }
        });
    });

    test('Debería devolver carrito vacío si el cliente no tiene carrito activo', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };

        mockConsultaCarrito(null);

        const res = mockResponse();

        await obtenerCarrito(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El carrito está vacío',
            carrito: {
                cliente: 'cliente123',
                articulos: [],
                subtotalGeneral: 0,
                ivaGeneral: 0,
                totalGeneral: 0,
                estado: true
            }
        });
    });

    test('Debería agregar stock disponible a cada artículo del carrito', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };

        const carritoMock = {
            cliente: 'cliente123',
            articulos: [
                {
                    producto: 'producto123',
                    nombreProducto: 'Lápiz',
                    cantidad: 1
                }
            ],
            subtotalGeneral: 1,
            ivaGeneral: 0.15,
            totalGeneral: 1.15,
            estado: true
        };

        mockConsultaCarrito(carritoMock);
        mockConsultaStock(8);

        const res = mockResponse();

        await obtenerCarrito(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Carrito obtenido correctamente',
                carrito: expect.objectContaining({
                    articulos: [
                        expect.objectContaining({
                            stockDisponible: 8
                        })
                    ]
                })
            })
        );
    });

    test('Debería mostrar stock disponible en cero si el producto ya no existe', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };

        const carritoMock = {
            cliente: 'cliente123',
            articulos: [
                {
                    producto: 'producto123',
                    nombreProducto: 'Producto eliminado',
                    cantidad: 1
                }
            ],
            subtotalGeneral: 1,
            ivaGeneral: 0,
            totalGeneral: 1,
            estado: true
        };

        mockConsultaCarrito(carritoMock);

        mockProductoFindById.mockReturnValue({
            select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            })
        });

        const res = mockResponse();

        await obtenerCarrito(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                carrito: expect.objectContaining({
                    articulos: [
                        expect.objectContaining({
                            stockDisponible: 0
                        })
                    ]
                })
            })
        );
    });

    test('Debería manejar errores al obtener el carrito', async () => {
        const req = {
            usuario: {
                id: 'cliente123'
            }
        };

        mockCarritoFindOne.mockImplementation(() => {
            throw new Error('Error de base de datos');
        });

        const res = mockResponse();

        await obtenerCarrito(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al obtener el carrito',
            error: 'Error de base de datos'
        });
    });
});