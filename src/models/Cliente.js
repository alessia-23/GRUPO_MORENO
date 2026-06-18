import mongoose from 'mongoose';
import validarIdentificacion from '../helpers/validarIdentificacion.js';

const clienteSchema = new mongoose.Schema(
    {
        // Datos básicos del cliente
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

        // Fecha de nacimiento para tener mejor control del cliente
        fecha_nacimiento: {
            type: Date,
            required: [true, 'La fecha de nacimiento es obligatoria'],
            validate: {
                validator: function (value) {
                    const hoy = new Date();
                    const fechaMinima = new Date();
                    fechaMinima.setFullYear(hoy.getFullYear() - 100);
                    const fechaMaxima = new Date();
                    fechaMaxima.setFullYear(hoy.getFullYear() - 15);
                    return value >= fechaMinima && value <= fechaMaxima;
                },
                message: 'La edad debe estar entre 15 y 100 años'
            }
        },

        // Ciudad del cliente
        ciudad: {
            type: String,
            required: [true, 'La ciudad es obligatoria'],
            trim: true,
            minlength: [2, 'La ciudad debe tener mínimo 2 caracteres'],
            maxlength: [25, 'La ciudad debe tener máximo 25 caracteres'],
            match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, 'La ciudad solo debe contener letras']
        },

        // Dirección básica
        direccion: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
            minlength: [5, 'La dirección debe tener mínimo 5 caracteres'],
            maxlength: [50, 'La dirección debe tener máximo 50 caracteres'],
            match: [/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s#.,\-°]+$/, 'La dirección contiene caracteres no válidos']
        },

        // Teléfono 
        telefono: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v);
                },
                message: 'El teléfono debe tener exactamente 10 dígitos'
            }
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'Clientes'
    }
);

export default mongoose.model('Cliente', clienteSchema);