import { Router } from 'express';
import { crearPedido, asignarPedido, marcarListoRetiro, entregarPedido, listarPedidos, cancelarPedido, obtenerPedidoPorId, listarMisPedidos } from '../controllers/pedidoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';


const router = Router();

// Ruta privada: requiere inicio de sesión para registrar la orden
router.post('/crear', protegerRuta,soloCliente, crearPedido);

// Listar todos los pedidos
router.get('/listar', protegerRuta, soloVendedor, soloAdmin, listarPedidos);

// Vendedor acepta/toma el pedido
router.put('/asignar/:id', protegerRuta, soloVendedor, asignarPedido);

// Marcar pedido como listo para retirar
router.put('/listo-retiro/:id', protegerRuta, soloVendedor, marcarListoRetiro);

// Marcar pedido como entregado
router.put('/entregar/:id', protegerRuta, soloVendedor, entregarPedido);

// Cancelar pedido
router.put('/cancelar/:id', protegerRuta, soloCliente, cancelarPedido);

// Listar pedidos del cliente autenticado
router.get('/mis-pedidos', protegerRuta, soloCliente, listarMisPedidos);

// Obtener pedido por ID
router.get('/:id', protegerRuta, obtenerPedidoPorId);

export default router;