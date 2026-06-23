import { jest } from '@jest/globals';

const mockFind = jest.fn();

jest.unstable_mockModule('../../../../models/QuejaSugerencia.js', () => ({
    default: {
        find: mockFind
    }
}));

const { obtenerQuejasSugerenciasAdmin } = await import('../../../../controllers/quejaSugerenciaController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockConsulta = (resultado = []) => {
    const sortMock = jest.fn().mockResolvedValue(resultado);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });

    mockFind.mockReturnValue({ populate: populateMock });

    return { populateMock, sortMock };
};

describe('Módulo administrador - Atención de quejas y sugerencias', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería obtener quejas y sugerencias correctamente', async () => {
        const req = { query: {} };

        const quejasMock = [
            {
                _id: 'queja1',
                tipo: 'QUEJA',
                asunto: 'Demora en pedido',
                mensaje: 'Mi pedido no llegó',
                estado: 'PENDIENTE'
            }
        ];

        mockConsulta(quejasMock);

        const res = mockResponse();

        await obtenerQuejasSugerenciasAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Quejas y sugerencias obtenidas correctamente',
            quejasSugerencias: quejasMock
        });
    });

    test('Debería filtrar por estado válido', async () => {
        const req = {
            query: {
                estado: 'PENDIENTE'
            }
        };

        mockConsulta([]);

        const res = mockResponse();

        await obtenerQuejasSugerenciasAdmin(req, res);

        expect(mockFind).toHaveBeenCalledWith({
            estado: 'PENDIENTE'
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería filtrar por tipo válido', async () => {
        const req = {
            query: {
                tipo: 'SUGERENCIA'
            }
        };

        mockConsulta([]);

        const res = mockResponse();

        await obtenerQuejasSugerenciasAdmin(req, res);

        expect(mockFind).toHaveBeenCalledWith({
            tipo: 'SUGERENCIA'
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería rechazar estado no válido', async () => {
        const req = {
            query: {
                estado: 'EN_REVISION'
            }
        };

        const res = mockResponse();

        await obtenerQuejasSugerenciasAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El estado debe ser PENDIENTE o FINALIZADA'
        });
    });

    test('Debería manejar errores al obtener quejas y sugerencias', async () => {
        const req = { query: {} };

        mockFind.mockImplementation(() => {
            throw new Error('Error de base de datos');
        });

        const res = mockResponse();

        await obtenerQuejasSugerenciasAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al obtener las quejas y sugerencias'
        });
    });
});