import { Router } from 'express';
import { registrarVendedor, desactivarVendedor, activarVendedor, desactivarCliente, activarCliente, buscarCliente, buscarVendedor, listarClientesActivos, listarClientesInactivos,
listarVendedoresActivos, listarVendedoresInactivos } from '../controllers/adminController.js';
import protegerRuta from '../middleware/authMiddleware.js';
import soloAdmin from '../middleware/adminMiddleware.js';

const router = Router();

// Registrar vendedor
router.post('/registrar-vendedor', protegerRuta, soloAdmin, registrarVendedor);

// Desactivar vendedor
router.put('/desactivar-vendedor/:id', protegerRuta, soloAdmin, desactivarVendedor);

// Activar vendedor
router.put('/activar-vendedor/:id', protegerRuta, soloAdmin, activarVendedor);

/* Listar vendedores
router.get('/listar-vendedores', protegerRuta, soloAdmin, listarVendedores);
*/

/* Listar clientes
router.get('/listar-clientes', protegerRuta, soloAdmin, listarClientes);
*/

// Desactivar cliente
router.put('/desactivar-cliente/:id', protegerRuta, soloAdmin, desactivarCliente);

// Activar cliente
router.put('/activar-cliente/:id', protegerRuta, soloAdmin, activarCliente);

// Buscar cliente por cédula
router.get('/buscar-cliente/:cedula', protegerRuta, soloAdmin, buscarCliente);

// Buscar vendedor por cédula
router.get('/buscar-vendedor/:cedula', protegerRuta, soloAdmin, buscarVendedor);

// Listar clientes activos
router.get('/listar-clientes-activos', protegerRuta, soloAdmin, listarClientesActivos);

//Listar clientes inactivos
router.get('/listar-clientes-inactivos', protegerRuta, soloAdmin, listarClientesInactivos);

//Listar vendedores activos
router.get('/listar-vendedores-activos', protegerRuta, soloAdmin, listarVendedoresActivos);

//Listar vendedores inactivos
router.get('/listar-vendedores-inactivos', protegerRuta, soloAdmin, listarVendedoresInactivos);

export default router;