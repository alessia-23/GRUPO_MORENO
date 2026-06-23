import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockAxiosPost = jest.fn();
const mockGenerarToken = jest.fn();

jest.unstable_mockModule('../../models/Usuario.js', () => ({
    default: {
        findOne: mockFindOne
    }
}));

jest.unstable_mockModule('axios', () => ({
    default: {
        post: mockAxiosPost
    }
}));

jest.unstable_mockModule('../../helpers/generarToken.js', () => ({
    default: mockGenerarToken
}));

const { recuperarPassword } = await import('../../controllers/authController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Módulo de autenticación - Restablecer contraseña', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.FRONTEND_URL = 'https://distribuidoragm.netlify.app';
        process.env.N8N_WEBHOOK_RECUPERAR_PASSWORD = 'https://n8n-webhook-prueba.com';
    });

    test('Debería enviar enlace de recuperación correctamente', async () => {
        const req = {
            body: {
                email: 'grupomoreno593@gmail.com'
            }
        };

        const usuarioMock = {
            email: 'grupomoreno593@gmail.com',
            rol: 'ADMINISTRADOR',
            estado: true,
            token: null,
            perfilId: {
                nombre: 'Grupo',
                apellido: 'Moreno'
            },
            save: jest.fn().mockResolvedValue(true)
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(usuarioMock)
        });

        mockGenerarToken.mockReturnValue('token-prueba');
        mockAxiosPost.mockResolvedValue({ data: { ok: true } });

        const res = mockResponse();

        await recuperarPassword(req, res);

        expect(usuarioMock.token).toBe('token-prueba');
        expect(usuarioMock.save).toHaveBeenCalled();
        expect(mockAxiosPost).toHaveBeenCalledWith(
            process.env.N8N_WEBHOOK_RECUPERAR_PASSWORD,
            expect.objectContaining({
                email: 'grupomoreno593@gmail.com',
                nombre: 'Grupo',
                apellido: 'Moreno',
                rol: 'ADMINISTRADOR',
                resetLink: 'https://distribuidoragm.netlify.app/recuperar-password/token-prueba'
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Enlace de recuperación enviado correctamente'
        });
    });

    test('Debería validar que el correo sea obligatorio', async () => {
        const req = {
            body: {
                email: ''
            }
        };

        const res = mockResponse();

        await recuperarPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Debe ingresar el correo'
        });
    });

    test('Debería rechazar correo no registrado', async () => {
        const req = {
            body: {
                email: 'noexiste@gmail.com'
            }
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(null)
        });

        const res = mockResponse();

        await recuperarPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario no encontrado'
        });
    });

    test('Debería rechazar usuario inactivo', async () => {
        const req = {
            body: {
                email: 'usuarioinactivo@gmail.com'
            }
        };

        const usuarioMock = {
            estado: false
        };

        mockFindOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(usuarioMock)
        });

        const res = mockResponse();

        await recuperarPassword(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Usuario inactivo'
        });
    });
});