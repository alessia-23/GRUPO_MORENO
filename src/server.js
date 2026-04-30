// Importaciones
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import vendedorRoutes from './routes/vendedorRoutes.js';
// Inicialización
const app = express();

// Middlewares
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Server on');
});

//Rutas de autenticación y acceso endpoints
app.use('/api/auth', authRoutes);  // Rutas de autenticación
app.use('/api/admin', adminRoutes); // Rutas del administrador
app.use('/api/clientes', clienteRoutes); // Rutas de clientes
app.use('/api/categorias', categoriaRoutes); // Rutas de categorías
app.use('/api/vendedores', vendedorRoutes); // Rutas de vendedores

// Exportar app
export default app;