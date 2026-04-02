import dotenv from 'dotenv';
import app from './server.js';
import connection from './config/database.js';

dotenv.config();

// Conectar a la BD
connection();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`Servidor corriendo en el puerto ${PORT}`);
});