import{Router} from 'express';
import {obtenerCarrito, agregarAlCarrito, actualizarCantidadCarrito, eliminarProductoCarrito} from '../controllers/carritoController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloCliente from '../middleware/clienteMiddleware.js';

const router = Router();

// Obtener carrito del cliente
router.get('/obtener', protegerRuta, soloCliente, obtenerCarrito);

// Agregar producto al carrito del cliente
router.post('/agregar', protegerRuta, soloCliente, agregarAlCarrito);

// Actualizar cantidad de un producto en el carrito del cliente
router.put('/actualizar/:productoId', protegerRuta, soloCliente, actualizarCantidadCarrito);  // Recordar que el id es del producto no del carrito

// Eliminar un producto del carrito del cliente
router.delete('/eliminar/:productoId', protegerRuta, soloCliente, eliminarProductoCarrito);  // Recordar que el id es del producto no del carrito

export default router;