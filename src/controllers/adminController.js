import Usuario from '../models/Usuario.js';
import Vendedor from '../models/Vendedor.js';
import { hashPassword } from '../helpers/bcrypt.js';

// Registro de vendedor creado por el administrador
const registrarVendedor = async (req, res) => {
    try {
        const {nombre,apellido,cedula,telefono,direccion,email,password,fecha_nacimiento} = req.body;
        // Validar campos obligatorios y evitar espacios vacíos
        if (!nombre?.trim() ||!apellido?.trim() ||!cedula?.trim() ||!telefono?.trim() ||!direccion?.trim() ||!email?.trim() ||!password ||!fecha_nacimiento) {
            return res.status(400).json({
                msg: 'Debe llenar todos los campos obligatorios'
            });
        }
        // Validar formato de contraseña debe tener de 8 a 16, mayúscula, minúscula, número y carácter especial
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales'
            });
        }
        // Verificación de correo en usuarios
        const emailExistente = await Usuario.findOne({
            email: email.toLowerCase().trim()
        });
        if (emailExistente) {
            return res.status(400).json({
                msg: 'El correo ya se encuentra registrado'
            });
        }
        // Verificar cédula en vendedores
        const cedulaExistente = await Vendedor.findOne({
            cedula: cedula.trim()
        });
        if (cedulaExistente) {
            return res.status(400).json({
                msg: 'La cédula ya se encuentra registrada'
            });
        }
        // Verificar teléfono en vendedores
        const telefonoExistente = await Vendedor.findOne({
            telefono: telefono.trim()
        });
        if (telefonoExistente) {
            return res.status(400).json({
                msg: 'El teléfono ya se encuentra registrado'
            });
        }
        // Encriptar contraseña antes de guardar
        const passwordEncriptada = await hashPassword(password);
        // Crear perfil del vendedor
        const nuevoVendedor = await Vendedor.create({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            cedula: cedula.trim(),
            fecha_nacimiento,
            telefono: telefono.trim(),
            direccion: direccion ? direccion.trim() : ''
        });
        // Crear usuario asociado
        const nuevoUsuario = await Usuario.create({
            email: email.toLowerCase().trim(),
            password: passwordEncriptada,
            rol: 'VENDEDOR',
            estado: true,
            token: null,
            perfilId: nuevoVendedor._id,
            perfilModelo: 'Vendedor'
        });
        // Respuesta final
        return res.status(201).json({
            msg: 'Vendedor registrado correctamente',
            vendedor: {
                id: nuevoVendedor._id,
                nombre: nuevoVendedor.nombre,
                apellido: nuevoVendedor.apellido,
                cedula: nuevoVendedor.cedula,
                telefono: nuevoVendedor.telefono
            },
            usuario: {
                id: nuevoUsuario._id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            }
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al registrar vendedor',
            error: error.message
        });
    }
};

// Desactivar vendedor y su usuario asociado
const desactivarVendedor = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        if (usuario.rol !== 'VENDEDOR') {
            return res.status(400).json({
                msg: 'No es un vendedor'
            });
        }
        usuario.estado = false;
        await usuario.save();
        return res.status(200).json({
            msg: 'Vendedor desactivado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al desactivar vendedor',
            error: error.message
        });
    }
};

// Activar vendedor y su usuario asociado
const activarVendedor = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findById(id);
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        if (usuario.rol !== 'VENDEDOR') {
            return res.status(400).json({ msg: 'No es un vendedor' });
        }
        usuario.estado = true;
        await usuario.save();
        res.status(200).json({ msg: 'Vendedor activado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al activar vendedor', error: error.message });
    }
};


// Listar vendedores
const listarVendedores = async (req, res) => {
    try {
        const vendedores = await Usuario.find({
            rol: 'VENDEDOR'
        })
            .select('-password -token')
            .populate('perfilId');
        res.status(200).json({
            total: vendedores.length,
            vendedores
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Error al obtener vendedores',
            error: error.message
        });
    }
};

// Listar clientes
const listarClientes = async (req, res) => {
    try {
        const clientes = await Usuario.find({
            rol: 'CLIENTE'
        })
            .select('-password -token')
            .populate('perfilId');
        res.status(200).json({
            total: clientes.length,
            clientes
        });
    } catch (error) {
        res.status(500).json({
            msg: 'Error al obtener clientes',
            error: error.message
        });
    }
};

export { registrarVendedor, desactivarVendedor, activarVendedor, listarVendedores, listarClientes};

