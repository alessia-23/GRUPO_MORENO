import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { crearQuejaSugerencia, obtenerMisQuejasSugerencias, obtenerQuejasSugerenciasAdmin } from '../controllers/quejaSugerenciaController.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Crear queja o sugerencia
router.post('/crear', protegerRuta, crearQuejaSugerencia);

// Obtener las quejas o sugerencias
router.get('/mis', protegerRuta, obtenerMisQuejasSugerencias);

// Obtener todas las quejas y sugerencias 
router.get('/admin', protegerRuta, soloAdmin, obtenerQuejasSugerenciasAdmin);

export default router;