import { jest } from '@jest/globals';

const mockFind = jest.fn();
const mockCountDocuments = jest.fn();

jest.unstable_mockModule('../../../../models/Usuario.js', () => ({
    default: {
        find: mockFind,
        countDocuments: mockCountDocuments
    }
}));

const { listarClientesActivos } = await import('../../../../controllers/adminController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockConsulta = (resultado = []) => {
    const limitMock = jest.fn().mockResolvedValue(resultado);
    const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
    const populateMock = jest.fn().mockReturnValue({ skip: skipMock });
    const selectMock = jest.fn().mockReturnValue({ populate: populateMock });

    mockFind.mockReturnValue({ select: selectMock });

    return { skipMock, limitMock };
};

describe('Módulo administrador - Gestión de clientes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería listar clientes activos correctamente', async () => {
        const req = {
            query: {
                page: '1',
                limit: '15'
            }
        };

        const clientesMock = [
            {
                _id: 'usuario1',
                email: 'cliente1@gmail.com',
                rol: 'CLIENTE',
                estado: true
            }
        ];

        mockConsulta(clientesMock);
        mockCountDocuments.mockResolvedValue(1);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(mockFind).toHaveBeenCalledWith({
            rol: 'CLIENTE',
            estado: true
        });

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            total: 1,
            pagina: 1,
            limite: 15,
            totalPaginas: 1,
            usuarios: clientesMock
        });
    });

    test('Debería aplicar paginación correctamente', async () => {
        const req = {
            query: {
                page: '2',
                limit: '10'
            }
        };

        const { skipMock, limitMock } = mockConsulta([]);
        mockCountDocuments.mockResolvedValue(20);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(skipMock).toHaveBeenCalledWith(10);
        expect(limitMock).toHaveBeenCalledWith(10);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('Debería manejar errores al listar clientes activos', async () => {
        const req = {
            query: {}
        };

        mockFind.mockImplementation(() => {
            throw new Error('Error de base de datos');
        });

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Error al listar clientes activos',
            error: 'Error de base de datos'
        });
    });
});