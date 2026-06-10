import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { obtenerChatPedido, enviarMensajePedido } from '../controllers/chatPedidoController.js';

const router = Router();

// Obtener mensajes del chat de un pedido
router.get('/:pedidoId', protegerRuta, obtenerChatPedido);

// Enviar mensaje al chat de un pedido
router.post('/:pedidoId/mensajes', protegerRuta, enviarMensajePedido);

export default router;