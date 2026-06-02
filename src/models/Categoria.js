import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        trim: true,
        unique: true,
        minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
        maxlength: [30, 'El nombre debe tener máximo 30 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [70, 'La descripción debe tener máximo 70 caracteres']
    },
    imagen: {
        url: {
            type: String,
            trim: true
        },
        public_id: {
            type: String,
            trim: true
        }
    },
    estado: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
        versionKey: false,
        collection: 'Categorias'
    });

const Categoria = mongoose.model('Categorias', categoriaSchema);

export default Categoria;