import dotenv from 'dotenv';
import app from './server.js';
import connection from './config/database.js';
import createAdminSeed from './Seeds/AdministradorSeed.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

// Conecta la BD, crea admin (solo una vez) y levanta servidor
const iniciarServidor = async () => {
    try {
        await connection();
        await createAdminSeed();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
    }
};

iniciarServidor();