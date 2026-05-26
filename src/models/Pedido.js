import mongoose from 'mongoose';

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

    articulos: [
        {
            producto: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Producto',
                required: true
            },

            cantidad: {
                type: Number,
                required: true,
                min: 1
            },

            precioUnitario: {
                type: Number,
                required: true
            },

            ivaRate: {
                type: Number,
                default: 0.15
            },

            subtotalLinea: {
                type: Number,
                default: 0
            },

            ivaLinea: {
                type: Number,
                default: 0
            },

            totalLinea: {
                type: Number,
                default: 0
            }
        }
    ],

    comprobanteDigital: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
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
    },

    estado: {
        type: String,
        enum: [
            'PENDIENTE',
            'ASIGNADO',
            'EN_PREPARACION',
            'EN_CAMINO',
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
        trim: true
    }

}, {
    timestamps: true,
    versionKey: false,
    collection: 'Pedidos'
});

pedidoSchema.pre('save', function () {

    if (!this.articulos || this.articulos.length === 0) {
        this.subtotal = 0;
        this.iva = 0;
        this.total = 0;
        return;
    }

    let subtotal = 0;
    let ivaTotal = 0;

    this.articulos.forEach((item) => {

        const subtotalLinea = item.cantidad * item.precioUnitario;
        const ivaLinea = subtotalLinea * (item.ivaRate || 0.15);

        item.subtotalLinea = Number(subtotalLinea.toFixed(2));
        item.ivaLinea = Number(ivaLinea.toFixed(2));
        item.totalLinea = Number((subtotalLinea + ivaLinea).toFixed(2));

        subtotal += subtotalLinea;
        ivaTotal += ivaLinea;
    });

    this.subtotal = Number(subtotal.toFixed(2));
    this.iva = Number(ivaTotal.toFixed(2));
    this.total = Number((subtotal + ivaTotal).toFixed(2));
});

const Pedido = mongoose.model('Pedido', pedidoSchema);
export default Pedido;

