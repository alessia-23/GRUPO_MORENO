import { Router } from 'express';
import { crearPedidoPorFoto, obtenerPedidosPendientes, aceptarPedido, obtenerMisPedidos, obtenerDetallePedido, cambiarEstadoPedido, crearPedidoDesdeCarrito } from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear pedido por foto con lista enviada por el cliente
router.post('/crear-foto', protegerRuta, soloCliente, crearPedidoPorFoto);

// Rutas para listar pedidos pendientes 
router.get('/pendientes', protegerRuta, soloVendedor, obtenerPedidosPendientes);

// Ruta para que el vendedor acepte un pedido del muro
router.put('/aceptar/:id', protegerRuta, soloVendedor, aceptarPedido);

// Obtener los pedidos de la persona autenticada, con su respectivo rol
router.get('/mis-pedidos', protegerRuta, obtenerMisPedidos);

// Vendedor cambia e estado del pedido
router.put('/estado/:id', protegerRuta, cambiarEstadoPedido);

// Obtener el detalle de un pedido específico
router.get('/detalle/:id', protegerRuta, obtenerDetallePedido);

// Crear un pedido a partir del carrito
router.post('/crear-desde-carrito', protegerRuta, soloCliente, crearPedidoDesdeCarrito);
export default router;