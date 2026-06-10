import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { obtenerChatPedido, enviarMensajePedido, marcarChatPedidoComoLeido } from '../controllers/chatPedidoController.js';

const router = Router();

// Obtener mensajes del chat de un pedido
router.get('/:pedidoId', protegerRuta, obtenerChatPedido);

// Enviar mensaje al chat de un pedido
router.post('/mensajes/:pedidoId', protegerRuta, enviarMensajePedido);

// Marcar como leido
router.patch('/leer/:pedidoId', protegerRuta, marcarChatPedidoComoLeido);

export default router;