import { Router } from 'express';
import { crearVentaDirecta } from '../controllers/ventaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear una venta directa en el local
router.post('/directa', protegerRuta, soloVendedor, crearVentaDirecta);

export default router;