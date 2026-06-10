import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';

import { crearQuejaSugerencia } from '../controllers/quejaSugerenciaController.js';

const router = Router();

// Crear queja o sugerencia
router.post('/crear', protegerRuta, crearQuejaSugerencia);

export default router;