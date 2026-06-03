import mongoose from 'mongoose';

const pedidoSchema = new mongoose.Schema({
    // Usuario cliente que creó el pedido. No se envía desde el frontend, se toma desde el token
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El cliente es obligatorio']
    },

    // Vendedor que acepta el pedido. Inicia en null para que aparezca en el muro de pedidos pendientes
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },

    // Imagen de la lista enviada por el cliente
    listaCliente: {
        url: {
            type: String,
            required: [true, 'La imagen de la lista es obligatoria'],
            trim: true
        },
        public_id: {
            type: String,
            required: [true, 'El public_id de la imagen es obligatorio'],
            trim: true
        }
    },

    // Dirección que el cliente escribe para este pedido
    direccionEntrega: {
        ciudad: {
            type: String,
            required: [true, 'La ciudad de entrega es obligatoria'],
            trim: true,
            minlength: [2, 'La ciudad debe tener mínimo 2 caracteres'],
            maxlength: [25, 'La ciudad debe tener máximo 25 caracteres'],
            validate: {
                validator: function (v) {
                    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(v);
                },
                message: 'La ciudad solo puede contener letras'
            }
        },

        direccion: {
            type: String,
            required: [true, 'La dirección de entrega es obligatoria'],
            trim: true,
            minlength: [5, 'La dirección debe tener mínimo 5 caracteres'],
            maxlength: [80, 'La dirección debe tener máximo 80 caracteres']
        },

        referencia: {
            type: String,
            trim: true,
            maxlength: [100, 'La referencia no puede exceder los 100 caracteres'],
            default: ''
        },

        telefono: {
            type: String,
            required: [true, 'El teléfono de contacto es obligatorio'],
            trim: true,
            validate: {
                validator: function (v) {
                    // Exactamente 10 dígitos
                    if (!/^\d{10}$/.test(v)) {
                        return false;
                    }

                    // Evitar números repetidos
                    if (/^(\d)\1{9}$/.test(v)) {
                        return false;
                    }

                    return true;
                },
                message: 'Ingrese un número de teléfono válido'
            }
        }
    },

    estado: {
        type: String,
        enum: [
            'PENDIENTE',
            'EN_PROCESO',
            'ENTREGADO',
            'CANCELADO'
        ],
        default: 'PENDIENTE'
    },

    // Observaciones escritas por el cliente
    observaciones: {
        type: String,
        trim: true,
        maxlength: [300, 'La observación no puede exceder los 300 caracteres'],
        default: ''
    }

}, {
    timestamps: true,
    versionKey: false,
    collection: 'Pedidos'
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

export default Pedido;