import { Router } from 'express';
import { registrarCliente } from '../controllers/clienteController.js';

const router = Router();

// Registro público de cliente
router.post('/registro', registrarCliente);

export default router;