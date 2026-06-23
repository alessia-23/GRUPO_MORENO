import { jest } from '@jest/globals';

const mockProductoCountDocuments = jest.fn();
const mockProductoFind = jest.fn();
const mockCategoriaFind = jest.fn();
const mockCategoriaFindOne = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/Producto.js', () => ({
    default: {
        countDocuments: mockProductoCountDocuments,
        find: mockProductoFind
    }
}));

jest.unstable_mockModule(process.cwd() + '/src/models/Categoria.js', () => ({
    default: {
        find: mockCategoriaFind,
        findOne: mockCategoriaFindOne
    }
}));

jest.unstable_mockModule(process.cwd() + '/src/helpers/uploadCloudinary.js', () => ({
    subirImagenCloudinary: jest.fn()
}));

jest.unstable_mockModule('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: jest.fn()
        }
    }
}));

const { todosProductos } = await import(process.cwd() + '/src/controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockConsultaProductos = (productos = []) => {
    const leanMock = jest.fn().mockResolvedValue(productos);
    const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
    const selectMock = jest.fn().mockReturnValue({ sort: sortMock });
    const populateMock = jest.fn().mockReturnValue({ select: selectMock });

    mockProductoFind.mockReturnValue({ populate: populateMock });

    return { populateMock, selectMock, sortMock, skipMock, limitMock, leanMock };
};

const mockCategoriasActivas = () => {
    mockCategoriaFind.mockReturnValue({
        select: jest.fn().mockResolvedValue([
            { _id: 'categoria1' },
            { _id: 'categoria2' }
        ])
    });
};

describe('Catálogo público - Explorar productos', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería listar productos activos correctamente', async () => {
        const req = {
            query: {
                page: '1',
                limit: '20'
            }
        };

        const productosMock = [
            {
                _id: 'producto1',
                nombre: 'Cuaderno Norma',
                precioVenta: 1.5,
                stock: 20,
                destacado: true
            }
        ];

        mockCategoriasActivas();
        mockProductoCountDocuments.mockResolvedValue(1);
        mockConsultaProductos(productosMock);

        const res = mockResponse();

        await todosProductos(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            totalProductos: 1,
            totalEnPagina: 1,
            paginaActual: 1,
            limite: 20,
            totalPaginas: 1,
            productos: productosMock
        });
    });

    test('Debería listar solo productos destacados para el carrusel', async () => {
        const req = {
            query: {
                destacado: 'true',
                page: '1',
                limit: '16'
            }
        };

        mockCategoriasActivas();
        mockProductoCountDocuments.mockResolvedValue(1);
        mockConsultaProductos([
            {
                _id: 'producto1',
                nombre: 'Peluches',
                destacado: true
            }
        ]);

        const res = mockResponse();

        await todosProductos(req, res);

        expect(mockProductoCountDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                estado: true,
                destacado: true
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería buscar productos por nombre', async () => {
        const req = {
            query: {
                buscar: 'cuaderno'
            }
        };

        mockCategoriasActivas();
        mockProductoCountDocuments.mockResolvedValue(0);
        mockConsultaProductos([]);

        const res = mockResponse();

        await todosProductos(req, res);

        expect(mockProductoCountDocuments).toHaveBeenCalledWith(
            expect.objectContaining({
                nombre: {
                    $regex: 'cuaderno',
                    $options: 'i'
                }
            })
        );

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería rechazar una categoría inexistente o inactiva', async () => {
        const req = {
            query: {
                categoria: '507f1f77bcf86cd799439011'
            }
        };

        mockCategoriaFindOne.mockResolvedValue(null);

        const res = mockResponse();

        await todosProductos(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La categoría seleccionada no existe o está inactiva'
        });
    });

    test('Debería manejar errores al explorar productos', async () => {
        const req = {
            query: {}
        };

        mockCategoriaFind.mockImplementation(() => {
            throw new Error('Error de base de datos');
        });

        const res = mockResponse();

        await todosProductos(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Error al explorar productos'
            })
        );
    });
});