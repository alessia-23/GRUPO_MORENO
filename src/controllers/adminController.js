import Usuario from '../models/Usuario.js';
import Vendedor from '../models/Vendedor.js';
import Cliente from '../models/Cliente.js';
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
        const vendedores = await Usuario.find({ rol: 'VENDEDOR' })
            .select('-password -token')
            .populate('perfilId');
        const total = await Usuario.countDocuments({ rol: 'VENDEDOR' });
        return res.status(200).json({
            total,
            vendedores
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al obtener vendedores',
            error: error.message
        });
    }
};

// Listar clientes
const listarClientes = async (req, res) => {
    try {
        const clientes = await Usuario.find({ rol: 'CLIENTE' })
            .select('-password -token')
            .populate('perfilId');
        const total = await Usuario.countDocuments({ rol: 'CLIENTE' });
        return res.status(200).json({
            total,
            clientes
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al obtener clientes',
            error: error.message
        });
    }
};

// Desactivar cliente y su usuario asociado
const desactivarCliente = async (req, res) => {
    try {
        const { id } = req.params; // id del usuario a desactivar
        const usuario = await Usuario.findById(id); // buscar usuario
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // verificar que sea cliente, es decir que conste en la BD como cliente
        if (usuario.rol !== 'CLIENTE') {
            return res.status(400).json({
                msg: 'No es un cliente'
            });
        }
        usuario.estado = false; // desactivar
        await usuario.save();  // guardar cambios
        return res.status(200).json({
            msg: 'Cliente desactivado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al desactivar cliente',
            error: error.message
        });
    }
};

// Activar cliente y su usuario asociado
const activarCliente = async (req, res) => {
    try {
        const { id } = req.params; // id del usuario a activar
        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findById(id);
        if (!usuario) { // Validar si el usuario existe
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // Verificar que el usuario sea realmente un cliente
        if (usuario.rol !== 'CLIENTE') {
            return res.status(400).json({
                msg: 'No es un cliente'
            });
        }
        usuario.estado = true;  // Activar el usuario cambiando su estado a true y se guardan los cambioes en la BD
        await usuario.save();
        return res.status(200).json({
            msg: 'Cliente activado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al activar cliente',
            error: error.message
        });
    }
};

// Buscar cliente por cédula
const buscarCliente = async (req, res) => {
    try {
        const { cedula } = req.params;
        const cliente = await Cliente.findOne({ cedula });
        if (!cliente) {
            return res.status(404).json({
                msg: 'Cliente no encontrado'
            });
        }
        return res.status(200).json(cliente);
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al buscar cliente',
            error: error.message
        });
    }
};

// Buscar vendedor por cédula
const buscarVendedor= async (req, res) => {
    try {
        const { cedula } = req.params;
        const vendedor = await Vendedor.findOne({ cedula });
        if (!vendedor) {
            return res.status(404).json({
                msg: 'Vendedor no encontrado'
            });
        }
        return res.status(200).json(vendedor);
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al buscar vendedor',
            error: error.message
        });
    }
};

// Listar clientes activos
const listarClientesActivos = async (req, res) => {
    try {
        const clientes = await Usuario.find({
            rol: 'CLIENTE',
            estado: true
        })
        .select('-password -token')
        .populate('perfilId');
        const total = await Usuario.countDocuments({
            rol: 'CLIENTE',
            estado: true
        });
        return res.status(200).json({
            total,
            clientes
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar clientes activos',
            error: error.message
        });
    }
};

// Listar clientes inactivos
const listarClientesInactivos = async (req, res) => {
    try {
        const clientes = await Usuario.find({
            rol: 'CLIENTE',
            estado: false
        })
        .select('-password -token')
        .populate('perfilId');
        const total = await Usuario.countDocuments({
            rol: 'CLIENTE',
            estado: false
        });
        return res.status(200).json({
            total,
            clientes
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar clientes inactivos',
            error: error.message
        });
    }
};

// Listar vendedores activos
const listarVendedoresActivos = async (req, res) => {
    try {
        const vendedores = await Usuario.find({
            rol: 'VENDEDOR',
            estado: true
        })
        .select('-password -token')
        .populate('perfilId');
        const total = await Usuario.countDocuments({
            rol: 'VENDEDOR',
            estado: true
        });
        return res.status(200).json({
            total,
            vendedores
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar vendedores activos',
            error: error.message
        });
    }
};

// Listar vendedores inactivos
const listarVendedoresInactivos = async (req, res) => {
    try {
        const vendedores = await Usuario.find({
            rol: 'VENDEDOR',
            estado: false
        })
        .select('-password -token')
        .populate('perfilId');
        const total = await Usuario.countDocuments({
            rol: 'VENDEDOR',
            estado: false
        });
        return res.status(200).json({
            total,
            vendedores
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar vendedores inactivos',
            error: error.message
        });
    }
};

export { registrarVendedor, desactivarVendedor, activarVendedor, listarVendedores, listarClientes, desactivarCliente, activarCliente 
    , buscarCliente, buscarVendedor, listarClientesActivos, listarClientesInactivos, listarVendedoresActivos, listarVendedoresInactivos
};