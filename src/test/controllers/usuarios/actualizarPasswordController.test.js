import { jest } from '@jest/globals';

const mockUsuarioFindById = jest.fn();
const mockComparePassword = jest.fn();
const mockHashPassword = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findById: mockUsuarioFindById
    }
}));

jest.unstable_mockModule('../../../helpers/bcrypt.js', () => ({
    comparePassword: mockComparePassword,
    hashPassword: mockHashPassword
}));

const { actualizarPassword } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Actualización de contraseña', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería actualizar correctamente la contraseña del usuario', async () => {
        const req = {
            usuario: {
                id: 'usuario123'
            },
            body: {
                passwordActual: 'Password1*',
                passwordNueva: 'Nueva123*',
                confirmPassword: 'Nueva123*'
            }
        };
        const usuarioMock = {
            _id: 'usuario123',
            password: 'password-encriptada',
            save: jest.fn().mockResolvedValue(true)
        };
        mockUsuarioFindById.mockResolvedValue(usuarioMock);
        mockComparePassword.mockResolvedValue(true);
        mockHashPassword.mockResolvedValue('nueva-password-encriptada');
        const res = mockResponse();
        await actualizarPassword(req, res);
        expect(mockUsuarioFindById).toHaveBeenCalledWith('usuario123');
        expect(mockComparePassword).toHaveBeenCalledWith('Password1*', 'password-encriptada');
        expect(mockHashPassword).toHaveBeenCalledWith('Nueva123*');
        expect(usuarioMock.password).toBe('nueva-password-encriptada');
        expect(usuarioMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Contraseña actualizada correctamente'
        });
    });
});