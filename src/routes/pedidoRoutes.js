import { Router } from 'express';
import { crearPedido, obtenerPedidosPendientes} from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';


const router = Router();

// Ruta privada: requiere inicio de sesión para registrar la orden
router.post('/crear', protegerRuta,soloCliente, crearPedido);

// Rutas para listar pedidos pendientes 
router.get('/pendientes', protegerRuta, soloVendedor, obtenerPedidosPendientes);

export default router;