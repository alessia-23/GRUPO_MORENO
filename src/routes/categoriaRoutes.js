import { Router } from 'express';
import { crearCategoria, listarCategorias, listarCategoriasActivas, listarCategoriasInactivas, desactivarCategoria, activarCategoria} from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import upload from '../middleware/multer.js'

const router = Router();

// Crear categoría (solo admin)
router.post('/crear', protegerRuta, soloAdmin, upload.single('imagen'), crearCategoria);

// Listar todas categorías
router.get('/listar-todas', protegerRuta, soloAdmin, soloVendedor, listarCategorias);

// Desactivar categoría
router.put('/desactivar/:id', protegerRuta, soloAdmin, desactivarCategoria);

// Activar categoría
router.put('/activar/:id', protegerRuta, soloAdmin, activarCategoria);

// Listar categorías activas para todos en general
router.get('/', listarCategoriasActivas);

// Listar categorías inactivas 
router.get('/inactivas', protegerRuta, soloAdmin, listarCategoriasInactivas);

export default router;