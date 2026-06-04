import mongoose from 'mongoose';
import validarIdentificacion from '../helpers/validarIdentificacion.js';

const pedidoSchema = new mongoose.Schema({
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El cliente es obligatorio']
    },

    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },

    tipoPedido: {
        type: String,
        enum: ['FOTO_LISTA', 'CARRITO'],
        required: [true, 'El tipo de pedido es obligatorio']
    },

    nombrePedido: {
        type: String,
        required: [true, 'El nombre del pedido es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
        maxlength: [60, 'El nombre no puede exceder los 60 caracteres']
    },

    listaCliente: {
        url: {
            type: String,
            trim: true,
            default: null
        },
        public_id: {
            type: String,
            trim: true,
            default: null
        }
    },

    articulos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto'
            },

            nombreProducto: {
                type: String,
                trim: true
            },

            color: {
                type: String,
                trim: true,
                default: ''
            },

            tamanio: {
                type: String,
                trim: true,
                default: ''
            },

            cantidad: {
                type: Number,
                min: [1, 'La cantidad mínima es 1']
            }
        }
    ],

    datosFacturacion: {
        nombreCompleto: {
            type: String,
            required: [true, 'El nombre completo es obligatorio'],
            trim: true,
            minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
            maxlength: [80, 'El nombre no puede exceder los 80 caracteres'],
            validate: {
                validator: function (v) {
                    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(v);
                },
                message: 'El nombre solo puede contener letras'
            }
        },

        identificacion: {
            type: String,
            required: [true, 'La cédula o RUC es obligatorio'],
            trim: true,
            validate: {
                validator: validarIdentificacion,
                message: 'Ingrese una cédula o RUC válido'
            }
        },

        correo: {
            type: String,
            required: [true, 'El correo electrónico es obligatorio'],
            trim: true,
            lowercase: true,
            maxlength: [100, 'El correo no puede exceder los 100 caracteres'],
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Ingrese un correo válido'
            ]
        },

        telefono: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            trim: true,
            validate: {
                validator: function (v) {
                    return /^09\d{8}$/.test(v);
                },
                message: 'Ingrese un número celular ecuatoriano válido'
            }
        }
    },

    tipoEntrega: {
        type: String,
        enum: ['RETIRO_LOCAL', 'ENVIO_DOMICILIO'],
        required: [true, 'El tipo de entrega es obligatorio']
    },

    direccionEntrega: {
        ciudad: {
            type: String,
            trim: true,
            maxlength: [25, 'La ciudad no puede exceder los 25 caracteres'],
            validate: {
                validator: function (v) {
                    if (!v) return true;
                    return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(v);
                },
                message: 'La ciudad solo puede contener letras'
            }
        },

        direccion: {
            type: String,
            trim: true,
            maxlength: [80, 'La dirección no puede exceder los 80 caracteres']
        },

        referencia: {
            type: String,
            trim: true,
            maxlength: [80, 'La referencia no puede exceder los 80 caracteres'],
            default: ''
        }
    },

    estado: {
        type: String,
        enum: [
            'PENDIENTE',
            'EN_PROCESO',
            'FINALIZADO',
            'CANCELADO'
        ],
        default: 'PENDIENTE'
    },

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

pedidoSchema.pre('validate', function () {
    if (this.tipoEntrega === 'ENVIO_DOMICILIO') {
        if (!this.direccionEntrega?.ciudad?.trim()) {
            this.invalidate(
                'direccionEntrega.ciudad',
                'La ciudad de entrega es obligatoria'
            );
        }

        if (!this.direccionEntrega?.direccion?.trim()) {
            this.invalidate(
                'direccionEntrega.direccion',
                'La dirección de entrega es obligatoria'
            );
        }
    }

    if (this.tipoPedido === 'FOTO_LISTA') {
        if (
            !this.listaCliente?.url?.trim() ||
            !this.listaCliente?.public_id?.trim()
        ) {
            this.invalidate(
                'listaCliente.url',
                'La imagen de la lista es obligatoria para este tipo de pedido'
            );
        }

        this.articulos = [];
    }

    if (this.tipoPedido === 'CARRITO') {
        if (!this.articulos || this.articulos.length === 0) {
            this.invalidate(
                'articulos',
                'Un pedido por carrito debe contener al menos un artículo'
            );
        }

        this.listaCliente = {
            url: null,
            public_id: null
        };
    }
});

const Pedido = mongoose.model('Pedido', pedidoSchema);


export default Pedido;