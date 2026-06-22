import mongoose from 'mongoose';
import validarIdentificacion from '../helpers/validarIdentificacion.js';

const administradorSchema = new mongoose.Schema(
    {
        // Datos básicos del administrador
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
            minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
            maxlength: [15, 'El nombre debe tener máximo 15 caracteres'],
            match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, 'El nombre solo debe contener letras']
        },

        apellido: {
            type: String,
            required: [true, 'El apellido es obligatorio'],
            trim: true,
            minlength: [3, 'El apellido debe tener mínimo 3 caracteres'],
            maxlength: [20, 'El apellido debe tener máximo 20 caracteres'],
            match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, 'El apellido solo debe contener letras']
        },

        // Cédula única
        cedula: {
            type: String,
            required: [true, 'La cédula o RUC es obligatoria'],
            unique: true,
            trim: true,
            validate: {
                validator: validarIdentificacion,
                message: 'Ingrese una cédula o RUC válido'
            }
        },

        // Teléfono único
        telefono: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            unique: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v);
                },
                message: 'El teléfono debe tener exactamente 10 dígitos'
            }
        },

        // Dirección básica
        direccion: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
            minlength: [5, 'La dirección debe tener mínimo 5 caracteres'],
            maxlength: [30, 'La dirección debe tener máximo 30 caracteres'],
            match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s#.,\-°]+$/, 'La dirección contiene caracteres no válidos']
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'Administradores'
    }
);

export default mongoose.model('Administrador', administradorSchema);