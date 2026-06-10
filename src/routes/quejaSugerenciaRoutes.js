import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { crearQuejaSugerencia, obtenerMisQuejasSugerencias } from '../controllers/quejaSugerenciaController.js';

const router = Router();

// Crear queja o sugerencia
router.post('/crear', protegerRuta, crearQuejaSugerencia);

// Obtener las quejas o sugerencias
router.get('/mis', protegerRuta, obtenerMisQuejasSugerencias);

export default router;