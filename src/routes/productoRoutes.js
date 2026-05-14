import { Router } from 'express';
import { crearProducto } from '../controllers/productoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';


const router = Router();





export default router;