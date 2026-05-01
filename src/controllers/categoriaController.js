import Categoria from '../models/Categoria.js';

// Crear categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;
        // Validar nombre
        if (!nombre) {
            return res.status(400).json({
                msg: 'El nombre es obligatorio'
            });
        }
        // Verificar si ya existe para evitar duplicados
        const categoriaExiste = await Categoria.findOne({ nombre });
        if (categoriaExiste) {
            return res.status(400).json({
                msg: 'La categoría ya existe'
            });
        }
        // Crear categoría
        const nuevaCategoria = new Categoria({nombre,descripcion});
        await nuevaCategoria.save();
        return res.status(201).json({
            msg: 'Categoría creada correctamente',
            categoria: nuevaCategoria
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al crear la categoría',
            error: error.message
        });
    }
};

// Listar todas las categorías
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find();
        const total = await Categoria.countDocuments();
        return res.status(200).json({total,categorias});
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al listar las categorías',
            error: error.message
        });
    }
};

export { crearCategoria, listarCategorias };