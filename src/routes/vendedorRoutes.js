/*import { Router } from 'express';
import { registrarClientePorVendedor } from '../controllers/vendedorController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import { listarClientesActivos } from '../controllers/adminController.js';

const router = Router();

// Vendedor registra cliente
router.post('/registrar-cliente', protegerRuta, soloVendedor, registrarClientePorVendedor);

// Vendedor lista clientes
router.get('/listar-clientes', protegerRuta, soloVendedor, listarClientesActivos);

export default router;*/