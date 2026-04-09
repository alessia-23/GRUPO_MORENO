import { Router } from 'express';
import { registrarVendedor, desactivarVendedor, activarVendedor } from '../controllers/adminController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Registrar vendedor
router.post('/registrar-vendedor', protegerRuta, soloAdmin, registrarVendedor);

// Desactivar vendedor
router.put('/desactivar-vendedor/:id', protegerRuta, soloAdmin, desactivarVendedor);

// Activar vendedor
router.put('/activar-vendedor/:id', protegerRuta, soloAdmin, activarVendedor);
export default router;