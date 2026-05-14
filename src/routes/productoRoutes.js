import { Router } from 'express';
import { crearProducto, obtenerCatalogo, obtenerGestionAdmin} from '../controllers/productoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';


const router = Router();

// Crear producto
router.post('/crear', protegerRuta, soloAdmin, crearProducto);

// Catálogo público
router.get('/catalogo', obtenerCatalogo);

// Gestión de productos
router.get('/gestion', protegerRuta, soloAdmin, obtenerGestionAdmin);

export default router;