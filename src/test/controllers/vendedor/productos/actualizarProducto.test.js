import { jest } from '@jest/globals';

const mockProductoFindById = jest.fn();
const mockProductoFindOne = jest.fn();
const mockCategoriaFindById = jest.fn();
const mockSubirImagenCloudinary = jest.fn();
const mockCloudinaryDestroy = jest.fn();

jest.unstable_mockModule('../../../../models/Producto.js', () => ({
    default: {
        findById: mockProductoFindById,
        findOne: mockProductoFindOne
    }
}));

jest.unstable_mockModule('../../../../models/Categoria.js', () => ({
    default: {
        findById: mockCategoriaFindById
    }
}));

jest.unstable_mockModule('../../../../helpers/uploadCloudinary.js', () => ({
    subirImagenCloudinary: mockSubirImagenCloudinary
}));

jest.unstable_mockModule('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: mockCloudinaryDestroy
        }
    }
}));

const { actualizarProducto } = await import('../../../../controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo productos - Actualizar producto', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería actualizar correctamente un producto', async () => {
        const req = {
            params: {
                id: 'producto123'
            },
            body: {
                nombre: 'Cuaderno universitario',
                descripcion: 'Cuaderno de 100 hojas',
                codigo: 'CUAD-001',
                precioCompra: '1.00',
                precioVenta: '1.50',
                stock: '50',
                stockMinimo: '10',
                marca: 'Norma',
                proveedor: 'Proveedor Moreno',
                unidadMedida: 'Unidad',
                destacado: true
            }
        };
        const productoMock = {
            _id: 'producto123',
            nombre: 'Cuaderno anterior',
            descripcion: 'Descripción anterior',
            codigo: 'CUAD-000',
            categoria: {
                toString: () => 'categoria123'
            },
            imagen: {
                url: '',
                public_id: ''
            },
            save: jest.fn().mockResolvedValue(true)
        };
        mockProductoFindById.mockResolvedValue(productoMock);
        mockProductoFindOne.mockResolvedValue(null);
        const res = mockResponse();
        await actualizarProducto(req, res);
        expect(productoMock.nombre).toBe('Cuaderno universitario');
        expect(productoMock.descripcion).toBe('Cuaderno de 100 hojas');
        expect(productoMock.codigo).toBe('CUAD-001');
        expect(productoMock.precioCompra).toBe(1);
        expect(productoMock.precioVenta).toBe(1.5);
        expect(productoMock.stock).toBe(50);
        expect(productoMock.stockMinimo).toBe(10);
        expect(productoMock.marca).toBe('Norma');
        expect(productoMock.proveedor).toBe('Proveedor Moreno');
        expect(productoMock.unidadMedida).toBe('Unidad');
        expect(productoMock.destacado).toBe(true);
        expect(productoMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto actualizado correctamente'
        });
    });

    test('Debería retornar error si el producto no existe', async () => {
        const req = {
            params: {
                id: 'producto-no-existe'
            },
            body: {
                nombre: 'Producto prueba'
            }
        };
        mockProductoFindById.mockResolvedValue(null);
        const res = mockResponse();
        await actualizarProducto(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Producto no encontrado'
        });
    });

    test('Debería retornar error si la nueva categoría no existe', async () => {
        const req = {
            params: {
                id: 'producto123'
            },
            body: {
                categoria: 'categoria-nueva'
            }
        };

        const productoMock = {
            _id: 'producto123',
            codigo: 'CUAD-001',
            categoria: {
                toString: () => 'categoria-anterior'
            },
            save: jest.fn()
        };

        mockProductoFindById.mockResolvedValue(productoMock);
        mockCategoriaFindById.mockResolvedValue(null);

        const res = mockResponse();

        await actualizarProducto(req, res);

        expect(mockCategoriaFindById).toHaveBeenCalledWith('categoria-nueva');

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La categoría asignada no existe'
        });
    });

    test('Debería retornar error si el nuevo código interno ya está registrado', async () => {
        const req = {
            params: {
                id: 'producto123'
            },
            body: {
                codigo: 'COD-002'
            }
        };

        const productoMock = {
            _id: 'producto123',
            codigo: 'COD-001',
            categoria: {
                toString: () => 'categoria123'
            },
            save: jest.fn()
        };

        mockProductoFindById.mockResolvedValue(productoMock);
        mockProductoFindOne.mockResolvedValue({
            _id: 'otro-producto',
            codigo: 'COD-002'
        });

        const res = mockResponse();

        await actualizarProducto(req, res);

        expect(mockProductoFindOne).toHaveBeenCalledWith({
            codigo: 'COD-002',
            _id: { $ne: 'producto123' }
        });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El nuevo código interno ya está registrado'
        });
    });
});