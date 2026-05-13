// Crear categoría
import Categoria from '../models/Categoria.js';
import cloudinary from '../config/cloudinary.js';


// Obtener el public_id de Cloudinary
const obtenerPublicId = (file) => file?.filename || file?.public_id;


// Crear categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        // 1. Validación previa de existencia (Evita subir imagen si el nombre ya existe)
        const nombreLimpio = nombre?.trim();
        const existeCategoria = await Categoria.findOne({
            nombre: { $regex: `^${nombreLimpio}$`, $options: 'i' }
        });
        if (existeCategoria) {
            // Si ya existe, eliminamos la imagen que multer ya subió antes de entrar aquí
            if (req.file) {
                await cloudinary.uploader.destroy(req.file.filename);
            }
            return res.status(400).json({
                msg: `La categoría "${nombreLimpio}" ya se encuentra registrada.`
            });
        }
        // 2. Validación de imagen obligatoria
        if (!req.file) {
            return res.status(400).json({
                msg: 'La imagen es obligatoria para crear una categoría'
            });
        }
        // 3. Creación del objeto
        const nuevaCategoria = new Categoria({
            nombre: nombreLimpio,
            descripcion: descripcion?.trim(),
            imagen: {
                url: req.file.path,
                public_id: req.file.filename
            }
        });
        await nuevaCategoria.save();
        // 4. Respuesta limpia
        const categoriaRespuesta = nuevaCategoria.toObject();
        delete categoriaRespuesta.createdAt;
        delete categoriaRespuesta.updatedAt;
        return res.status(201).json({
            msg: 'Categoría creada correctamente',
            categoria: categoriaRespuesta
        });
    } catch (error) {
        console.error("ERROR EN BACKEND:", error.message);
        // Limpieza de emergencia en Cloudinary si algo falló en el proceso
        if (req.file) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(500).json({
            msg: 'Hubo un error al procesar la solicitud',
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
        const categorias = await Categoria.find({
            estado: false
        }).select('-createdAt -updatedAt');
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
            const publicId = obtenerPublicId(req.file);
            if (publicId) await cloudinary.uploader.destroy(publicId);
            return res.status(404).json({
                msg: 'Categoría no encontrada'
            });
        }
        if (nombre !== undefined) {
            if (!nombre.trim()) {
                const publicId = obtenerPublicId(req.file);
                if (publicId) await cloudinary.uploader.destroy(publicId);
                return res.status(400).json({
                    msg: 'El nombre de la categoría no puede estar vacío'
                });
            }
            const nombreLimpio = nombre.trim();
            const existeCategoria = await Categoria.findOne({
                _id: { $ne: id },
                nombre: { $regex: `^${nombreLimpio}$`, $options: 'i' }
            });
            if (existeCategoria) {
                const publicId = obtenerPublicId(req.file);
                if (publicId) await cloudinary.uploader.destroy(publicId);
                return res.status(400).json({
                    msg: 'Ya existe otra categoría con ese nombre'
                });
            }
            categoria.nombre = nombreLimpio;
        }
        if (descripcion !== undefined) {
            categoria.descripcion = descripcion.trim();
        }
        const imagenAnteriorPublicId = categoria.imagen?.public_id;
        if (req.file) {
            const nuevoPublicId = obtenerPublicId(req.file);
            categoria.imagen = { url: req.file.path, public_id: nuevoPublicId };
            if (imagenAnteriorPublicId) {
                await cloudinary.uploader.destroy(imagenAnteriorPublicId);
            }
        }
        await categoria.save();
        return res.status(200).json({
            msg: 'Categoría actualizada correctamente', categoria
        });
    } catch (error) {
        console.log(error);
        const publicId = obtenerPublicId(req.file);
        if (publicId) await cloudinary.uploader.destroy(publicId);
        return res.status(500).json({
            msg: 'Error al actualizar categoría', error: error.message
        });
    }
};

export {
    crearCategoria, desactivarCategoria, listarCategoriasActivas, listarCategoriasInactivas,
    activarCategoria, actualizarCategoria
};