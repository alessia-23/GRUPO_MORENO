import Usuario from '../models/Usuario.js';
import Cliente from '../models/Cliente.js';
import { hashPassword } from '../helpers/bcrypt.js';

const registrarCliente = async (req, res) => {
    try {
        const {nombre,apellido,cedula,telefono,direccion,ciudad,email,password,fecha_nacimiento} = req.body;
        // Validar campos obligatorios y evitar espacios vacíos
        if (!nombre?.trim() ||!apellido?.trim() ||!cedula?.trim() ||!telefono?.trim() ||!direccion?.trim() ||!ciudad?.trim() ||!email?.trim() ||!password ||!fecha_nacimiento) {
            return res.status(400).json({
                msg: 'Debe llenar todos los campos obligatorios'
            });
        }
        // Validar contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales'
            });
        }
        // Verificar si el correo ya existe en Usuario
        const emailExistente = await Usuario.findOne({
            email: email.toLowerCase().trim()
        });
        if (emailExistente) {
            return res.status(400).json({
                msg: 'El correo ya se encuentra registrado'
            });
        }
        // Verificar cédula en Cliente
        const cedulaExistente = await Cliente.findOne({
            cedula: cedula.trim()
        });
        if (cedulaExistente) {
            return res.status(400).json({
                msg: 'La cédula ya se encuentra registrada'
            });
        }
        // Verificar teléfono en Cliente
        const telefonoExistente = await Cliente.findOne({
            telefono: telefono.trim()
        });
        if (telefonoExistente) {
            return res.status(400).json({
                msg: 'El teléfono ya se encuentra registrado'
            });
        }
        // Encriptar contraseña
        const passwordEncriptada = await hashPassword(password);
        // Crear perfil del cliente
        const nuevoCliente = await Cliente.create({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            cedula: cedula.trim(),
            fecha_nacimiento,
            telefono: telefono.trim(),
            direccion: direccion.trim(),
            ciudad: ciudad.trim()
        });
        // Crear usuario asociado
        const nuevoUsuario = await Usuario.create({
            email: email.toLowerCase().trim(),
            password: passwordEncriptada,
            rol: 'CLIENTE',
            estado: true,
            token: null,
            perfilId: nuevoCliente._id,
            perfilModelo: 'Cliente'
        });
        return res.status(201).json({
            msg: 'Cliente registrado correctamente',
            cliente: {
                id: nuevoCliente._id,
                nombre: nuevoCliente.nombre,
                apellido: nuevoCliente.apellido,
                cedula: nuevoCliente.cedula,
                telefono: nuevoCliente.telefono,
                direccion: nuevoCliente.direccion,
                ciudad: nuevoCliente.ciudad
            },
            usuario: {
                id: nuevoUsuario._id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al registrar cliente',
            error: error.message
        });
    }
};

export { registrarCliente };