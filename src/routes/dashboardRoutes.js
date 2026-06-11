import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import { obtenerDashboardVendedor, obtenerDashboardAdmin } from '../controllers/dashboardController.js';

const router = Router();

// Dashboard completo del vendedor
router.get('/vendedor', protegerRuta, soloVendedor, obtenerDashboardVendedor);

// Dashboard completo del administrador
router.get('/admin', protegerRuta, soloAdmin, obtenerDashboardAdmin);

export default router;