import { Router } from 'express';
import { login, obtenerPerfil, actualizarPerfil, actualizarPassword} from '../controllers/authController.js';
import protegerRuta from '../middleware/authMiddleware.js';



const router = Router();

// Ruta login
router.post('/login', login);
// Ruta recuperación de contraseña
//router.post('/recuperar-password', recuperarPassword);
//Ruta para obtener el perfil del usuario logueado
router.get('/perfil',protegerRuta ,obtenerPerfil);
//Ruta para actualizar el perfil del usuario logueado
router.put('/perfil',protegerRuta ,actualizarPerfil);
//Ruta para actualizar la contraseña del usuario logueado
router.put('/actualizar-password',protegerRuta ,actualizarPassword);


export default router;  