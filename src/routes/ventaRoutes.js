import { Router } from 'express';
import { crearVentaDirecta, obtenerMisVentas } from '../controllers/ventaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear una venta directa en el local
router.post('/directa', protegerRuta, soloVendedor, crearVentaDirecta);

// El vendedor puede listar las ventas que ha hecho 
router.get('/mis-ventas', protegerRuta, soloVendedor, obtenerMisVentas);

export default router;