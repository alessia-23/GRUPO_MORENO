import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockSave = jest.fn();
const mockSubirImagenCloudinary = jest.fn();

jest.unstable_mockModule('../../../../models/Categoria.js', () => {
    return {
        default: jest.fn().mockImplementation((data) => ({
            _id: 'categoria123',
            nombre: data.nombre,
            descripcion: data.descripcion,
            estado: true,
            imagen: data.imagen,
            save: mockSave
        }))
    };
});

jest.unstable_mockModule('../../../../helpers/uploadCloudinary.js', () => ({
    subirImagenCloudinary: mockSubirImagenCloudinary
}));

const Categoria = (await import('../../../../models/Categoria.js')).default;
Categoria.findOne = mockFindOne;

const { crearCategoria } = await import('../../../../controllers/categoriaController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo administrador - Crear categoría', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería crear una categoría correctamente', async () => {
        const req = {
            body: {
                nombre: 'Papelería',
                descripcion: 'Productos escolares'
            },
            files: {
                imagen: {
                    tempFilePath: 'imagen-prueba.jpg'
                }
            }
        };

        mockFindOne.mockResolvedValue(null);
        mockSubirImagenCloudinary.mockResolvedValue({
            secure_url: 'https://cloudinary.com/categoria.jpg',
            public_id: 'categoria_public_id'
        });
        mockSave.mockResolvedValue(true);

        const res = mockResponse();

        await crearCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Categoría creada correctamente'
            })
        );
    });

    test('Debería validar que el nombre sea obligatorio', async () => {
        const req = {
            body: {
                nombre: '',
                descripcion: 'Productos escolares'
            },
            files: {
                imagen: {
                    tempFilePath: 'imagen-prueba.jpg'
                }
            }
        };

        const res = mockResponse();

        await crearCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El nombre es obligatorio'
        });
    });

    test('Debería validar que la imagen sea obligatoria', async () => {
        const req = {
            body: {
                nombre: 'Papelería',
                descripcion: 'Productos escolares'
            },
            files: {}
        };

        const res = mockResponse();

        await crearCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La imagen es obligatoria'
        });
    });

    test('Debería rechazar una categoría duplicada', async () => {
        const req = {
            body: {
                nombre: 'Papelería',
                descripcion: 'Productos escolares'
            },
            files: {
                imagen: {
                    tempFilePath: 'imagen-prueba.jpg'
                }
            }
        };

        mockFindOne.mockResolvedValue({
            _id: 'categoria-existente',
            nombre: 'Papelería'
        });

        const res = mockResponse();

        await crearCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La categoría ya existe'
        });
    });

    test('Debería manejar errores al crear la categoría', async () => {
        const req = {
            body: {
                nombre: 'Papelería',
                descripcion: 'Productos escolares'
            },
            files: {
                imagen: {
                    tempFilePath: 'imagen-prueba.jpg'
                }
            }
        };

        mockFindOne.mockResolvedValue(null);
        mockSubirImagenCloudinary.mockRejectedValue(new Error('Error al subir imagen'));

        const res = mockResponse();

        await crearCategoria(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al crear categoría',
            error: 'Error al subir imagen'
        });
    });
});