import { Router } from 'express';
import { crearCategoria, listarCategorias, listarCategoriasActivas, listarCategoriasInactivas } from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Crear categoría (solo admin)
router.post('/crear', protegerRuta, soloAdmin, crearCategoria);

// Listar todas categorías
router.get('/listar-todas', protegerRuta, soloAdmin, listarCategorias);

// Listar categorías activas para todos en general
router.get('/', listarCategoriasActivas);

// Listar categorías inactivas 
router.get('/inactivas', protegerRuta, soloAdmin, listarCategoriasInactivas);

export default router;