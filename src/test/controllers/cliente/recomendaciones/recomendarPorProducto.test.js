import { jest } from '@jest/globals';

const mockProductoFindById = jest.fn();
const mockProductoFind = jest.fn();
const mockAxiosPost = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/Producto.js', () => ({
    default: {
        findById: mockProductoFindById,
        find: mockProductoFind
    }
}));

jest.unstable_mockModule('axios', () => ({
    default: {
        post: mockAxiosPost
    }
}));

const { recomendarPorProducto } = await import(
    process.cwd() + '/src/controllers/RecoIAController.js'
);

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockFindByIdProducto = (producto) => {
    mockProductoFindById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(producto)
    });
};

const mockFindProductosDisponibles = (productos) => {
    const limitMock = jest.fn().mockResolvedValue(productos);
    const populateMock = jest.fn().mockReturnValue({ limit: limitMock });
    const selectMock = jest.fn().mockReturnValue({ populate: populateMock });

    mockProductoFind.mockReturnValueOnce({ select: selectMock });
};

const mockFindProductosRecomendados = (productos) => {
    const populateMock = jest.fn().mockResolvedValue(productos);
    const selectMock = jest.fn().mockReturnValue({ populate: populateMock });

    mockProductoFind.mockReturnValueOnce({ select: selectMock });
};

describe('Módulo cliente - Recomendaciones inteligentes por producto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.POLLINATIONS_MODEL = 'openai';
        process.env.POLLINATIONS_API_KEY = 'api-key-prueba';
    });

    test('Debería generar recomendaciones correctamente usando IA', async () => {
        const req = {
            params: {
                productoId: 'producto-base'
            }
        };

        const productoActual = {
            _id: 'producto-base',
            nombre: 'Cuaderno Universitario'
        };

        const productosDisponibles = [
            {
                _id: {
                    toString: () => 'producto-1'
                },
                nombre: 'Lápiz HB',
                descripcion: 'Lápiz escolar',
                precioVenta: 0.35,
                stock: 20,
                imagen: {},
                categoria: {
                    nombre: 'Papelería'
                },
                marca: 'Norma',
                color: 'Amarillo',
                material: 'Madera',
                tamanio: '',
                presentacion: ''
            }
        ];

        const productosRecomendados = [
            {
                _id: {
                    toString: () => 'producto-1'
                },
                nombre: 'Lápiz HB',
                descripcion: 'Lápiz escolar',
                precioVenta: 0.35,
                stock: 20,
                imagen: {},
                categoria: {
                    nombre: 'Papelería'
                },
                marca: 'Norma',
                color: 'Amarillo',
                material: 'Madera',
                tamanio: '',
                presentacion: ''
            }
        ];

        mockFindByIdProducto(productoActual);
        mockFindProductosDisponibles(productosDisponibles);

        mockAxiosPost.mockResolvedValue({
            data: {
                choices: [
                    {
                        message: {
                            content: JSON.stringify({
                                recomendaciones: [
                                    {
                                        productoId: 'producto-1',
                                        motivo: 'Complementa bien tu compra.'
                                    }
                                ]
                            })
                        }
                    }
                ]
            }
        });

        mockFindProductosRecomendados(productosRecomendados);

        const res = mockResponse();

        await recomendarPorProducto(req, res);

        expect(mockAxiosPost).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Recomendaciones generadas correctamente',
                titulo: 'Productos que te pueden interesar'
            })
        );
    });

    test('Debería retornar 404 si el producto base no existe', async () => {
        const req = {
            params: {
                productoId: 'producto-no-existe'
            }
        };

        mockFindByIdProducto(null);

        const res = mockResponse();

        await recomendarPorProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto no encontrado'
        });
    });

    test('Debería retornar lista vacía si no hay productos disponibles', async () => {
        const req = {
            params: {
                productoId: 'producto-base'
            }
        };

        mockFindByIdProducto({
            _id: 'producto-base',
            nombre: 'Cuaderno Universitario'
        });

        mockFindProductosDisponibles([]);

        const res = mockResponse();

        await recomendarPorProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No hay productos disponibles para recomendar',
            recomendaciones: []
        });
    });

    test('Debería manejar cuando la IA no devuelve JSON válido', async () => {
        const req = {
            params: {
                productoId: 'producto-base'
            }
        };

        mockFindByIdProducto({
            _id: 'producto-base',
            nombre: 'Cuaderno Universitario'
        });

        mockFindProductosDisponibles([
            {
                _id: {
                    toString: () => 'producto-1'
                },
                nombre: 'Lápiz HB',
                categoria: {
                    nombre: 'Papelería'
                }
            }
        ]);

        mockAxiosPost.mockResolvedValue({
            data: {
                choices: [
                    {
                        message: {
                            content: 'respuesta no valida'
                        }
                    }
                ]
            }
        });

        const res = mockResponse();

        await recomendarPorProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La IA no devolvió un JSON válido',
            respuestaIA: 'respuesta no valida'
        });
    });

    test('Debería manejar errores al generar recomendaciones con IA', async () => {
        const req = {
            params: {
                productoId: 'producto-base'
            }
        };

        mockProductoFindById.mockImplementation(() => {
            throw new Error('Error de base de datos');
        });

        const res = mockResponse();

        await recomendarPorProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al generar recomendaciones con IA',
            error: 'Error de base de datos'
        });
    });
});