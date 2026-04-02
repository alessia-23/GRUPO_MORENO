import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema(
    {
        // Datos básicos del cliente
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

        // Fecha de nacimiento para tener mejor control del cliente
        fecha_nacimiento: {
            type: Date,
            required: true,
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
            trim: true,
            default: ''
        },

        // Dirección básica
        direccion: {
            type: String,
            required: true,
            trim: true
        },

        // Teléfono 
        telefono: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    return v.length === 10 && !isNaN(v);
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