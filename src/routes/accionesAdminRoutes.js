import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import { listarAccionesAdmin, finalizarAccionAdmin, reactivarAccionAdmin, reactivarAccionAdminN8n, consultarAccionAdminN8n, ejecutarPromocionSugerida } from '../controllers/accionesAdminController.js';

const router = Router();

router.get('/', protegerRuta, soloAdmin, listarAccionesAdmin);

router.patch('/n8n/:tipo/reactivar', reactivarAccionAdminN8n);
router.get('/n8n/:tipo/estado', consultarAccionAdminN8n);

router.patch('/:tipo/finalizar', protegerRuta, soloAdmin, finalizarAccionAdmin);
router.patch('/:tipo/reactivar', protegerRuta, soloAdmin, reactivarAccionAdmin);

router.post('/PROMOCION_SUGERIDA/ejecutar',protegerRuta,soloAdmin,ejecutarPromocionSugerida);
export default router;