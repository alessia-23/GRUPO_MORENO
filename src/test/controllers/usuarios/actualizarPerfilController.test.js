import { jest } from '@jest/globals';

const mockUsuarioFindById = jest.fn();
const mockAdministradorFindById = jest.fn();
const mockClienteFindById = jest.fn();
const mockVendedorFindById = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findById: mockUsuarioFindById
    }
}));

jest.unstable_mockModule('../../../models/Administrador.js', () => ({
    default: {
        findById: mockAdministradorFindById
    }
}));

jest.unstable_mockModule('../../../models/Cliente.js', () => ({
    default: {
        findById: mockClienteFindById
    }
}));

jest.unstable_mockModule('../../../models/Vendedor.js', () => ({
    default: {
        findById: mockVendedorFindById
    }
}));

const { actualizarPerfil } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Actualización de perfil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería actualizar correctamente la información del perfil del administrador', async () => {
        const req = {
            usuario: {
                id: 'usuario123'
            },
            body: {
                nombre: 'Grupo',
                apellido: 'Moreno',
                telefono: '0999999999',
                direccion: 'Quito'
            }
        };

        const usuarioMock = {
            _id: 'usuario123',
            rol: 'ADMINISTRADOR',
            perfilId: 'perfil123'
        };

        const perfilMock = {
            nombre: 'Admin',
            apellido: 'Anterior',
            telefono: '0988888888',
            direccion: 'Anterior',
            save: jest.fn().mockResolvedValue(true)
        };

        mockUsuarioFindById.mockResolvedValue(usuarioMock);
        mockAdministradorFindById.mockResolvedValue(perfilMock);

        const res = mockResponse();

        await actualizarPerfil(req, res);

        expect(perfilMock.nombre).toBe('Grupo');
        expect(perfilMock.apellido).toBe('Moreno');
        expect(perfilMock.telefono).toBe('0999999999');
        expect(perfilMock.direccion).toBe('Quito');
        expect(perfilMock.save).toHaveBeenCalled();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Perfil actualizado correctamente',
            perfil: perfilMock
        });
    });

    test('Debería retornar error si el usuario no existe', async () => {
        const req = {
            usuario: {
                id: 'usuario-no-existe'
            },
            body: {
                nombre: 'Grupo'
            }
        };

        mockUsuarioFindById.mockResolvedValue(null);

        const res = mockResponse();

        await actualizarPerfil(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario no encontrado'
        });
    });

    test('Debería retornar error si el perfil de administrador no existe', async () => {
        const req = {
            usuario: {
                id: 'usuario123'
            },
            body: {
                nombre: 'Grupo'
            }
        };

        const usuarioMock = {
            _id: 'usuario123',
            rol: 'ADMINISTRADOR',
            perfilId: 'perfil123'
        };

        mockUsuarioFindById.mockResolvedValue(usuarioMock);
        mockAdministradorFindById.mockResolvedValue(null);

        const res = mockResponse();

        await actualizarPerfil(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Perfil de administrador no encontrado'
        });
    });
});