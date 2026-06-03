import { Router } from 'express';
import { crearPedido, obtenerPedidosPendientes, aceptarPedido} from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Ruta privada: requiere inicio de sesión para registrar la orden
router.post('/crear', protegerRuta,soloCliente, crearPedido);

// Rutas para listar pedidos pendientes 
router.get('/pendientes', protegerRuta, soloVendedor, obtenerPedidosPendientes);

// Ruta para que el vendedor acepte un pedido del muro
router.put('/aceptar/:id', protegerRuta, soloVendedor, aceptarPedido);

export default router;