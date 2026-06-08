import { Router } from 'express';
import { crearVentaDirecta, obtenerMisVentas, obtenerDetalleVenta } from '../controllers/ventaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear una venta directa en el local
router.post('/directa', protegerRuta, soloVendedor, crearVentaDirecta);

// El vendedor puede listar las ventas que ha hecho 
router.get('/mis-ventas', protegerRuta, soloVendedor, obtenerMisVentas);

// Obtener el detalle de una venta realizada por el vendedor
router.get('/detalle/:id', protegerRuta, soloVendedor, obtenerDetalleVenta);

export default router;