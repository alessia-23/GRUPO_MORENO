import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { crearQuejaSugerencia, obtenerMisQuejasSugerencias, obtenerQuejasSugerenciasAdmin, responderQuejaSugerencia, obtenerDetalleQuejaSugerencia } from '../controllers/quejaSugerenciaController.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';

const router = Router();

// Crear queja o sugerencia
router.post('/crear', protegerRuta, soloCliente, crearQuejaSugerencia);

// Obtener las quejas o sugerencias
router.get('/mis', protegerRuta, soloCliente, obtenerMisQuejasSugerencias);

// Obtener todas las quejas y sugerencias 
router.get('/admin', protegerRuta, soloAdmin, obtenerQuejasSugerenciasAdmin);

// Responder una queja o sugerencia
router.patch('/responder/:id', protegerRuta, soloAdmin, responderQuejaSugerencia);

// Obtener detalle de una queja o sugerencia
router.get('/detalle/:id', protegerRuta, obtenerDetalleQuejaSugerencia);

export default router;