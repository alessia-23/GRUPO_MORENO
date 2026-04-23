import Usuario from '../models/Usuario.js';
import { comparePassword, hashPassword } from '../helpers/bcrypt.js';
import crearTokenJWT from '../helpers/jwt.js';
import axios from 'axios';
import generarToken from '../helpers/generarToken.js';
import Administrador from '../models/Administrador.js';
import Cliente from '../models/Cliente.js';
import Vendedor from '../models/Vendedor.js';

// Login del sistema
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validar que vengan datos
        if (!email || !password) {
            return res.status(400).json({
                msg: 'Llenar todos los campos'
            });
        }
        // Buscar usuario por email
        const usuario = await Usuario.findOne({
            email: email.toLowerCase().trim()
        });
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // Verificar si está activo
        if (!usuario.estado) {
            return res.status(403).json({
                msg: 'Usuario inactivo'
            });
        }
        // Comparar contraseña
        const passwordValida = await comparePassword(
            password,
            usuario.password
        );
        if (!passwordValida) {
            return res.status(401).json({
                msg: 'Contraseña incorrecta'
            });
        }
        // Generar token
        const token = crearTokenJWT(usuario);
        // Respuesta
        return res.status(200).json({
            msg: 'Login exitoso',
            token,
            usuario: {
                id: usuario._id,
                email: usuario.email,
                rol: usuario.rol,
                perfilId: usuario.perfilId,
                perfilModelo: usuario.perfilModelo
            }
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error en el servidor',
            error: error.message
        });
    }
};

// Solicitar recuperación de contraseña
const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Validar que llegue el correo
        if (!email) {
            return res.status(400).json({
                msg: 'Debe ingresar el correo'
            });
        }
        // Buscar usuario en la colección Usuario
        const usuario = await Usuario.findOne({
            email: email.toLowerCase().trim()
        });
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // Verificar si el usuario está activo
        if (!usuario.estado) {
            return res.status(403).json({
                msg: 'Usuario inactivo'
            });
        }
        // Generar token y guardarlo en la base
        const token = generarToken();
        usuario.token = token;
        await usuario.save();
        // Enlace temporal de recuperación
        const resetLink = `${process.env.FRONTEND_URL}/recuperar-password/${token}`;
        // Enviar datos a n8n
        await axios.post(process.env.N8N_WEBHOOK_URL, {
            email: usuario.email,
            nombre: usuario.email,
            resetLink
        });
        return res.status(200).json({
            msg: 'Enlace de recuperación enviado correctamente'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error al recuperar contraseña',
            error: error.message
        });
    }
};

const cambiarPasswordToken = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password?.trim()) {
            return res.status(400).json({
                msg: 'La nueva contraseña es obligatoria'
            });
        }
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
        if (!regex.test(password)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluir mayúscula, minúscula, número y carácter especial'
            });
        }
        const usuario = await Usuario.findOne({ token });
        if (!usuario) {
            return res.status(404).json({
                msg: 'Token no válido o expirado'
            });
        }
        usuario.password = await hashPassword(password);
        usuario.token = null;
        await usuario.save();
        return res.status(200).json({
            msg: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al cambiar la contraseña',
            error: error.message
        });
    }
};


// Endpoint para poder obtener el perfil del usuario que esté logueado 
const obtenerPerfil = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const usuario = await Usuario.findById(usuarioId).select('-password');
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        let perfil = null;
        if (usuario.rol === 'ADMINISTRADOR') {
            perfil = await Administrador.findById(usuario.perfilId);
        } else if (usuario.rol === 'VENDEDOR') {
            perfil = await Vendedor.findById(usuario.perfilId);
        } else if (usuario.rol === 'CLIENTE') {
            perfil = await Cliente.findById(usuario.perfilId);
        }
        return res.status(200).json({
            msg: 'Perfil obtenido correctamente',
            usuario, perfil
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error al obtener el perfil',
            error: error.message
        });
    }
};



// Endpoint para actualizar el perfil del usuario que esté logueado
const actualizarPerfil = async (req, res) => {
    try {
        // saco el id del usuario desde el token
        const usuarioId = req.usuario.id;
        // busco al usuario en la bd
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        let perfil = null;
        // dependiendo del rol busco en su colección
        if (usuario.rol === 'ADMINISTRADOR') {
            perfil = await Administrador.findById(usuario.perfilId);
            if (!perfil) {
                return res.status(404).json({
                    msg: 'Perfil de administrador no encontrado'
                });
            }
            // actualizo solo lo que venga en el body
            if (req.body.nombre) perfil.nombre = req.body.nombre;
            if (req.body.apellido) perfil.apellido = req.body.apellido;
            if (req.body.telefono) perfil.telefono = req.body.telefono;
            if (req.body.direccion) perfil.direccion = req.body.direccion;
        }
        else if (usuario.rol === 'VENDEDOR') {
            perfil = await Vendedor.findById(usuario.perfilId);
            if (!perfil) {
                return res.status(404).json({
                    msg: 'Perfil de vendedor no encontrado'
                });
            }
            // mismo caso, actualiza lo que envíen
            if (req.body.nombre) perfil.nombre = req.body.nombre;
            if (req.body.apellido) perfil.apellido = req.body.apellido;
            if (req.body.telefono) perfil.telefono = req.body.telefono;
            if (req.body.direccion) perfil.direccion = req.body.direccion;
        }
        else if (usuario.rol === 'CLIENTE') {
            perfil = await Cliente.findById(usuario.perfilId);
            if (!perfil) {
                return res.status(404).json({
                    msg: 'Perfil de cliente no encontrado'
                });
            }
            // cliente tiene un campo extra: ciudad
            if (req.body.nombre) perfil.nombre = req.body.nombre;
            if (req.body.apellido) perfil.apellido = req.body.apellido;
            if (req.body.telefono) perfil.telefono = req.body.telefono;
            if (req.body.direccion) perfil.direccion = req.body.direccion;
            if (req.body.ciudad) perfil.ciudad = req.body.ciudad;
        }
        // guardo los cambios
        await perfil.save();
        return res.status(200).json({
            msg: 'Perfil actualizado correctamente',
            perfil
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error al actualizar el perfil',
            error: error.message
        });
    }
};


const actualizarPassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva, confirmPassword } = req.body;
        // validar que lleguen todos los campos
        if (!passwordActual || !passwordNueva || !confirmPassword) {
            return res.status(400).json({
                msg: 'Debe llenar todos los campos'
            });
        }
        // buscar usuario logueado
        const usuario = await Usuario.findById(req.usuario.id);
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // comprobar contraseña actual
        const passwordCorrecta = await comparePassword(passwordActual, usuario.password);
        if (!passwordCorrecta) {
            return res.status(401).json({
                msg: 'La contraseña actual es incorrecta'
            });
        }
        // evitar que la nueva sea igual a la actual
        if (passwordActual === passwordNueva) {
            return res.status(400).json({
                msg: 'La nueva contraseña no puede ser igual a la actual'
            });
        }
        // validar formato de contraseña (8 a 16, mayúscula, minúscula, número y símbolo)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
        if (!passwordRegex.test(passwordNueva)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluir mayúscula, minúscula, número y símbolo'
            });
        }
        // validar confirmación
        if (passwordNueva !== confirmPassword) {
            return res.status(400).json({
                msg: 'La nueva contraseña y la confirmación no coinciden'
            });
        }
        // encriptar y guardar la nueva contraseña
        usuario.password = await hashPassword(passwordNueva);
        await usuario.save();
        return res.status(200).json({
            msg: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Error al actualizar la contraseña',
            error: error.message
        });
    }
};

export { login, obtenerPerfil, actualizarPerfil, actualizarPassword, recuperarPassword, cambiarPasswordToken };