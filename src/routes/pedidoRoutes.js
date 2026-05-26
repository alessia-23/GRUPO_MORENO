import { Router } from 'express';
import { crearPedido } from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = Router();

// Ruta privada: requiere inicio de sesión para registrar la orden
router.post('/crear', protegerRuta, crearPedido);

export default router;