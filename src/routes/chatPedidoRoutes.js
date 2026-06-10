import { Router } from 'express';
import protegerRuta from '../middleware/authMiddleware.js';
import { obtenerChatPedido } from '../controllers/chatPedidoController.js';

const router = Router();

// Obtener mensajes del chat de un pedido
router.get('/:pedidoId', protegerRuta, obtenerChatPedido);

export default router;