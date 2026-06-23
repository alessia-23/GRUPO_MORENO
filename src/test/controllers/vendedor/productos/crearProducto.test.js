import { jest } from '@jest/globals';

const mockProductoFindOne = jest.fn();
const mockProductoSave = jest.fn();
const mockCategoriaFindById = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/Producto.js', () => {
    const ProductoMock = jest.fn().mockImplementation((data) => ({
        _id: 'producto123',
        ...data,
        toObject: () => ({
            _id: 'producto123',
            ...data
        }),
        save: mockProductoSave
    }));

    ProductoMock.findOne = mockProductoFindOne;
    ProductoMock.collection = {
        name: 'Productos'
    };

    return { default: ProductoMock };
});

jest.unstable_mockModule(process.cwd() + '/src/models/Categoria.js', () => ({
    default: {
        findById: mockCategoriaFindById
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

const { crearProducto } = await import(process.cwd() + '/src/controllers/productoController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const productoValido = {
    nombre: 'Cuaderno Norma',
    descripcion: 'Cuaderno universitario',
    codigo: 'CUAD-001',
    precioCompra: '1.00',
    precioVenta: '1.50',
    tipoIVA: '15%',
    stock: '20',
    stockMinimo: '5',
    marca: 'Norma',
    proveedor: 'Proveedor Moreno',
    unidadMedida: 'Unidad',
    categoria: 'categoria123'
};

describe('Módulo vendedor - Manejo de productos y stock', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería crear un producto correctamente con stock inicial', async () => {
        const req = {
            body: productoValido,
            files: {}
        };

        mockProductoFindOne.mockResolvedValue(null);
        mockCategoriaFindById.mockResolvedValue({
            _id: 'categoria123',
            estado: true
        });
        mockProductoSave.mockResolvedValue(true);

        const res = mockResponse();

        await crearProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Producto creado correctamente'
            })
        );
    });

    test('Debería validar que los campos obligatorios estén completos', async () => {
        const req = {
            body: {
                nombre: '',
                codigo: '',
                precioCompra: '',
                precioVenta: '',
                stock: undefined,
                stockMinimo: undefined,
                marca: '',
                proveedor: '',
                unidadMedida: '',
                tipoIVA: '',
                categoria: ''
            },
            files: {}
        };

        const res = mockResponse();

        await crearProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Todos los campos obligatorios deben ser completados'
        });
    });

    test('Debería validar que precios y stock sean números válidos', async () => {
        const req = {
            body: {
                ...productoValido,
                precioCompra: 'abc',
                stock: 'veinte'
            },
            files: {}
        };

        const res = mockResponse();

        await crearProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Los precios y stocks deben ser números válidos'
        });
    });

    test('Debería rechazar un producto con código interno duplicado', async () => {
        const req = {
            body: productoValido,
            files: {}
        };

        mockProductoFindOne.mockResolvedValue({
            _id: 'producto-existente'
        });

        const res = mockResponse();

        await crearProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Ya existe un producto con ese código interno'
        });
    });

    test('Debería rechazar producto si la categoría no existe', async () => {
        const req = {
            body: productoValido,
            files: {}
        };

        mockProductoFindOne.mockResolvedValue(null);
        mockCategoriaFindById.mockResolvedValue(null);

        const res = mockResponse();

        await crearProducto(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La categoría no existe'
        });
    });
});