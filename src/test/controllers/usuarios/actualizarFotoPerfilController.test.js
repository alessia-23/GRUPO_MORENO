import { jest } from '@jest/globals';

const mockUsuarioFindById = jest.fn();
const mockCloudinaryDestroy = jest.fn();
const mockSubirImagenCloudinary = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findById: mockUsuarioFindById
    }
}));

jest.unstable_mockModule('cloudinary', () => ({
    v2: {
        uploader: {
            destroy: mockCloudinaryDestroy
        }
    }
}));

jest.unstable_mockModule('../../../helpers/uploadCloudinary.js', () => ({
    subirImagenCloudinary: mockSubirImagenCloudinary
}));

const { actualizarFotoPerfil } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Actualización de foto de perfil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería actualizar correctamente la foto de perfil del usuario', async () => {
        const req = {
            usuario: {
                id: 'usuario123'
            },
            files: {
                imagen: {
                    mimetype: 'image/png',
                    size: 1024,
                    tempFilePath: '/tmp/imagen.png'
                }
            }
        };
        const usuarioMock = {
            _id: 'usuario123',
            imagen: {
                url: '',
                public_id: ''
            },
            save: jest.fn().mockResolvedValue(true)
        };
        mockUsuarioFindById.mockResolvedValue(usuarioMock);
        mockSubirImagenCloudinary.mockResolvedValue({
            secure_url: 'https://cloudinary.com/imagen.png',
            public_id: 'usuarios/imagen123'
        });
        const res = mockResponse();
        await actualizarFotoPerfil(req, res);
        expect(mockUsuarioFindById).toHaveBeenCalledWith('usuario123');
        expect(mockSubirImagenCloudinary).toHaveBeenCalledWith(
            '/tmp/imagen.png',
            'usuarios'
        );
        expect(usuarioMock.imagen).toEqual({
            url: 'https://cloudinary.com/imagen.png',
            public_id: 'usuarios/imagen123'
        });
        expect(usuarioMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Foto de perfil actualizada correctamente',
            imagen: usuarioMock.imagen
        });
    });
});