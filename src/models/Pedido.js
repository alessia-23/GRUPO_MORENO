import mongoose from 'mongoose';
import validarIdentificacion from '../helpers/validarIdentificacion.js';

const pedidoSchema = new mongoose.Schema({
    // Cliente que creó el pedido
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El cliente es obligatorio']
    },
    // Vendedor que toma el pedido
    vendedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        default: null
    },
    // Nombre visible del pedido
    nombrePedido: {
        type: String,
        required: [true, 'El nombre del pedido es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
        maxlength: [60, 'El nombre no puede exceder los 60 caracteres']
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
    // Datos para facturación
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
                    // Debe empezar con 09 y tener 10 dígitos
                    if (!/^09\d{8}$/.test(v)) {
                        return false;
                    }
                    // Evita números repetidos 
                    if (/^(\d)\1{9}$/.test(v)) {
                        return false;
                    }
                    return true;
                },
                message: 'Ingrese un número celular válido'
            }
        }
    },
    // Tipo de entrega seleccionado por el cliente
    tipoEntrega: {
        type: String,
        enum: ['RETIRO_LOCAL', 'ENVIO_DOMICILIO'],
        required: [true, 'El tipo de entrega es obligatorio']
    },
    // Solo aplica cuando es envío a domicilio
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
    // Estado operativo del pedido
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
    // Comentarios adicionales del cliente
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
// Validar dirección cuando es envío a domicilio
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
});

const Pedido = mongoose.model('Pedido', pedidoSchema);

export default Pedido;