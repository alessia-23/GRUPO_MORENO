import { Router } from 'express';
import { crearProducto, obtenerGestionVende, actualizarProducto, desactivarProducto, activarProducto, todosProductos } from '../controllers/productoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';


const router = Router();

// Crear producto
router.post('/crear', protegerRuta, soloVendedor, crearProducto);

// Catálogo público
//router.get('/catalogo', obtenerCatalogo);

// Gestión de productos
router.get('/gestion', protegerRuta, soloVendedor, obtenerGestionVende);

// Actualizar producto 
router.put('/actualizar/:id', protegerRuta, soloVendedor, actualizarProducto);

// Desactivar producto
router.put('/desactivar/:id', protegerRuta, soloVendedor, desactivarProducto);

// Activar producto
router.put('/activar/:id', protegerRuta, soloVendedor, activarProducto);

// Explorar todos los productos y búsqueda con sus respectivos filtros
router.get('/explorar', todosProductos);

export default router;