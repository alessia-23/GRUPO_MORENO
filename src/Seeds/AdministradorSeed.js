import Usuario from '../models/Usuario.js';
import Administrador from '../models/Administrador.js';
import { hashPassword } from '../helpers/bcrypt.js';

// Crea el administrador inicial solo si no existe
const createAdminSeed = async () => {
    try {
        const adminExistente = await Usuario.findOne({
            rol: 'ADMINISTRADOR'
        });

        if (adminExistente) {
            console.log('El administrador inicial ya existe');
            return;
        }

        const adminPerfil = await Administrador.create({
            nombre: 'Wilson',
            apellido: 'Moreno',
            cedula: '0501859235',
            telefono: '0969557707',
            direccion: 'Quito'
        });

        const passwordEncriptada = await hashPassword('Admin1*.');

        await Usuario.create({
            email: 'grupomoreno593@gmail.com',
            password: passwordEncriptada,
            rol: 'ADMINISTRADOR',
            estado: true,
            token: null,
            perfilId: adminPerfil._id,
            perfilModelo: 'Administrador'
        });

        console.log('Administrador inicial creado correctamente');
    } catch (error) {
        console.error('Error al crear el administrador inicial:', error.message);
    }
};

export default createAdminSeed;