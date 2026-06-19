// Importaciones
import express from 'express';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import categoriaRoutes from './routes/categoriaRoutes.js';
//import vendedorRoutes from './routes/vendedorRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import carritoRoutes from './routes/carritoRoutes.js';
import ventaRoutes from './routes/ventaRoutes.js';
import chatPedidoRoutes from './routes/chatPedidoRoutes.js';
import quejaSugerenciaRoutes from './routes/quejaSugerenciaRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import recomendacionRoutes from './routes/recomendacionRoutes.js';
import accionesAdminRoutes from './routes/accionesAdminRoutes.js';

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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
//app.use('/api/vendedores', vendedorRoutes); // Rutas de vendedores
app.use('/api/categorias', categoriaRoutes); // Rutas de categorías
app.use('/api/productos', productoRoutes); // Ruta para productos
app.use('/api/pedidos', pedidoRoutes); // Ruta para pedidos
app.use('/api/carrito', carritoRoutes); // Ruta para carrito de compras
app.use('/api/ventas', ventaRoutes); // Ruta para ventas
app.use('/api/chats-pedidos', chatPedidoRoutes); // Ruta para el chat de pedido
app.use('/api/quejas-sugerencias', quejaSugerenciaRoutes); // Ruta de quejas y sugerencias
app.use('/api/dashboard', dashboardRoutes); // Ruta para dashboard
app.use('/api/recomendacion', recomendacionRoutes); // Para recomendaciones
app.use('/api/acciones-admin', accionesAdminRoutes);

// Exportar app
export default app;