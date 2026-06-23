import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockComparePassword = jest.fn();
const mockCrearTokenJWT = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findOne: mockFindOne
    }
}));

jest.unstable_mockModule('../../../helpers/bcrypt.js', () => ({
    comparePassword: mockComparePassword,
    hashPassword: jest.fn()
}));

jest.unstable_mockModule('../../../helpers/jwt.js', () => ({
    default: mockCrearTokenJWT
}));

const { login } = await import('../../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Inicio de sesión', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería iniciar sesión correctamente con credenciales válidas', async () => {
        const req = {
            body: {
                email: 'grupomoreno593@gmail.com',
                password: 'Admin1*-'
            }
        };

        const usuarioMock = {
            _id: '123',
            email: 'grupomoreno593@gmail.com',
            password: 'passwordEncriptada',
            rol: 'ADMINISTRADOR',
            estado: true,
            perfilId: {
                _id: 'perfil123',
                nombre: 'Grupo',
                apellido: 'Moreno'
            },
            perfilModelo: 'Administrador',
            imagen: null
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(usuarioMock)
        });

        mockComparePassword.mockResolvedValue(true);
        mockCrearTokenJWT.mockReturnValue('token-prueba');

        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Login exitoso',
                token: 'token-prueba'
            })
        );
    });

    test('Debería validar que el email y la contraseña sean obligatorios', async () => {
        const req = {
            body: {
                email: '',
                password: ''
            }
        };

        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Llenar todos los campos'
        });
    });

    test('Debería rechazar un usuario no encontrado', async () => {
        const req = {
            body: {
                email: 'noexiste@gmail.com',
                password: 'Admin1*-'
            }
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
        });

        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario no encontrado'
        });
    });

    test('Debería rechazar usuario inactivo', async () => {
        const req = {
            body: {
                email: 'usuario@gmail.com',
                password: 'Admin1*-'
            }
        };

        const usuarioMock = {
            estado: false
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(usuarioMock)
        });

        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario inactivo'
        });
    });

    test('Debería rechazar credenciales incorrectas', async () => {
        const req = {
            body: {
                email: 'grupomoreno593@gmail.com',
                password: 'incorrecta'
            }
        };

        const usuarioMock = {
            estado: true,
            password: 'passwordEncriptada'
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(usuarioMock)
        });

        mockComparePassword.mockResolvedValue(false);

        const res = mockResponse();

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Credenciales incorrectas, acceso denegado'
        });
    });
});