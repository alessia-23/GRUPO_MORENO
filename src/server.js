// Importaciones
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
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

//Rutas de autenticación y acceso 
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Exportar app
export default app;