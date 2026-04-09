import { Router } from 'express';
import { login } from '../controllers/authController.js';



const router = Router();

// Ruta login
router.post('/login', login);
// Ruta para el registro de vendedor

export default router;