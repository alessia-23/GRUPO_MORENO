import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import { obtenerGraficasDashboardVendedor } from '../controllers/dashboardController.js';

const router = Router();

// Gráficas dashboard vendedor
router.get('/vendedor/graficas', protegerRuta, soloVendedor, obtenerGraficasDashboardVendedor);

export default router;