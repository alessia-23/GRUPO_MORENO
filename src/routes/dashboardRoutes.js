import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import { obtenerDashboardVendedor } from '../controllers/dashboardController.js';

const router = Router();

// Dashboard completo del vendedor
router.get('/vendedor', protegerRuta, soloVendedor, obtenerDashboardVendedor);

export default router;