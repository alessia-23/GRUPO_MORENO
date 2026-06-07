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
        minlength: [5, 'El nombre debe tener mínimo 5 caracteres'],
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
                trim: true,
                maxlength: [60, 'El nombre del producto no puede exceder los 60 caracteres']
            },

            codigo: {
                type: String,
                trim: true,
                uppercase: true,
                maxlength: [15, 'El código no puede exceder los 15 caracteres']
            },

            color: {
                type: String,
                trim: true,
                default: '',
                maxlength: [20, 'El color no puede exceder los 20 caracteres']
            },

            tamanio: {
                type: String,
                trim: true,
                default: '',
                maxlength: [15, 'El tamaño no puede exceder los 15 caracteres']
            },

            cantidad: {
                type: Number,
                min: [1, 'La cantidad mínima es 1'],
                validate: {
                    validator: function (valor) {
                        if (valor === undefined || valor === null) return true;
                        return Number.isInteger(valor);
                    },
                    message: 'La cantidad debe ser un número entero'
                }
            },

            precioUnitario: {
                type: Number,
                default: 0,
                min: [0, 'El precio unitario no puede ser negativo']
            },

            porcentajeIva: {
                type: Number,
                enum: [0, 0.15],
                default: 0.15
            },

            subtotal: {
                type: Number,
                default: 0,
                min: [0, 'El subtotal no puede ser negativo']
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

    metodoPago: {
        type: String,
        enum: ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'],
        default: null
    },

    estadoPago: {
        type: String,
        enum: ['PENDIENTE', 'PAGADO'],
        default: 'PENDIENTE'
    },

    estadoCotizacion: {
        type: String,
        enum: ['SIN_COTIZAR', 'COTIZADA', 'ACEPTADA', 'RECHAZADA'],
        default: 'SIN_COTIZAR'
    },

    resumenPago: {
        subtotalProductos: {
            type: Number,
            default: 0,
            min: [0, 'El subtotal de productos no puede ser negativo']
        },

        ivaProductos: {
            type: Number,
            default: 0,
            min: [0, 'El IVA de productos no puede ser negativo']
        },

        costoEnvio: {
            type: Number,
            default: 0,
            min: [0, 'El costo de envío no puede ser negativo']
        },

        totalPagar: {
            type: Number,
            default: 0,
            min: [0, 'El total a pagar no puede ser negativo']
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
    if (!this.resumenPago) {
        this.resumenPago = {};
    }

    if (this.tipoEntrega === 'ENVIO_DOMICILIO') {
        if (!this.direccionEntrega?.direccion?.trim()) {
            this.invalidate(
                'direccionEntrega.direccion',
                'La dirección de entrega es obligatoria'
            );
        }

        this.resumenPago.costoEnvio = 3.50;
    }

    if (this.tipoEntrega === 'RETIRO_LOCAL') {
        this.direccionEntrega = undefined;
        this.resumenPago.costoEnvio = 0;
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

        if (!this.estadoCotizacion || this.estadoCotizacion === 'ACEPTADA') {
            this.estadoCotizacion = 'SIN_COTIZAR';
        }
    }

    if (this.tipoPedido === 'CARRITO') {
        if (!this.articulos || this.articulos.length === 0) {
            this.invalidate(
                'articulos',
                'Un pedido por carrito debe contener al menos un artículo'
            );
        }
        this.listaCliente = undefined;

        if (!this.estadoCotizacion || this.estadoCotizacion === 'SIN_COTIZAR') {
            this.estadoCotizacion = 'ACEPTADA';
        }
    }

    const subtotal = Number(this.resumenPago.subtotalProductos || 0);
    const iva = Number(this.resumenPago.ivaProductos || 0);
    const envio = Number(this.resumenPago.costoEnvio || 0);

    this.resumenPago.totalPagar = Number((subtotal + iva + envio).toFixed(2));
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

export default Pedido;