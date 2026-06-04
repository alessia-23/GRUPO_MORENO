import mongoose from 'mongoose';
import { calcularTotales } from '../helpers/calcularTotal.js';

const carritoSchema = new mongoose.Schema(
    {
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: [true, 'El cliente es obligatorio'],
            unique: true
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
                    required: true,
                    trim: true
                },

                codigo: {
                    type: String,
                    trim: true,
                    uppercase: true
                },

                imagen: {
                    url: {
                        type: String,
                        default: null
                    },
                    public_id: {
                        type: String,
                        default: null
                    }
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
                    required: [true, 'La cantidad es obligatoria'],
                    min: [1, 'La cantidad mínima es 1'],
                    default: 1
                },

                precioUnitario: {
                    type: Number,
                    required: true,
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
                    default: 0
                }
            }
        ],

        subtotalGeneral: {
            type: Number,
            default: 0
        },

        ivaGeneral: {
            type: Number,
            default: 0
        },

        totalGeneral: {
            type: Number,
            default: 0
        },

        estado: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'Carritos'
    }
);

carritoSchema.pre('save', function (next) {
    if (!this.articulos || this.articulos.length === 0) {
        this.subtotalGeneral = 0;
        this.ivaGeneral = 0;
        this.totalGeneral = 0;
        return next();
    }

    const resultado = calcularTotales(this.articulos);

    this.articulos = resultado.itemsCalculados;
    this.subtotalGeneral = resultado.subtotalGeneral;
    this.ivaGeneral = resultado.ivaGeneral;
    this.totalGeneral = resultado.totalGeneral;

    next();
});

const Carrito = mongoose.model('Carrito', carritoSchema);

export default Carrito;