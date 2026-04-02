import mongoose from 'mongoose';

const administradorSchema = new mongoose.Schema(
    {
        // Datos básicos del administrador
        nombre: {
            type: String,
            required: true,
            trim: true
        },
        apellido: {
            type: String,
            required: true,
            trim: true
        },

        // Cédula única
        cedula: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return v.length === 10 && !isNaN(v);
                },
                message: 'La cédula debe tener exactamente 10 dígitos'
            }
        },

        // Teléfono único
        telefono: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return v.length === 10 && !isNaN(v);
                },
                message: 'El teléfono debe tener exactamente 10 números'
            }
        },

        // Dirección básica
        direccion: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'Administradores'
    }
);

export default mongoose.model('Administrador', administradorSchema);