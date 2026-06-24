import { jest } from '@jest/globals';

const mockUsuarioFindById = jest.fn();
const mockAdministradorFindById = jest.fn();

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
        findById: jest.fn()
    }
}));

jest.unstable_mockModule('../../../models/Vendedor.js', () => ({
    default: {
        findById: jest.fn()
    }
}));

const { obtenerPerfil } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Obtener perfil', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería obtener correctamente el perfil del usuario', async () => {
        const req = {
            usuario: {
                id: 'usuario123'
            }
        };
        const usuarioMock = {
            _id: 'usuario123',
            rol: 'ADMINISTRADOR',
            perfilId: 'perfil123'
        };
        const perfilMock = {
            _id: 'perfil123',
            nombre: 'Grupo',
            apellido: 'Moreno'
        };
        mockUsuarioFindById.mockReturnValue({
            select: jest.fn().mockResolvedValue(usuarioMock)
        });
        mockAdministradorFindById.mockResolvedValue(perfilMock);
        const res = mockResponse();
        await obtenerPerfil(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Perfil obtenido correctamente',
            usuario: usuarioMock,
            perfil: perfilMock
        });

    });

});