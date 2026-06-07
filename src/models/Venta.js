import mongoose from 'mongoose';
import validarIdentificacion from '../helpers/validarIdentificacion.js';
import { calcularTotales } from '../helpers/calcularTotal.js';

const ventaSchema = new mongoose.Schema({
    origen: {
        type: String,
        enum: ['PEDIDO', 'DIRECTA'],
        required: [true, 'El origen de la venta es obligatorio']
    },

    pedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pedido',
        default: null
    },

    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },

    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El vendedor es obligatorio']
    },

    articulos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto',
                required: [true, 'El producto es obligatorio']
            },

            nombreProducto: {
                type: String,
                required: [true, 'El nombre del producto es obligatorio'],
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
                required: [true, 'La cantidad es obligatoria'],
                min: [1, 'La cantidad mínima es 1'],
                validate: {
                    validator: Number.isInteger,
                    message: 'La cantidad debe ser un número entero'
                }
            },

            precioUnitario: {
                type: Number,
                required: [true, 'El precio unitario es obligatorio'],
                min: [0, 'El precio unitario no puede ser negativo']
            },

            tipoPrecio: {
                type: String,
                enum: ['NORMAL', 'MAYORISTA'],
                default: 'NORMAL'
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

    metodoPago: {
        type: String,
        enum: ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'],
        required: [true, 'El método de pago es obligatorio']
    },

    estadoPago: {
        type: String,
        enum: ['PENDIENTE', 'PAGADO'],
        default: 'PENDIENTE'
    },

    comprobantePago: {
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

    referenciaPago: {
        type: String,
        trim: true,
        maxlength: [40, 'La referencia de pago no puede exceder los 40 caracteres'],
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^[A-Za-z0-9-]+$/.test(v);
            },
            message: 'La referencia solo puede contener letras, números y guiones'
        },
        default: ''
    },

    stripe: {
        sessionId: {
            type: String,
            trim: true,
            default: null
        },
        paymentIntentId: {
            type: String,
            trim: true,
            default: null
        },
        urlPago: {
            type: String,
            trim: true,
            default: null
        }
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
        enum: ['PENDIENTE_PAGO', 'FINALIZADA', 'CANCELADA'],
        default: 'PENDIENTE_PAGO'
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
    collection: 'Ventas'
});

ventaSchema.pre('validate', function () {
    if (!this.resumenPago) {
        this.resumenPago = {};
    }

    if (this.origen === 'PEDIDO') {
        if (!this.pedido) {
            this.invalidate(
                'pedido',
                'La venta desde pedido debe tener un pedido asociado'
            );
        }
    }

    if (this.origen === 'DIRECTA') {
        this.pedido = null;
        this.resumenPago.costoEnvio = 0;
    }

    if (this.metodoPago === 'EFECTIVO') {
        this.comprobantePago = {
            url: null,
            public_id: null
        };

        this.stripe = {
            sessionId: null,
            paymentIntentId: null,
            urlPago: null
        };

        this.referenciaPago = '';
    }

    if (this.metodoPago === 'TRANSFERENCIA') {
        this.stripe = {
            sessionId: null,
            paymentIntentId: null,
            urlPago: null
        };
    }

    if (!this.articulos || this.articulos.length === 0) {
        this.invalidate(
            'articulos',
            'La venta debe contener al menos un artículo'
        );
        return;
    }

    const resultado = calcularTotales(this.articulos);

    this.articulos = resultado.itemsCalculados;
    this.resumenPago.subtotalProductos = resultado.subtotalGeneral;
    this.resumenPago.ivaProductos = resultado.ivaGeneral;

    const subtotal = Number(this.resumenPago.subtotalProductos || 0);
    const iva = Number(this.resumenPago.ivaProductos || 0);
    const envio = Number(this.resumenPago.costoEnvio || 0);

    this.resumenPago.totalPagar = Number((subtotal + iva + envio).toFixed(2));
});

const Venta = mongoose.model('Venta', ventaSchema);

export default Venta;