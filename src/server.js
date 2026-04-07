// Importaciones
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
// Inicialización
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());


// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Server on');
});

app.use('/api/auth', authRoutes);

// Exportar app
export default app;