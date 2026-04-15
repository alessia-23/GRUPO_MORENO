import { Router } from 'express';
import { login, obtenerPerfil } from '../controllers/authController.js';
import protegerRuta from '../middleware/authMiddleware.js';



const router = Router();

// Ruta login
router.post('/login', login);
// Ruta recuperación de contraseña
//router.post('/recuperar-password', recuperarPassword);
//Ruta para obtener el perfil del usuario logueado
router.get('/perfil',protegerRuta ,obtenerPerfil);


export default router;  