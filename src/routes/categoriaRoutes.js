import { Router } from 'express';
import { crearCategoria } from '../controllers/categoriaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Crear categoría (solo admin)
router.post('/crear', protegerRuta, soloAdmin, crearCategoria);

export default router;