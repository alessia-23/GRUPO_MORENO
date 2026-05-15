import { Router } from 'express';
import { crearProducto, obtenerCatalogo, obtenerGestionVende, actualizarProducto } from '../controllers/productoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';


const router = Router();

// Crear producto
router.post('/crear', protegerRuta, soloVendedor, crearProducto);

// Catálogo público
router.get('/catalogo', obtenerCatalogo);

// Gestión de productos
router.get('/gestion', protegerRuta, soloVendedor, obtenerGestionVende);

// Actualizar producto 
router.put('/actualizar/:id', protegerRuta, soloVendedor, actualizarProducto);

export default router;