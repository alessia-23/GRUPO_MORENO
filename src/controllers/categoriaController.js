// Crear categoría
import Categoria from '../models/Categoria.js';
import cloudinary from '../config/cloudinary.js';

// Crear categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        // Validar imagen
        if (!req.file) {
            return res.status(400).json({
                msg: 'La imagen es obligatoria'
            });
        }
        // Verificar si ya existe la categoría
        const existeCategoria = await Categoria.findOne({
            nombre: nombre.trim()
        });
        // Si existe, borrar imagen subida y retornar error
        if (existeCategoria) {
            await cloudinary.uploader.destroy(req.file.filename);
            return res.status(400).json({
                msg: 'La categoría ya existe'
            });
        }
        const categoria = new Categoria({
            nombre: nombre.trim(),
            descripcion,
            imagen: {
                url: req.file.path,
                public_id: req.file.filename
            }
        });
        await categoria.save();
        return res.status(201).json({
            msg: 'Categoría creada correctamente'
        });
    } catch (error) {
        // Si algo falla, borrar imagen subida
        if (req.file?.filename) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(500).json({
            msg: 'Error al crear categoría',
            error: error.message
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
            total, categorias
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
        categoria.estado = false;
        await categoria.save();
        return res.status(200).json({
            msg: 'Categoría desactivada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al desactivar categoría', error: error.message
        });
    }
};

// Activar categoría
const activarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(404).json({
                msg: 'Categoría no encontrada'
            });
        }
        categoria.estado = true;
        await categoria.save();
        return res.status(200).json({
            msg: 'Categoría activada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al activar categoría', error: error.message
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
            total, categorias
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar categorías activas', error: error.message
        });
    }
};

// Listar categorías inactivas, solo serán visibles para el rol administrador
const listarCategoriasInactivas = async (req, res) => {
    try {
        const categorias = await Categoria.find({
            estado: false
        });
        return res.status(200).json({
            categorias
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar categorías inactivas', error: error.message
        });
    }
};

// Actualizar categoría
const actualizarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        const categoria = await Categoria.findById(id);
        if (!categoria) {
            return res.status(404).json({
                msg: 'Categoría no encontrada'
            });
        }
        categoria.nombre = nombre || categoria.nombre;
        categoria.descripcion = descripcion || categoria.descripcion;
        if (req.file) {
            //console.log('IMAGEN ANTERIOR:', categoria.imagen);
            //console.log('NUEVA IMAGEN:', req.file);
            if (categoria.imagen?.public_id) {
                const resultado = await cloudinary.uploader.destroy(categoria.imagen.public_id);
                console.log('RESULTADO DESTROY:', resultado);
            }
            categoria.imagen = {
                url: req.file.path,
                public_id: req.file.filename
            };
        }
        await categoria.save();
        return res.status(200).json({
            msg: 'Categoría actualizada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al actualizar categoría',
            error: error.message
        });
    }
};

export {
    crearCategoria, listarCategorias, desactivarCategoria, listarCategoriasActivas, listarCategoriasInactivas,
    activarCategoria, actualizarCategoria
};