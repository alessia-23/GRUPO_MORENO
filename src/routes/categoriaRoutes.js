import { Router } from 'express';
import { crearCategoria, listarCategorias } from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear categoría (solo admin)
router.post('/crear', protegerRuta, soloAdmin, crearCategoria);

// Listar todas categorías
router.get('/listar-todas', protegerRuta, soloAdmin, listarCategorias);

export default router;