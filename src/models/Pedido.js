import mongoose from 'mongoose';
import { calcularTotales } from '../helpers/calcularTotal.js';

const articuloSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: [true, 'El producto es obligatorio']
    },

    cantidad: {
        type: Number,
        required: [true, 'La cantidad es obligatoria'],
        min: [1, 'La cantidad mínima es 1']
    },

    precioUnitario: {
        type: Number,
        required: [true, 'El precio unitario es obligatorio'],
        min: [0, 'El precio no puede ser negativo']
    },

    ivaRate: {
        type: Number,
        default: 0.15,
        min: [0, 'El IVA no puede ser negativo']
    },

    subtotal: {
        type: Number,
        default: 0
    },

    iva: {
        type: Number,
        default: 0
    },

    total: {
        type: Number,
        default: 0
    }
}, {
    _id: false
});

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

    articulos: {
        type: [articuloSchema],
        required: [true, 'Los artículos son obligatorios'],
        validate: {
            validator: function (articulos) {
                return articulos.length > 0;
            },
            message: 'El pedido debe tener al menos un producto'
        }
    },

    comprobanteDigital: {
        url: {
            type: String,
            default: null
        },
        public_id: {
            type: String,
            default: null
        }
    },

    subtotal: {
        type: Number,
        default: 0,
        min: [0, 'El subtotal no puede ser negativo']
    },

    iva: {
        type: Number,
        default: 0,
        min: [0, 'El IVA no puede ser negativo']
    },

    total: {
        type: Number,
        default: 0,
        min: [0, 'El total no puede ser negativo']
    },

    estado: {
        type: String,
        enum: [
            'PENDIENTE',
            'EN_PROCESO',
            'LISTO_RETIRO',
            'ENTREGADO',
            'CANCELADO'
        ],
        default: 'PENDIENTE'
    },

    metodoPago: {
        type: String,
        enum: ['EFECTIVO', 'TRANSFERENCIA', 'PENDIENTE_PAGO'],
        default: 'PENDIENTE_PAGO'
    },
    estadoPago: {
        type: String,
        enum: ['PENDIENTE', 'PAGADO', 'RECHAZADO'],
        default: 'PENDIENTE'
    },

    referenciaTransaccion: {
        type: String,
        default: null,
        trim: true
    },

    fechaPago: {
        type: Date,
        default: null
    },

    observaciones: {
        type: String,
        trim: true,
        default: ''
    }

}, {
    timestamps: true,
    versionKey: false,
    collection: 'Pedidos'
});

// Calcular subtotal, IVA y total antes de guardar
pedidoSchema.pre('save', function () {
    const resultado = calcularTotales(this.articulos);

    this.articulos = resultado.itemsCalculados;
    this.subtotal = resultado.subtotal;
    this.iva = resultado.iva;
    this.total = resultado.total;
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

export default Pedido;