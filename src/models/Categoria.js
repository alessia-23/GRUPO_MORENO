import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre de la categoría es obligatorio'],
        trim: true,
        unique: true,
        minlength: [3, 'El nombre debe tener mínimo 3 caracteres'],
        maxlength: [50, 'El nombre debe tener máximo 50 caracteres']
    },
    descripcion: {
        type: String,
        trim: true,
        maxlength: [200, 'La descripción debe tener máximo 200 caracteres']
    },
    imagen: {
        type: String,
        default: null
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