import express from 'express';
import { recomendarPorProducto } from '../controllers/RecoIAController.js';

const router = express.Router();

// Recomendaciones por producto visualizado
router.get('/producto/:productoId', recomendarPorProducto);

export default router;