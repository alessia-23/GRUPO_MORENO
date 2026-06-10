import mongoose from 'mongoose';

const quejaSugerenciaSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El usuario es obligatorio']
        },

        rolUsuario: {
            type: String,
            enum: ['CLIENTE', 'VENDEDOR'],
            required: [true, 'El rol del usuario es obligatorio']
        },

        asunto: {
            type: String,
            required: [true, 'El asunto es obligatorio'],
            trim: true,
            minlength: [3, 'El asunto debe tener mínimo 3 caracteres'],
            maxlength: [60, 'El asunto no puede exceder los 60 caracteres']
        },

        mensaje: {
            type: String,
            required: [true, 'El mensaje es obligatorio'],
            trim: true,
            minlength: [5, 'El mensaje debe tener mínimo 5 caracteres'],
            maxlength: [500, 'El mensaje no puede exceder los 500 caracteres']
        },

        estado: {
            type: String,
            enum: ['PENDIENTE', 'FINALIZADA'],
            default: 'PENDIENTE'
        },

        respuestaAdmin: {
            type: String,
            trim: true,
            maxlength: [500, 'La respuesta no puede exceder los 500 caracteres'],
            default: ''
        },

        respondidoPor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            default: null
        },

        fechaRespuesta: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'QuejasSugerencias'
    }
);

const QuejaSugerencia = mongoose.model(
    'QuejaSugerencia',
    quejaSugerenciaSchema
);

export default QuejaSugerencia;