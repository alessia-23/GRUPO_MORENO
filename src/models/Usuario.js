import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema(
    {
        // Correo usado para iniciar sesión
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        // Contraseña encriptada
        password: {
            type: String,
            required: true,
        },

        // Rol del usuario dentro del sistema
        rol: {
            type: String,
            enum: ['ADMINISTRADOR', 'VENDEDOR', 'CLIENTE'],
            required: true
        },

        // Estado para activar o inactivar acceso
        estado: {
            type: Boolean,
            default: true
        },

        // Token auxiliar para recuperación de contraseña si luego se usa, va a ser temporal y se eliminará después de su uso
        token: {
            type: String,
            default: null
        },

        // Id del perfil relacionado
        perfilId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'perfilModelo'
        },

        // Nombre del modelo relacionado
        perfilModelo: {
            type: String,
            required: true,
            enum: ['Administrador', 'Vendedor', 'Cliente']
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'Usuarios'
    }
);

const Usuario = mongoose.model('Usuario', usuarioSchema);

export default Usuario;