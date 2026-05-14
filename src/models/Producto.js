import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
    },
    codigo: {
        type: String,
        required: [true, 'El código interno del producto es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true
    },
    codigoBarras: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    precioCompra: {
        type: Number,
        required: [true, 'El precio de compra es obligatorio'],
        min: [0.01, 'El precio de compra debe ser mayor a 0']
    },
    precioVenta: {
        type: Number,
        required: [true, 'El precio de venta es obligatorio'],
        min: [0.01, 'El precio de venta debe ser mayor a 0'],
        validate: {
            validator: function (valor) {
                return valor > this.precioCompra;
            },
            message: 'El precio de venta debe ser mayor al precio de compra'
        }
    },
    tipoIVA: {
        type: String,
        enum: ['15%', '0%', 'Exento'],
        default: '15%'
    },
    precioMayorista: {
        type: Number,
        min: [0.01, 'El precio mayorista debe ser mayor a 0'],
        validate: {
            validator: function (valor) {
                if (valor === undefined || valor === null) {
                    return true;
                }
                return valor > this.precioCompra && valor < this.precioVenta;
            },
            message: 'El precio mayorista debe ser mayor al precio de compra y menor al precio de venta'
        }
    },
    cantidadMinimaMayorista: {
        type: Number,
        min: [1, 'La cantidad mínima mayorista debe ser al menos 1']
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser un valor negativo'],
        default: 0
    },
    stockMinimo: {
        type: Number,
        required: [true, 'El stock mínimo es obligatorio'],
        min: [0, 'El stock mínimo no puede ser negativo'],
        default: 5
    },
    marca: {
        type: String,
        trim: true,
        required: [true, 'La marca es obligatoria']
    },
    proveedor: {
        type: String,
        required: [true, 'El proveedor es obligatorio'],
        trim: true
    },
    unidadMedida: {
        type: String,
        required: [true, 'La unidad de medida es obligatoria'],
        enum: ['Unidad', 'Caja', 'Litro', 'Kilogramo', 'Paquete'],
        default: 'Unidad'
    },
    color: {
        type: String,
        trim: true
    },
    material: {
        type: String,
        trim: true
    },
    tamanio: {
        type: String,
        trim: true
    },
    presentacion: {
        type: String,
        trim: true
    },
    imagen: {
        url: String,
        public_id: String
    },
    destacado: {
        type: Boolean,
        default: false
    },
    estado: {
        type: Boolean,
        default: true
    },
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categorias',
        required: [true, 'La categoría es obligatoria']
    }
}, {
    timestamps: true,
    versionKey: false,
    collection: 'Productos'
});

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;