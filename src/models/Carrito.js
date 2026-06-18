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
                    required: [true, 'El nombre del producto es obligatorio'],
                    trim: true,
                    maxlength: [40, 'El nombre del producto no puede exceder los 40 caracteres']
                },
                codigo: {
                    type: String,
                    trim: true,
                    uppercase: true,
                    maxlength: [10, 'El código no puede exceder los 10 caracteres']
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
                    default: 1,
                    validate: {
                        validator: Number.isInteger,
                        message: 'La cantidad debe ser un número entero'
                    }
                },
                precioUnitario: {
                    type: Number,
                    required: [true, 'El precio unitario es obligatorio'],
                    min: [0, 'El precio unitario no puede ser negativo'],
                    validate: {
                        validator: function (valor) {
                            return typeof valor === 'number' && !Number.isNaN(valor);
                        },
                        message: 'El precio unitario debe ser un número válido'
                    }
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
        subtotalGeneral: {
            type: Number,
            default: 0,
            min: [0, 'El subtotal general no puede ser negativo']
        },
        ivaGeneral: {
            type: Number,
            default: 0,
            min: [0, 'El IVA general no puede ser negativo']
        },
        totalGeneral: {
            type: Number,
            default: 0,
            min: [0, 'El total general no puede ser negativo']
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

carritoSchema.pre('save', function () {
    if (!this.articulos || this.articulos.length === 0) {
        this.subtotalGeneral = 0;
        this.ivaGeneral = 0;
        this.totalGeneral = 0;
        return;
    }
    const resultado = calcularTotales(this.articulos);
    this.articulos = resultado.itemsCalculados;
    this.subtotalGeneral = resultado.subtotalGeneral;
    this.ivaGeneral = resultado.ivaGeneral;
    this.totalGeneral = resultado.totalGeneral;
});
const Carrito = mongoose.model('Carrito', carritoSchema);

export default Carrito;