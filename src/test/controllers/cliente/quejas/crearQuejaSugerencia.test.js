import { jest } from '@jest/globals';

const mockQuejaCreate = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/QuejaSugerencia.js', () => ({
    default: {
        create: mockQuejaCreate
    }
}));

const { crearQuejaSugerencia } = await import(
    process.cwd() + '/src/controllers/quejaSugerenciaController.js'
);

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = (body, rol = 'CLIENTE') => ({
    usuario: {
        id: 'cliente123',
        rol
    },
    body,
    app: {
        get: jest.fn().mockReturnValue(null)
    }
});

describe('Módulo cliente - Crear queja o sugerencia', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería crear una queja correctamente', async () => {
        const req = mockRequest({
            tipo: 'QUEJA',
            asunto: 'Demora en pedido',
            mensaje: 'Mi pedido demoró demasiado.'
        });
        const quejaMock = {
            _id: 'queja123',
            usuario: 'cliente123',
            rolUsuario: 'CLIENTE',
            tipo: 'QUEJA',
            asunto: 'Demora en pedido',
            mensaje: 'Mi pedido demoró demasiado.',
            estado: 'PENDIENTE'
        };
        mockQuejaCreate.mockResolvedValue(quejaMock);
        const res = mockResponse();
        await crearQuejaSugerencia(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Queja o sugerencia enviada correctamente',
            quejaSugerencia: quejaMock
        });
    });

    test('Debería crear una sugerencia correctamente', async () => {
        const req = mockRequest({
            tipo: 'SUGERENCIA',
            asunto: 'Más productos',
            mensaje: 'Sería bueno agregar más productos escolares.'
        });
        mockQuejaCreate.mockResolvedValue({
            _id: 'sugerencia123',
            tipo: 'SUGERENCIA',
            asunto: 'Más productos',
            mensaje: 'Sería bueno agregar más productos escolares.',
            estado: 'PENDIENTE'
        });
        const res = mockResponse();
        await crearQuejaSugerencia(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Queja o sugerencia enviada correctamente'
            })
        );
    });

    test('Debería permitir enviar quejas o sugerencias solo a clientes', async () => {
        const req = mockRequest({
            tipo: 'QUEJA',
            asunto: 'Problema',
            mensaje: 'Mensaje de prueba.'
        }, 'VENDEDOR');
        const res = mockResponse();
        await crearQuejaSugerencia(req, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Solo los clientes pueden enviar quejas o sugerencias'
        });
    });

    test('Debería validar que el tipo sea QUEJA o SUGERENCIA', async () => {
        const req = mockRequest({
            tipo: 'RECLAMO',
            asunto: 'Problema',
            mensaje: 'Tengo un problema con el servicio.'
        });
        const res = mockResponse();
        await crearQuejaSugerencia(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El tipo debe ser QUEJA o SUGERENCIA'
        });
    });

    test('Debería validar que el asunto sea obligatorio', async () => {
        const req = mockRequest({
            tipo: 'QUEJA',
            asunto: '',
            mensaje: 'Tengo un problema con mi pedido.'
        });

        const res = mockResponse();

        await crearQuejaSugerencia(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El asunto es obligatorio'
        });
    });

    test('Debería validar que el mensaje sea obligatorio', async () => {
        const req = mockRequest({
            tipo: 'QUEJA',
            asunto: 'Problema con pedido',
            mensaje: ''
        });

        const res = mockResponse();

        await crearQuejaSugerencia(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El mensaje es obligatorio'
        });
    });
});