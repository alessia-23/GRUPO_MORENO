import { Router } from 'express';
import { registrarCliente } from '../controllers/clienteController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

//Cliente se registra solo (PÚBLICO)
router.post('/registro', registrarCliente);

//Vendedor registra cliente (PROTEGIDO)
router.post('/registro-vendedor', protegerRuta, soloVendedor, registrarCliente);

export default router;