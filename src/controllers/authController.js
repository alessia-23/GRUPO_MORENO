import Usuario from '../models/Usuario.js';
import { comparePassword, hashPassword } from '../helpers/bcrypt.js';
import crearTokenJWT from '../helpers/jwt.js';
import axios from 'axios';
import generarToken from '../helpers/generarToken.js';
import Administrador from '../models/Administrador.js';
import Cliente from '../models/Cliente.js';
import Vendedor from '../models/Vendedor.js';
import { v2 as cloudinary } from 'cloudinary';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';

// Login del sistema
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validar que vengan datos
        if (!email || !password) {
            return res.status(400).json({ msg: 'Llenar todos los campos' });
        }
        // Buscar usuario por email y traer nombre/apellido del perfil
        const usuario = await Usuario.findOne({
            email: email.toLowerCase().trim()
        }).populate('perfilId', 'nombre apellido');
        if (!usuario) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        // Verificar si está activo
        if (!usuario.estado) {
            return res.status(403).json({ msg: 'Usuario inactivo' });
        }
        // Comparar contraseña
        const passwordValida = await comparePassword(password, usuario.password);
        if (!passwordValida) {
            return res.status(401).json({ msg: 'Contraseña incorrecta, acceso denegado' });
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
                nombre: usuario.perfilId?.nombre,
                apellido: usuario.perfilId?.apellido,
                perfilId: usuario.perfilId?._id,
                perfilModelo: usuario.perfilModelo,
                imagen: usuario.imagen
            }
        });
    } catch (error) {
        return res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
};

// Solicitar recuperación de contraseña
const recuperarPassword = async (req, res) => {
    try {
        const { email } = req.body;
        // Validar que llegue el correo
        if (!email?.trim()) {
            return res.status(400).json({
                msg: 'Debe ingresar el correo'
            });
        }
        // Buscar usuario por correo y traer datos básicos del perfil
        const usuario = await Usuario.findOne({
            email: email.toLowerCase().trim()
        }).populate('perfilId', 'nombre apellido');
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // Validar que el usuario esté activo
        if (!usuario.estado) {
            return res.status(403).json({
                msg: 'Usuario inactivo'
            });
        }
        // Generar token temporal para recuperación
        const token = generarToken();
        // Guardar el token en el usuario
        usuario.token = token;
        await usuario.save();
        // Crear enlace que abrirá el frontend para cambiar contraseña
        const resetLink = `${process.env.FRONTEND_URL}/recuperar-password/${token}`;
        // Enviar datos al workflow de n8n
        await axios.post(process.env.N8N_WEBHOOK_RECUPERAR_PASSWORD, {
            email: usuario.email,
            nombre: usuario.perfilId?.nombre || usuario.email,
            apellido: usuario.perfilId?.apellido || '',
            rol: usuario.rol,
            resetLink
        });
        return res.status(200).json({
            msg: 'Enlace de recuperación enviado correctamente'
        });
    } catch (error) {
        console.log('ERROR RECUPERAR PASSWORD:', error);
        return res.status(500).json({
            msg: 'Error al recuperar contraseña',
            error: error.message
        });
    }
};

// Endpoint para cambiar la contraseña usando el token de recuperación
const cambiarPasswordToken = async (req, res) => {
    try {
        const token = req.params.token?.trim();
        // Validar token recibido
        if (!token) {
            return res.status(400).json({
                msg: 'Token no enviado'
            });
        }
        const { password, confirmarPassword } = req.body;
        if (!password?.trim() || !confirmarPassword?.trim()) {
            return res.status(400).json({
                msg: 'Debe ingresar y confirmar la nueva contraseña'
            });
        }
        if (password !== confirmarPassword) {
            return res.status(400).json({
                msg: 'Las contraseñas no coinciden'
            });
        }
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/;
        if (!regex.test(password)) {
            return res.status(400).json({
                msg: 'La contraseña debe tener entre 8 y 16 caracteres, incluir mayúscula, minúscula, número y carácter especial'
            });
        }
        const usuario = await Usuario.findOne({
            token: token
        });
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
        const usuario = await Usuario.findById(usuarioId).select('-password -token');
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

// Endpoint para actualizar la contraseña del usuario logueado
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

// Actualizar foto de perfil
const actualizarFotoPerfil = async (req, res) => {
    let imagenUsuario = { url: null, public_id: null };
    try {
        const usuarioId = req.usuario.id;
        // Validar archivo
        if (!req.files?.imagen) {
            return res.status(400).json({
                msg: 'Debe seleccionar una imagen'
            });
        }
        const archivo = req.files.imagen;
        // Validar formato
        const formatosPermitidos = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/webp'
        ];
        if (!formatosPermitidos.includes(archivo.mimetype)) {
            return res.status(400).json({
                msg: 'Solo se permiten imágenes PNG, JPG, JPEG y WEBP'
            });
        }
        // Validar tamaño máximo (5MB)
        const pesoMaximo = 5 * 1024 * 1024;
        if (archivo.size > pesoMaximo) {
            return res.status(400).json({
                msg: 'La imagen supera el tamaño máximo permitido de 5MB'
            });
        }
        // Buscar usuario
        const usuario = await Usuario.findById(usuarioId);
        if (!usuario) {
            return res.status(404).json({
                msg: 'Usuario no encontrado'
            });
        }
        // Eliminar imagen anterior si existe
        if (usuario.imagen?.public_id) {
            await cloudinary.uploader.destroy(
                usuario.imagen.public_id
            );
        }
        // Subir nueva imagen
        const { secure_url, public_id } =
            await subirImagenCloudinary(
                archivo.tempFilePath,
                'usuarios'
            );
        imagenUsuario = {
            url: secure_url, public_id
        };
        // Actualizar usuario
        usuario.imagen = imagenUsuario;
        await usuario.save();
        return res.status(200).json({
            msg: 'Foto de perfil actualizada correctamente',
            imagen: usuario.imagen
        });
    } catch (error) {
        // Si la imagen ya se subió pero algo falló después, se elimina para no dejar basura en Cloudinary
        if (imagenUsuario.public_id) {
            await cloudinary.uploader.destroy(imagenUsuario.public_id);
        }
        console.log('ERROR ACTUALIZAR FOTO PERFIL:', error);
        return res.status(500).json({
            msg: 'Error al actualizar la foto de perfil', error: error.message
        });
    }
};


export { login, obtenerPerfil, actualizarPerfil, actualizarPassword, recuperarPassword, cambiarPasswordToken, actualizarFotoPerfil };