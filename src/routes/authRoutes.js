import { Router } from 'express';
import { login, obtenerPerfil, actualizarPerfil, actualizarPassword, recuperarPassword, cambiarPasswordToken, actualizarFotoPerfil } from '../controllers/authController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = Router();

// Ruta login
router.post('/login', login);

// Ruta recuperación de contraseña
router.post('/recuperar-password', recuperarPassword);

// Ruta para cambiar la contraseña usando el token
router.post('/cambiar-password-token/:token', cambiarPasswordToken);

// Ruta para obtener el perfil del usuario logueado
router.get('/perfil', protegerRuta, obtenerPerfil);

// Ruta para actualizar el perfil del usuario logueado
router.put('/perfil', protegerRuta, actualizarPerfil);

// Ruta para actualizar la contraseña del usuario logueado
router.put('/actualizar-password', protegerRuta, actualizarPassword);

// Ruta para actualizar la foto de perfil del usuario logueado
router.put('/actualizar-foto', protegerRuta, actualizarFotoPerfil);

export default router;