import { Router } from 'express';
import {
    crearCategoria, listarCategorias, listarCategoriasActivas, listarCategoriasInactivas,
    desactivarCategoria, activarCategoria, actualizarCategoria
} from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import crearUpload from '../middleware/multer.js';

const router = Router();

// Upload para categorías
const uploadCategorias = crearUpload('categorias');

// Crear categoría
router.post('/crear', protegerRuta, soloAdmin, uploadCategorias.single('imagen'), crearCategoria);

// Listar todas categorías
router.get('/listar-todas', protegerRuta, soloAdmin, listarCategorias);

// Desactivar categoría
router.put('/desactivar/:id', protegerRuta, soloAdmin, desactivarCategoria);

// Activar categoría
router.put('/activar/:id', protegerRuta, soloAdmin, activarCategoria);

// Listar categorías activas para todos
router.get('/', listarCategoriasActivas);

// Listar categorías inactivas
router.get('/inactivas', protegerRuta, soloAdmin, listarCategoriasInactivas);

// Actualizar categoría
router.put('/actualizar/:id', protegerRuta, soloAdmin, uploadCategorias.single('imagen'), actualizarCategoria);

export default router;