import{Router} from 'express';
import {obtenerCarrito } from '../controllers/carritoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';

const router = Router();

// Obtener carrito del cliente
router.get('/obtener', protegerRuta, soloCliente, obtenerCarrito);

export default router;