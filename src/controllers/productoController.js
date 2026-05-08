import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';
import { v2 as cloudinary } from 'cloudinary';

// Crear producto
const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, codigo, precioCompra, precioVenta, tipoIVA, precioMayorista, cantidadMinimaMayorista, stock,
            stockMinimo, marca, unidadMedida, destacado, categoria } = req.body;
        // Validar campos obligatorios
        if (
            !nombre?.trim() || !codigo?.trim() || !precioCompra || !precioVenta || stock === undefined || stockMinimo === undefined ||
            !marca?.trim() || !unidadMedida?.trim() || !categoria?.trim()
        ) {
            return res.status(400).json({
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }
        // Validar que el código no esté repetido o duplicado
        const productoExistente = await Producto.findOne({
            codigo: codigo.toUpperCase()
        });
        if (productoExistente) {
            return res.status(400).json({
                msg: 'Ya existe un producto con ese código'
            });
        }
        // Validar que la categoría exista
        const categoriaExistente = await Categoria.findById(categoria);
        if (!categoriaExistente) {
            return res.status(404).json({
                msg: 'La categoría no existe'
            });
        }
        // Validar que la categoría esté activa
        if (!categoriaExistente.estado) {
            return res.status(400).json({
                msg: 'No se puede crear un producto en una categoría inactiva'
            });
        }
        // Crear producto
        const nuevoProducto = new Producto({
            nombre: nombre.trim(), descripcion: descripcion?.trim(), codigo: codigo.toUpperCase(), precioCompra, precioVenta,
            tipoIVA, precioMayorista: precioMayorista || undefined, cantidadMinimaMayorista: cantidadMinimaMayorista || undefined,
            stock, stockMinimo, marca: marca.trim(), unidadMedida, destacado, categoria, imagen: req.file
                ? { url: req.file.path, public_id: req.file.filename } : { url: null, public_id: null }
        });
        await nuevoProducto.save();
        return res.status(201).json({
            msg: 'Producto creado correctamente', producto: nuevoProducto
        });
    } catch (error) {
        // Si falla MongoDB y ya se subió una imagen se elimina de Cloudinary
        if (req.file?.filename) {
            await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(500).json({
            msg: 'Error al crear el producto', error: error.message
        });
    }
};

export {
    crearProducto
};