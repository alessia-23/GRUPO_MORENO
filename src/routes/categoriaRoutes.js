import { Router } from 'express';
import { crearCategoria, listarCategorias, listarCategoriasActivas, listarCategoriasInactivas, desactivarCategoria} from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Crear categoría (solo admin)
router.post('/crear', protegerRuta, soloAdmin, crearCategoria);

// Listar todas categorías
router.get('/listar-todas', protegerRuta, soloAdmin, listarCategorias);

// Desactivar categoría
router.put('/desactivar/:id', protegerRuta, soloAdmin, desactivarCategoria);

// Listar categorías activas para todos en general
router.get('/', listarCategoriasActivas);

// Listar categorías inactivas 
router.get('/inactivas', protegerRuta, soloAdmin, listarCategoriasInactivas);

export default router;