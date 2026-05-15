import Producto from '../models/Producto.js';
import Categoria from '../models/Categoria.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

// Crear producto
const crearProducto = async (req, res) => {
    let imagenProducto = { url: null, public_id: null };
    try {
        const { nombre, descripcion, codigo, codigoBarras, precioCompra, precioVenta, tipoIVA, precioMayorista, cantidadMinimaMayorista, stock,
            stockMinimo, marca, proveedor, unidadMedida, color, material, tamanio, presentacion, destacado, categoria } = req.body;
        // Validar campos obligatorios
        if (!nombre?.trim() || !codigo?.trim() || !precioCompra || !precioVenta || stock === undefined || stockMinimo === undefined || !marca?.trim() ||
            !proveedor?.trim() || !unidadMedida?.trim() || !categoria?.trim()
        ) {
            return res.status(400).json({
                msg: 'Todos los campos obligatorios deben ser completados'
            });
        }
        // Validar código interno duplicado
        const productoCodigoExistente = await Producto.findOne({
            codigo: codigo.trim().toUpperCase()
        });
        if (productoCodigoExistente) {
            return res.status(400).json({
                msg: 'Ya existe un producto con ese código interno'
            });
        }
        // Validar código de barras duplicado
        if (codigoBarras?.trim()) {
            const productoCodigoBarrasExistente = await Producto.findOne({
                codigoBarras: codigoBarras.trim()
            });
            if (productoCodigoBarrasExistente) {
                return res.status(400).json({
                    msg: 'Ya existe un producto con ese código de barras'
                });
            }
        }
        // Validar categoría existente
        const categoriaExistente = await Categoria.findById(categoria);
        if (!categoriaExistente) {
            return res.status(404).json({ msg: 'La categoría no existe' });
        }
        // Validar categoría activa
        if (!categoriaExistente.estado) {
            return res.status(400).json({ msg: 'No se puede crear un producto en una categoría inactiva' });
        }
        // Subir imagen a Cloudinary si viene en form-data
        if (req.files?.imagen) {
            const { secure_url, public_id } = await subirImagenCloudinary(
                req.files.imagen.tempFilePath,
                'Productos'
            );
            imagenProducto = { url: secure_url, public_id };
        }
        // Crear producto
        const nuevoProducto = new Producto({
            nombre: nombre.trim(), descripcion: descripcion?.trim() || '', codigo: codigo.trim().toUpperCase(), codigoBarras: codigoBarras?.trim() || undefined,
            precioCompra: Number(precioCompra), precioVenta: Number(precioVenta), tipoIVA,
            precioMayorista: precioMayorista ? Number(precioMayorista) : undefined,
            cantidadMinimaMayorista: cantidadMinimaMayorista ? Number(cantidadMinimaMayorista) : undefined,
            stock: Number(stock), stockMinimo: Number(stockMinimo), marca: marca.trim(), proveedor: proveedor.trim(),
            unidadMedida, color: color?.trim() || '', material: material?.trim() || '', tamanio: tamanio?.trim() || '',
            presentacion: presentacion?.trim() || '', destacado: destacado || false, categoria, imagen: imagenProducto
        });
        await nuevoProducto.save();
        // Convertir a objeto y ocultar fechas
        const productoRespuesta = nuevoProducto.toObject();
        delete productoRespuesta.createdAt;
        delete productoRespuesta.updatedAt;
        return res.status(201).json({
            msg: 'Producto creado correctamente',
            producto: productoRespuesta
        });
    } catch (error) {
        // Eliminar imagen de Cloudinary si falla el guardado
        if (imagenProducto.public_id) {
            await cloudinary.uploader.destroy(imagenProducto.public_id);
        }
        // Errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: Object.values(error.errors)[0].message });
        }
        // Error por campos únicos duplicados
        if (error.code === 11000) {
            const campo = Object.keys(error.keyPattern)[0];
            const mensajes = { codigo: 'código interno', codigoBarras: 'código de barras' };
            return res.status(400).json({
                msg: `El ${mensajes[campo] || campo} ya está registrado`
            });
        }
        console.log('ERROR CREAR PRODUCTO:', error);
        return res.status(500).json({
            msg: 'Error al crear el producto', error: error.message
        });
    }
};

// Listar productos para catálogo público
const obtenerCatalogo = async (req, res) => {
    try {
        const productos = await Producto.find({ estado: true })
            .populate({
                path: 'categoria',
                match: { estado: true },
                select: 'nombre imagen'
            })
            .select('nombre descripcion precioVenta imagen stock marca unidadMedida color material tamanio presentacion destacado categoria')
            .sort({ nombre: 1 })
            .lean();
        const productosVisibles = productos.filter(producto => producto.categoria !== null);
        return res.status(200).json({
            total: productosVisibles.length,
            productos: productosVisibles
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al cargar el catálogo',
            error: error.message
        });
    }
};

// Listar productos para gestión del administrador
const obtenerGestionAdmin = async (req, res) => {
    let etapaActual = 'inicializando consulta';
    try {
        const { estado, buscar, page = 1, limit = 20 } = req.query;
        const filtro = {};
        // Filtrar por estado del producto
        if (estado !== undefined) {
            filtro.estado = estado === 'true';
        }
        // Buscar por nombre o código interno
        if (buscar?.trim()) {
            filtro.$or = [
                { nombre: { $regex: buscar.trim(), $options: 'i' } },
                { codigo: { $regex: buscar.trim(), $options: 'i' } }
            ];
        }
        // Configurar paginación
        const paginaActual = Math.max(Number(page), 1);
        const limite = Math.min(Math.max(Number(limit), 1), 50);
        const saltar = (paginaActual - 1) * limite;
        // Contar productos según filtros
        etapaActual = 'contando productos';
        const total = await Producto.countDocuments(filtro);
        // Buscar productos paginados
        etapaActual = 'buscando productos en la base de datos';
        const productos = await Producto.find(filtro)
            .populate('categoria', 'nombre estado').select('-createdAt -updatedAt -__v')
            .sort({ createdAt: -1 }).skip(saltar).limit(limite).lean();
        return res.status(200).json({
            total, paginaActual, limite,
            totalPaginas: Math.ceil(total / limite),
            productos
        });
    } catch (error) {
        console.error(`ERROR EN GESTIÓN ADMIN [${etapaActual}]:`, error);
        return res.status(500).json({
            msg: 'Error interno al cargar la gestión de productos', etapa: etapaActual, error: error.message
        });
    }
};

export {
    crearProducto, obtenerCatalogo, obtenerGestionAdmin
};