import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

import { crearRecomendacion, obtenerMisRecomendaciones, obtenerRecomendacionesAdmin, responderRecomendacion, obtenerDetalleRecomendacion } from '../controllers/recomendacionController.js';
const router = Router();

// Crear una recomendación para el administrador
router.post('/crear', protegerRuta, soloVendedor, crearRecomendacion);

// Obtener mis recomendaciones
router.get('/mis', protegerRuta, soloVendedor, obtenerMisRecomendaciones);

// Obtener todas las recomendaciones
router.get('/admin', protegerRuta, soloAdmin, obtenerRecomendacionesAdmin);
// Responder una recomendación
router.patch('/responder/:id', protegerRuta, soloAdmin, responderRecomendacion);

// Obtener detalle de una recomendación
router.get('/detalle/:id', protegerRuta, obtenerDetalleRecomendacion);

export default router;