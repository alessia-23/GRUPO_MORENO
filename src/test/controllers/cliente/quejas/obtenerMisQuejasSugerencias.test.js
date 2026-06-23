import { jest } from '@jest/globals';

const mockQuejaFind = jest.fn();

jest.unstable_mockModule(process.cwd() + '/src/models/QuejaSugerencia.js', () => ({
    default: {
        find: mockQuejaFind
    }
}));

const { obtenerMisQuejasSugerencias } = await import(
    process.cwd() + '/src/controllers/quejaSugerenciaController.js'
);

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockConsultaQuejas = (resultado = []) => {
    const sortMock = jest.fn().mockResolvedValue(resultado);
    const selectMock = jest.fn().mockReturnValue({ sort: sortMock });

    mockQuejaFind.mockReturnValue({ select: selectMock });
};

describe('Módulo cliente - Mis quejas y sugerencias', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería obtener las quejas y sugerencias del cliente correctamente', async () => {
        const req = {
            usuario: { id: 'cliente123', rol: 'CLIENTE' },
            query: {}
        };

        const quejasMock = [
            {
                _id: 'queja123',
                tipo: 'QUEJA',
                asunto: 'Demora en pedido',
                mensaje: 'Mi pedido demoró demasiado',
                estado: 'PENDIENTE'
            }
        ];

        mockConsultaQuejas(quejasMock);

        const res = mockResponse();

        await obtenerMisQuejasSugerencias(req, res);

        expect(mockQuejaFind).toHaveBeenCalledWith({
            usuario: 'cliente123'
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Quejas y sugerencias obtenidas correctamente',
            quejasSugerencias: quejasMock
        });
    });

    test('Debería filtrar mis quejas por estado PENDIENTE', async () => {
        const req = {
            usuario: { id: 'cliente123', rol: 'CLIENTE' },
            query: { estado: 'PENDIENTE' }
        };

        mockConsultaQuejas([]);

        const res = mockResponse();

        await obtenerMisQuejasSugerencias(req, res);

        expect(mockQuejaFind).toHaveBeenCalledWith({
            usuario: 'cliente123',
            estado: 'PENDIENTE'
        });

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería filtrar mis quejas por tipo SUGERENCIA', async () => {
        const req = {
            usuario: { id: 'cliente123', rol: 'CLIENTE' },
            query: { tipo: 'SUGERENCIA' }
        };

        mockConsultaQuejas([]);

        const res = mockResponse();

        await obtenerMisQuejasSugerencias(req, res);

        expect(mockQuejaFind).toHaveBeenCalledWith({
            usuario: 'cliente123',
            tipo: 'SUGERENCIA'
        });

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería rechazar un estado inválido', async () => {
        const req = {
            usuario: { id: 'cliente123', rol: 'CLIENTE' },
            query: { estado: 'EN_REVISION' }
        };

        const res = mockResponse();

        await obtenerMisQuejasSugerencias(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El estado debe ser PENDIENTE o FINALIZADA'
        });
    });

    test('Debería rechazar acceso si el usuario no es cliente', async () => {
        const req = {
            usuario: { id: 'vendedor123', rol: 'VENDEDOR' },
            query: {}
        };

        const res = mockResponse();

        await obtenerMisQuejasSugerencias(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'No tienes permiso para ver quejas o sugerencias'
        });
    });
});