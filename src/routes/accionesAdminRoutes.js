import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import { listarAccionesAdmin, finalizarAccionAdmin, reactivarAccionAdmin, reactivarAccionAdminN8n } from '../controllers/accionesAdminController.js';

const router = Router();

router.get('/', protegerRuta, soloAdmin, listarAccionesAdmin);

router.patch('/n8n/:tipo/reactivar', reactivarAccionAdminN8n);

router.patch('/:tipo/finalizar', protegerRuta, soloAdmin, finalizarAccionAdmin);
router.patch('/:tipo/reactivar', protegerRuta, soloAdmin, reactivarAccionAdmin);
export default router;