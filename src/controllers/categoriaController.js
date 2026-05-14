import Categoria from '../models/Categoria.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';

// Crear categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        if (!nombre?.trim()) {
            return res.status(400).json({
                msg: 'El nombre es obligatorio'
            });
        }
        if (!req.files?.imagen) {
            return res.status(400).json({
                msg: 'La imagen es obligatoria'
            });
        }
        const nombreLimpio = nombre.trim();
        const existeCategoria = await Categoria.findOne({
            nombre: {
                $regex: `^${nombreLimpio}$`,
                $options: 'i'
            }
        });
        if (existeCategoria) {
            return res.status(400).json({
                msg: 'La categoría ya existe'
            });
        }
        const { secure_url, public_id } = await subirImagenCloudinary(
            req.files.imagen.tempFilePath,
            'Categorias'
        );
        const categoria = new Categoria({
            nombre: nombreLimpio,
            descripcion: descripcion?.trim() || '',
            imagen: {
                url: secure_url,
                public_id
            }
        });
        await categoria.save();
        return res.status(201).json({
            msg: 'Categoría creada correctamente'
        });
    } catch (error) {
        console.log('ERROR CREAR CATEGORIA:', error);
        return res.status(500).json({
            msg: 'Error al crear categoría',
            error: error.message
        });
    }
};

/* Listar todas las categorías
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
*/

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
        if (categoria.estado === false) {
            return res.status(400).json({
                msg: 'La categoría ya se encuentra desactivada'
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
        if (categoria.estado === true) {
            return res.status(400).json({
                msg: 'La categoría ya se encuentra activa'
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
        // Obtener categorías inactivas ocultando fechas
        const categorias = await Categoria.find({
            estado: false
        }).select('-createdAt -updatedAt');
        // Contar total de categorías inactivas
        const total = await Categoria.countDocuments({
            estado: false
        });
        return res.status(200).json({
            total,
            categorias
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar categorías inactivas', error: error.message
        });
    }
};

export {
    crearCategoria, desactivarCategoria, listarCategoriasActivas, listarCategoriasInactivas,
    activarCategoria
};