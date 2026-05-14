// Importaciones
import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
import vendedorRoutes from './routes/vendedorRoutes.js';
import productoRoutes from './routes/productoRoutes.js';


// Inicialización
const app = express();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middlewares
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
}));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('Server on');
});

//Rutas de autenticación y acceso endpoints
app.use('/api/auth', authRoutes);  // Rutas de autenticación
app.use('/api/admin', adminRoutes); // Rutas del administrador
app.use('/api/clientes', clienteRoutes); // Rutas de clientes
app.use('/api/vendedores', vendedorRoutes); // Rutas de vendedores
app.use('/api/categorias', categoriaRoutes); // Rutas de categorías
app.use('/api/productos', productoRoutes); // Ruta para productos


// Exportar app
export default app;