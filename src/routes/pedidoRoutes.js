import { Router } from 'express';
import { crearPedidoPorFoto, obtenerPedidosPendientes, aceptarPedido, obtenerMisPedidos, obtenerDetallePedido} from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear pedido por foto con lista enviada por el cliente
router.post('/crear-foto', protegerRuta,soloCliente, crearPedidoPorFoto);

// Rutas para listar pedidos pendientes 
router.get('/pendientes', protegerRuta, soloVendedor, obtenerPedidosPendientes);

// Ruta para que el vendedor acepte un pedido del muro
router.put('/aceptar/:id', protegerRuta, soloVendedor, aceptarPedido);

// Obtener los pedidos de la persona autenticada, con su respectivo rol
router.get('/mis-pedidos', protegerRuta, obtenerMisPedidos);

// Obtener el detalle de un pedido específico
router.get('/detalle/:id', protegerRuta, obtenerDetallePedido);

export default router;