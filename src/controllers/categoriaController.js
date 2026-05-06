// Crear categoría
import Categoria from '../models/Categoria.js';
import cloudinary from '../config/cloudinary.js';

// Crear categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        // Validar nombre y evitar espacios vacíos
        if (!nombre?.trim()) {
            return res.status(400).json({msg: 'El nombre es obligatorio'});
        }
        // Verificar si la categoría ya existe antes de subir la imagen
        const categoriaExiste = await Categoria.findOne({nombre: nombre.trim()});
        if (categoriaExiste) {
            return res.status(400).json({msg: 'La categoría ya existe'});
        }
        let imagenUrl = null;
        // Subir imagen a Cloudinary solo si viene una imagen
        if (req.file) {
            const resultado = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'categorias',
                        transformation: [{ width: 800, height: 800, crop: 'limit' },{ quality: 'auto' },{ fetch_format: 'auto' }]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                stream.end(req.file.buffer);
            });
            imagenUrl = resultado.secure_url;
        }
        // Crear categoría
        const nuevaCategoria = new Categoria({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim(),
            imagen: imagenUrl
        });
        await nuevaCategoria.save();
        return res.status(201).json({
            msg: 'Categoría creada correctamente',
            categoria: nuevaCategoria
        });
    } catch (error) {
        return res.status(500).json({msg: 'Error al crear la categoría',error: error.message
        });
    }
};

// Listar todas las categorías
const listarCategorias = async (req, res) => {
    try {
        // Obtener categorías ocultando fechas
        const categorias = await Categoria.find()
            .select('-createdAt -updatedAt');
        // Contar total de categorías
        const total = await Categoria.countDocuments();
        return res.status(200).json({
            total,categorias
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar las categorías',
            error: error.message
        });
    }
};

// Desactivar categoría
const desactivarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(404).json({
                msg: 'Categoría no encontrada'
            });
        }
        // Validar si ya está desactivada
        if (!categoria.estado) {
            return res.status(400).json({
                msg: 'La categoría ya está desactivada'
            });
        }
        categoria.estado = false;
        await categoria.save();
        return res.status(200).json({
            msg: 'Categoría desactivada correctamente',categoria
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al desactivar categoría',
            error: error.message
        });
    }
};

// Listar categorías activas, va a ser un endpoint para que todos puedan ver las categorías disponibles 
const listarCategoriasActivas = async (req, res) => {
    try {
        // Obtener categorías activas ocultando fechas
        const categorias = await Categoria.find({
            estado: true
        }).select('-createdAt -updatedAt');
        // Contar total de categorías activas
        const total = await Categoria.countDocuments({
            estado: true
        });
        return res.status(200).json({
            total,categorias
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar categorías activas',error: error.message
        });
    }
};

// Listar categorías inactivas, solo serán visibles apra el rol administrador
const listarCategoriasInactivas = async (req, res) => {
    try {
        const categorias = await Categoria.find({ estado: false });
        const total = await Categoria.countDocuments({ estado: false });
        return res.status(200).json({total,categorias});
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar categorías inactivas',
            error: error.message
        });
    }
};

export { crearCategoria, listarCategorias, desactivarCategoria, listarCategoriasActivas, listarCategoriasInactivas };