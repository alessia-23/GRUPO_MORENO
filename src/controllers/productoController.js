import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';
import { subirBase64Cloudinary } from '../helpers/uploadCloudinary.js';

// Crear producto
const crearProducto = async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            codigo,
            precioCompra,
            precioVenta,
            tipoIVA,
            precioMayorista,
            cantidadMinimaMayorista,
            stock,
            stockMinimo,
            marca,
            unidadMedida,
            destacado,
            categoria,
            imagen
        } = req.body;

        // Validar campos obligatorios
        if (
            !nombre?.trim() ||
            !codigo?.trim() ||
            !precioCompra ||
            !precioVenta ||
            stock === undefined ||
            stockMinimo === undefined ||
            !marca?.trim() ||
            !unidadMedida?.trim() ||
            !categoria?.trim()
        ) {
            return res.status(400).json({
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Validar que el código no esté repetido
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

        let imagenProducto = {
            url: null,
            public_id: null
        };

        // Subir imagen solo si viene en base64
        if (imagen?.trim()) {
            const { secure_url, public_id } = await subirBase64Cloudinary(imagen, 'Productos');

            imagenProducto = {
                url: secure_url,
                public_id
            };
        }

        // Crear producto
        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion?.trim() || '',
            codigo: codigo.toUpperCase(),
            precioCompra,
            precioVenta,
            tipoIVA,
            precioMayorista: precioMayorista || undefined,
            cantidadMinimaMayorista: cantidadMinimaMayorista || undefined,
            stock,
            stockMinimo,
            marca: marca.trim(),
            unidadMedida,
            destacado,
            categoria,
            imagen: imagenProducto
        });

        await nuevoProducto.save();

        return res.status(201).json({
            msg: 'Producto creado correctamente',
            producto: nuevoProducto
        });

    } catch (error) {
        return res.status(500).json({
            msg: 'Error al crear el producto',
            error: error.message
        });
    }
};

export {
    crearProducto
};