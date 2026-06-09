import { Router } from 'express';
import { crearVentaDirecta, obtenerMisVentas, obtenerDetalleVenta, confirmarTransferenciaVenta, crearVentaDesdePedido, cancelarVenta, pagarCarritoConTarjeta } from '../controllers/ventaController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloVendedor from '../middleware/vendedorMiddleware.js';

const router = Router();

// Crear una venta directa en el local
router.post('/directa', protegerRuta, soloVendedor, crearVentaDirecta);

// El vendedor puede listar las ventas que ha hecho 
router.get('/mis-ventas', protegerRuta, soloVendedor, obtenerMisVentas);

// Obtener el detalle de una venta realizada por el vendedor
router.get('/detalle/:id', protegerRuta, soloVendedor, obtenerDetalleVenta);

// Confirmar la transferencia de una venta
router.put('/confirmar-transferencia/:id', protegerRuta, soloVendedor, confirmarTransferenciaVenta);

// Crear una venta desde un pedido
router.post('/crear-desde-pedido/:pedidoId', protegerRuta, soloVendedor, crearVentaDesdePedido);

// Pagar carrito con tarjeta
router.post('/pagar-carrito-tarjeta', protegerRuta, pagarCarritoConTarjeta);

// Cancelar una venta pendiente
router.put('/cancelar/:id', protegerRuta, soloVendedor, cancelarVenta);


export default router;