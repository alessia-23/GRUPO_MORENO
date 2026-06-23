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
};

describe('Módulo administrador - Gestión de clientes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería obtener clientes activos correctamente', async () => {
        const req = { query: {} };

        const clientesMock = [
            {
                _id: '1',
                email: 'cliente@gmail.com',
                rol: 'CLIENTE',
                estado: true,
                perfilId: {
                    nombre: 'Ana',
                    apellido: 'Pérez'
                }
            }
        ];

        mockConsulta(clientesMock);
        mockCountDocuments.mockResolvedValue(1);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                total: 1,
                usuarios: clientesMock
            })
        );
    });

    test('Debería devolver una lista vacía si no existen clientes activos', async () => {
        const req = { query: {} };

        mockConsulta([]);
        mockCountDocuments.mockResolvedValue(0);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                total: 0,
                usuarios: []
            })
        );
    });

    test('Debería devolver únicamente usuarios con rol cliente y estado activo', async () => {
        const req = { query: {} };

        mockConsulta([]);
        mockCountDocuments.mockResolvedValue(0);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(mockFind).toHaveBeenCalledWith({
            rol: 'CLIENTE',
            estado: true
        });
    });

    test('Debería responder con información de paginación', async () => {
        const req = {
            query: {
                page: '2',
                limit: '5'
            }
        };

        mockConsulta([]);
        mockCountDocuments.mockResolvedValue(12);

        const res = mockResponse();

        await listarClientesActivos(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                pagina: 2,
                limite: 5,
                totalPaginas: 3
            })
        );
    });

    test('Debería manejar errores al consultar clientes activos', async () => {
        const req = { query: {} };

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