import { Router } from 'express';
import { crearProducto } from '../controllers/productoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';
import crearUpload from '../middleware/multer.js';

const router = Router();

const uploadProductos = crearUpload('productos');

// Crear producto con imagen, solo EL administrador
router.post('/crear',protegerRuta,soloAdmin,uploadProductos.single('imagen'),crearProducto);

export default router;