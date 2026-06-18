import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
        maxlength: [40, 'El nombre no puede exceder los 40 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [80, 'La descripción no puede exceder los 80 caracteres']
    },
    codigo: {
        type: String,
        required: [true, 'El código interno del producto es obligatorio'],
        unique: true,
        trim: true,
        uppercase: true,
        minlength: [3, 'El código debe tener mínimo 3 caracteres'],
        maxlength: [10, 'El código no puede exceder los 10 caracteres'],
        match: [/^[A-Z0-9-]+$/, 'El código solo puede contener letras, números y guiones']
    },
    codigoBarras: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        match: [/^\d{8,14}$/, 'El código de barras debe tener entre 8 y 14 dígitos']
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
        min: [1, 'La cantidad mínima mayorista debe ser al menos 1'],
        validate: {
            validator: function (valor) {
                if (valor === undefined || valor === null) return true;
                return Number.isInteger(valor);
            },
            message: 'La cantidad mínima mayorista debe ser un número entero'
        }
    },
    stock: {
        type: Number,
        required: [true, 'El stock es obligatorio'],
        min: [0, 'El stock no puede ser un valor negativo'],
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: 'El stock debe ser un número entero'
        }
    },
    stockMinimo: {
        type: Number,
        required: [true, 'El stock mínimo es obligatorio'],
        min: [0, 'El stock mínimo no puede ser negativo'],
        default: 5,
        validate: {
            validator: Number.isInteger,
            message: 'El stock mínimo debe ser un número entero'
        }
    },
    alertaStockEnviada: {
        type: Boolean,
        default: false
    },
    marca: {
        type: String,
        trim: true,
        required: [true, 'La marca es obligatoria'],
        minlength: [2, 'La marca debe tener mínimo 2 caracteres'],
        maxlength: [20, 'La marca debe tener máximo 20 caracteres']
    },
    proveedor: {
        type: String,
        required: [true, 'El proveedor es obligatorio'],
        trim: true,
        minlength: [2, 'El proveedor debe tener mínimo 2 caracteres'],
        maxlength: [40, 'El proveedor debe tener máximo 40 caracteres']
    },
    unidadMedida: {
        type: String,
        required: [true, 'La unidad de medida es obligatoria'],
        enum: ['Unidad', 'Caja', 'Litro', 'Kilogramo', 'Paquete'],
        default: 'Unidad'
    },
    color: {
        type: String,
        trim: true,
        maxlength: [20, 'El color no puede exceder 20 caracteres']
    },
    material: {
        type: String,
        trim: true,
        maxlength: [30, 'El material no puede exceder 30 caracteres']
    },
    tamanio: {
        type: String,
        trim: true,
        maxlength: [15, 'El tamaño no puede exceder 15 caracteres']
    },
    presentacion: {
        type: String,
        trim: true,
        maxlength: [20, 'La presentación no puede exceder 20 caracteres']
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