// Importaciones
import express from 'express';
import cors from 'cors';

// Inicialización
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());


// Ruta de prueba
app.get('/', (req, res) => {
res.send('Server on');
});

// Exportar app
export default app;