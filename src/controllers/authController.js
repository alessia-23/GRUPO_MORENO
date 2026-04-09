import Usuario from '../models/Usuario.js';
import Vendedor from '../models/Vendedor.js';
import { comparePassword, hashPassword } from '../helpers/bcrypt.js';
import crearTokenJWT from '../helpers/jwt.js';

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




export {login};