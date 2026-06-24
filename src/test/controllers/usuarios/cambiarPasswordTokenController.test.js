import { jest } from '@jest/globals';

const mockUsuarioFindOne = jest.fn();
const mockHashPassword = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findOne: mockUsuarioFindOne
    }
}));

jest.unstable_mockModule('../../../helpers/bcrypt.js', () => ({
    comparePassword: jest.fn(),
    hashPassword: mockHashPassword
}));

const { cambiarPasswordToken } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Restablecer contraseña con token', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    test('Debería cambiar correctamente la contraseña usando el token', async () => {
        const req = {
            params: {
                token: 'token123'
            },
            body: {
                password: 'Nueva123*',
                confirmarPassword: 'Nueva123*'
            }
        };
        const usuarioMock = {
            token: 'token123',
            password: 'password-anterior',
            save: jest.fn().mockResolvedValue(true)
        };
        mockUsuarioFindOne.mockResolvedValue(usuarioMock);
        mockHashPassword.mockResolvedValue('password-encriptada');
        const res = mockResponse();
        await cambiarPasswordToken(req, res);
        expect(mockUsuarioFindOne).toHaveBeenCalledWith({
            token: 'token123'
        });
        expect(mockHashPassword).toHaveBeenCalledWith('Nueva123*');
        expect(usuarioMock.password).toBe('password-encriptada');
        expect(usuarioMock.token).toBe(null);
        expect(usuarioMock.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Contraseña actualizada correctamente'
        });
    });
});