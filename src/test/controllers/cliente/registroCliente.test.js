import { jest } from '@jest/globals';

const mockUsuarioFindOne = jest.fn();
const mockUsuarioCreate = jest.fn();
const mockClienteFindOne = jest.fn();
const mockClienteCreate = jest.fn();
const mockHashPassword = jest.fn();

jest.unstable_mockModule('../../../models/Usuario.js', () => ({
    default: {
        findOne: mockUsuarioFindOne,
        create: mockUsuarioCreate
    }
}));

jest.unstable_mockModule('../../../models/Cliente.js', () => ({
    default: {
        findOne: mockClienteFindOne,
        create: mockClienteCreate
    }
}));

jest.unstable_mockModule('../../../helpers/bcrypt.js', () => ({
    hashPassword: mockHashPassword
}));

const { registrarCliente } = await import('../../../controllers/clienteController.js');

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const clienteValido = {
    nombre: 'Richard',
    apellido: 'Pérez',
    cedula: '0912723061',
    telefono: '0980868422',
    direccion: 'La Ecuatoriana',
    ciudad: 'Quito',
    email: 'richard@test.com',
    password: 'Cliente1*',
    fecha_nacimiento: '2000-01-01'
};

describe('Módulo cliente - Registro de cliente', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Debería registrar un cliente correctamente', async () => {
        const req = {
            body: clienteValido
        };

        mockUsuarioFindOne.mockResolvedValue(null);
        mockClienteFindOne.mockResolvedValue(null);
        mockHashPassword.mockResolvedValue('password-encriptada');

        mockClienteCreate.mockResolvedValue({
            _id: 'cliente123',
            nombre: 'Richard',
            apellido: 'Pérez',
            cedula: '0912723061',
            telefono: '0980868422',
            direccion: 'La Ecuatoriana',
            ciudad: 'Quito'
        });

        mockUsuarioCreate.mockResolvedValue({
            _id: 'usuario123',
            email: 'richard@test.com',
            rol: 'CLIENTE'
        });

        const res = mockResponse();

        await registrarCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                msg: 'Cliente registrado correctamente'
            })
        );
    });

    test('Debería validar que todos los campos obligatorios estén completos', async () => {
        const req = {
            body: {
                ...clienteValido,
                nombre: '',
                email: ''
            }
        };

        const res = mockResponse();

        await registrarCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'Debe llenar todos los campos obligatorios'
        });
    });

    test('Debería validar el formato de la contraseña', async () => {
        const req = {
            body: {
                ...clienteValido,
                password: '123'
            }
        };

        const res = mockResponse();

        await registrarCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales'
        });
    });

    test('Debería rechazar un correo ya registrado', async () => {
        const req = {
            body: clienteValido
        };

        mockUsuarioFindOne.mockResolvedValue({
            _id: 'usuario-existente'
        });

        const res = mockResponse();

        await registrarCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'El correo ya se encuentra registrado'
        });
    });

    test('Debería rechazar una cédula ya registrada', async () => {
        const req = {
            body: clienteValido
        };

        mockUsuarioFindOne.mockResolvedValue(null);
        mockClienteFindOne.mockResolvedValue({
            _id: 'cliente-existente'
        });

        const res = mockResponse();

        await registrarCliente(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            msg: 'La cédula ya se encuentra registrada'
        });
    });
});