import Usuario from '../models/Usuario.js';
import { comparePassword } from '../helpers/bcrypt.js';
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

/*
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
        return res.status(500).json({
            msg: 'Error al recuperar contraseña',
            error: error.message
        });
    }
};

*/
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

export {login, obtenerPerfil};