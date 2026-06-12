import mongoose from 'mongoose';

const accionesAdminSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: [
                'PAGO_SRI',
                'NUEVA_MERCADERIA',
                'BAJO_NUMERO_VENTAS',
                'PROMOCION_SUGERIDA',
                'FECHA_FESTIVA'
            ],
            required: [true, 'El tipo de acción administrativa es obligatorio']
        },

        titulo: {
            type: String,
            required: [true, 'El título es obligatorio'],
            trim: true,
            minlength: [3, 'El título debe tener mínimo 3 caracteres'],
            maxlength: [80, 'El título no puede exceder los 80 caracteres']
        },

        descripcion: {
            type: String,
            required: [true, 'La descripción es obligatoria'],
            trim: true,
            minlength: [5, 'La descripción debe tener mínimo 5 caracteres'],
            maxlength: [600, 'La descripción no puede exceder los 600 caracteres']
        },

        periodo: {
            type: String,
            required: [true, 'El periodo es obligatorio'],
            trim: true,
            maxlength: [20, 'El periodo no puede exceder los 20 caracteres']
            // Ejemplo: 2026-06
        },

        fechaLimite: {
            type: Date,
            default: null
        },

        estado: {
            type: String,
            enum: ['PENDIENTE', 'FINALIZADA'],
            default: 'PENDIENTE'
        },

        prioridad: {
            type: String,
            enum: ['BAJA', 'MEDIA', 'ALTA'],
            default: 'MEDIA'
        },

        origen: {
            type: String,
            enum: ['SISTEMA', 'N8N', 'ADMIN'],
            default: 'SISTEMA'
        },

        datosExtra: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        finalizadoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            default: null
        },

        fechaFinalizacion: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'AccionesAdministrativas'
    }
);

// Evita duplicar la misma acción del mismo mes
accionesAdminSchema.index(
    { tipo: 1, periodo: 1 },
    { unique: true }
);

const AccionesAdmin = mongoose.model(
    'AccionesAdmin',
    accionesAdminSchema
);

export default AccionesAdmin;