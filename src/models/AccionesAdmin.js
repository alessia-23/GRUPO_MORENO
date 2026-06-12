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
            required: true
        },

        periodo: {
            type: String,
            required: true,
            trim: true
        },

        estado: {
            type: String,
            enum: ['PENDIENTE', 'FINALIZADA'],
            default: 'PENDIENTE'
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

accionesAdminSchema.index(
    { tipo: 1, periodo: 1 },
    { unique: true }
);

const AccionesAdmin = mongoose.model('AccionesAdmin', accionesAdminSchema);

export default AccionesAdmin;