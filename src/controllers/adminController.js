import Usuario from '../models/Usuario.js';
import Vendedor from '../models/Vendedor.js';
import Cliente from '../models/Cliente.js';
import { hashPassword } from '../helpers/bcrypt.js';
import axios from 'axios';
import Pedido from '../models/Pedido.js';
import mongoose from 'mongoose';

// Registro de vendedor creado por el administrador
const registrarVendedor = async (req, res) => {
    try {
        const { nombre, apellido, cedula, telefono, direccion, email, password, fecha_nacimiento } = req.body || {};
        // Validar campos obligatorios y evitar espacios vacíos
        if (!nombre?.trim() || !apellido?.trim() || !cedula?.trim() || !telefono?.trim() || !direccion?.trim() || !email?.trim() || !password || !fecha_nacimiento) {
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
        // ENVIAR CREDENCIALES AL NUEVO WORKFLOW DE n8n

        try {
            await axios.post(process.env.N8N_WEBHOOK_CREAR_VENDEDOR, {
                email: nuevoUsuario.email,
                nombre: nuevoVendedor.nombre,
                apellido: nuevoVendedor.apellido,
                password: password // La contraseña limpia (sin encriptar) para el correo
            });
        } catch (errorAxios) {
            console.log('Error al enviar datos a n8n:', errorAxios.message);
            // No bloqueamos la respuesta al cliente aunque el flujo de n8n falle
        }

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

// Desactivar vendedor
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
        // Validar si el vendedor tiene pedidos en proceso
        const pedidoEnProceso = await Pedido.findOne({
            vendedor: id,
            estado: 'EN_PROCESO'
        });
        if (pedidoEnProceso) {
            return res.status(400).json({
                msg: 'No se puede desactivar el vendedor porque tiene pedidos en proceso'
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

/* Listar vendedores
const listarVendedores = async (req, res) => {
    try {
        const usuarios = await Usuario.find({
            rol: 'VENDEDOR'
        })
        .select('-password -token -createdAt -updatedAt')
        .populate('perfilId', '-createdAt -updatedAt');
        const total = await Usuario.countDocuments({
            rol: 'VENDEDOR'
        });
        return res.status(200).json({
            total,usuarios
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar vendedores',
            error: error.message
        });
    }
};
*/

/* Listar clientes
const listarClientes = async (req, res) => {
    try {
        const usuarios = await Usuario.find({
            rol: 'CLIENTE'
        })
        .select('-password -token -createdAt -updatedAt')
        .populate('perfilId', '-createdAt -updatedAt');
        const total = await Usuario.countDocuments({
            rol: 'CLIENTE'
        });
        return res.status(200).json({
            total,usuarios
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar clientes',
            error: error.message
        });
    }
};
*/

// Desactivar cliente y su usuario asociado
const desactivarCliente = async (req, res) => {
    try {
        const { id } = req.params; // id del usuario a desactivar
        // Validar formato del id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El identificador del cliente no es válido'
            });
        }
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
        // Validar si el cliente tiene pedidos pendientes o en proceso
        const pedidoActivo = await Pedido.findOne({
            cliente: id,
            estado: { $in: ['PENDIENTE', 'EN_PROCESO'] }
        });
        if (pedidoActivo) {
            return res.status(400).json({
                msg: 'No se puede desactivar el cliente porque tiene pedidos pendientes o en proceso'
            });
        }
        usuario.estado = false;
        await usuario.save();
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
        const cliente = await Cliente.findOne({
            cedula: cedula.trim()
        });
        if (!cliente) {
            return res.status(404).json({
                msg: 'Cliente no encontrado'
            });
        }
        const usuario = await Usuario.findOne({
            rol: 'CLIENTE', perfilId: cliente._id
        })
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt');
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario asociado al cliente no encontrado'
            });
        }
        return res.status(200).json({
            _id: usuario._id,
            email: usuario.email,
            rol: usuario.rol,
            estado: usuario.estado,
            perfilId: usuario.perfilId
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al buscar cliente', error: error.message
        });
    }
};

// Buscar vendedor por cédula
const buscarVendedor = async (req, res) => {
    try {
        const { cedula } = req.params;
        // Buscar el perfil del vendedor por cédula
        const vendedor = await Vendedor.findOne({
            cedula: cedula.trim()
        });
        if (!vendedor) {
            return res.status(404).json({
                msg: 'Vendedor no encontrado'
            });
        }
        // Buscar el usuario asociado a ese vendedor
        const usuario = await Usuario.findOne({
            rol: 'VENDEDOR', perfilId: vendedor._id
        })
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt');
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario asociado al vendedor no encontrado'
            });
        }
        return res.status(200).json({
            _id: usuario._id,
            email: usuario.email,
            rol: usuario.rol,
            estado: usuario.estado,
            perfilId: usuario.perfilId
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al buscar vendedor', error: error.message
        });
    }
};

// Listar clientes activos
const listarClientesActivos = async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;
        const limite = Number(req.query.limit) || 15;
        const skip = (pagina - 1) * limite;

        const filtro = {
            rol: 'CLIENTE',
            estado: true
        };

        const usuarios = await Usuario.find(filtro)
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt')
            .skip(skip)
            .limit(limite);

        const total = await Usuario.countDocuments(filtro);

        return res.status(200).json({
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            usuarios
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
        const pagina = Number(req.query.page) || 1;
        const limite = Number(req.query.limit) || 15;
        const skip = (pagina - 1) * limite;

        const filtro = {
            rol: 'CLIENTE',
            estado: false
        };

        const usuarios = await Usuario.find(filtro)
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt')
            .skip(skip)
            .limit(limite);

        const total = await Usuario.countDocuments(filtro);

        return res.status(200).json({
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            usuarios
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar clientes inactivos',
            error: error.message
        });
    }
};

// Listar vendedores activos con paginación
const listarVendedoresActivos = async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;
        const limite = Number(req.query.limit) || 15;
        const skip = (pagina - 1) * limite;

        const filtro = {
            rol: 'VENDEDOR',
            estado: true
        };

        const usuarios = await Usuario.find(filtro)
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt')
            .skip(skip)
            .limit(limite);

        const total = await Usuario.countDocuments(filtro);

        return res.status(200).json({
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            usuarios
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar vendedores activos',
            error: error.message
        });
    }
};

// Listar vendedores inactivos con paginación
const listarVendedoresInactivos = async (req, res) => {
    try {
        const pagina = Number(req.query.page) || 1;
        const limite = Number(req.query.limit) || 15;
        const skip = (pagina - 1) * limite;

        const filtro = {
            rol: 'VENDEDOR',
            estado: false
        };

        const usuarios = await Usuario.find(filtro)
            .select('-password -token -createdAt -updatedAt')
            .populate('perfilId', '-createdAt -updatedAt')
            .skip(skip)
            .limit(limite);

        const total = await Usuario.countDocuments(filtro);

        return res.status(200).json({
            total,
            pagina,
            limite,
            totalPaginas: Math.ceil(total / limite),
            usuarios
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar vendedores inactivos',
            error: error.message
        });
    }
};

export {
    registrarVendedor, desactivarVendedor, activarVendedor, desactivarCliente, activarCliente
    , buscarCliente, buscarVendedor, listarClientesActivos, listarClientesInactivos, listarVendedoresActivos, listarVendedoresInactivos
};