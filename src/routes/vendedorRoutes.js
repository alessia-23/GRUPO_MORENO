import { Router } from 'express';
import { registrarClientePorVendedor } from '../controllers/vendedorController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Vendedor registra cliente
router.post('/registrar-cliente', protegerRuta, soloVendedor, registrarClientePorVendedor);

export default router;