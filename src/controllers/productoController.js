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
            presentacion: presentacion?.trim() || '', destacado: destacado === 'true' || destacado === true, categoria, imagen: imagenProducto
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

/*Listar productos para catálogo público
const obtenerCatalogo = async (req, res) => {
    try {
        // Cantidad máxima de productos destacados visibles
        const limiteDestacados = 16;
        // Obtener productos activos y marcados como destacados
        const productos = await Producto.find({
            estado: true, destacado: true
        })
            .populate({
                path: 'categoria',
                match: { estado: true }, // Solo categorías activas
                select: 'nombre imagen'
            })
            .select(
                'nombre descripcion precioVenta imagen stock marca unidadMedida color material tamanio presentacion destacado categoria'
            )
            .sort({ nombre: 1 }).lean();
        // Ocultar productos cuya categoría fue desactivada
        const productosVisibles = productos.filter(
            producto => producto.categoria !== null
        );
        // Limitar cantidad final que se veran en el catálogo principal
        const destacadosFinales = productosVisibles.slice(0, limiteDestacados);
        return res.status(200).json({
            totalProductos: destacadosFinales.length, productos: destacadosFinales
        });
    } catch (error) {
        console.error('Error catalogo publico:', error);
        return res.status(500).json({
            msg: 'Error al cargar el catálogo público', error: error.message
        });
    }
};
*/
// Listar productos para gestión del vendedor
const obtenerGestionVende = async (req, res) => {
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

// Actualizar producto
const actualizarProducto = async (req, res) => {
    const { id } = req.params;
    let etapaActual = 'buscando producto existente';
    let nuevaImagenPublicId = null;
    let publicIdBorrar = null;
    try {
        // Buscar producto
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({
                msg: 'Producto no encontrado'
            });
        }
        const { nombre, descripcion, codigo, codigoBarras, precioCompra, precioVenta, tipoIVA, precioMayorista, cantidadMinimaMayorista,
            stock, stockMinimo, marca, proveedor, unidadMedida, color, material, tamanio, presentacion, destacado, categoria } = req.body;
        // Validar categoría
        if (categoria && categoria !== producto.categoria.toString()) {
            etapaActual = 'validando nueva categoría';
            const categoriaExiste = await Categoria.findById(categoria);
            if (!categoriaExiste) {
                return res.status(404).json({
                    msg: 'La categoría asignada no existe'
                });
            }
            if (!categoriaExiste.estado) {
                return res.status(400).json({
                    msg: 'No se puede asignar una categoría inactiva'
                });
            }
            producto.categoria = categoria;
        }
        // Validar código interno
        if (codigo !== undefined) {
            const codigoNorm = codigo.trim().toUpperCase();
            if (codigoNorm && codigoNorm !== producto.codigo) {
                etapaActual = 'validando duplicidad de código interno';
                const existeCodigo = await Producto.findOne({
                    codigo: codigoNorm,
                    _id: { $ne: id }
                });
                if (existeCodigo) {
                    return res.status(400).json({
                        msg: 'El nuevo código interno ya está registrado'
                    });
                }
                producto.codigo = codigoNorm;
            }
        }
        // Validar código de barras
        if (codigoBarras !== undefined) {
            etapaActual = 'validando código de barras';
            const codigoBarrasNorm = codigoBarras.trim() === ''
                ? undefined
                : codigoBarras.trim();
            if (codigoBarrasNorm && codigoBarrasNorm !== producto.codigoBarras) {
                const existeCodigoBarras = await Producto.findOne({
                    codigoBarras: codigoBarrasNorm,
                    _id: { $ne: id }
                });
                if (existeCodigoBarras) {
                    return res.status(400).json({
                        msg: 'Este código de barras ya lo tiene otro producto'
                    });
                }
            }
            producto.codigoBarras = codigoBarrasNorm;
        }
        // Subir nueva imagen a Cloudinary
        if (req.files?.imagen) {
            etapaActual = 'subiendo nueva imagen a Cloudinary';
            const { secure_url, public_id } = await subirImagenCloudinary(
                req.files.imagen.tempFilePath,
                'Productos'
            );
            nuevaImagenPublicId = public_id;
            if (producto.imagen?.public_id) {
                publicIdBorrar = producto.imagen.public_id;
            }
            producto.imagen = {
                url: secure_url,
                public_id
            };
        }
        // Asignar valores finales
        etapaActual = 'asignando valores finales';
        if (nombre !== undefined) producto.nombre = nombre.trim();
        if (descripcion !== undefined) producto.descripcion = descripcion.trim();
        if (precioCompra !== undefined) producto.precioCompra = Number(precioCompra);
        if (precioVenta !== undefined) producto.precioVenta = Number(precioVenta);
        if (tipoIVA !== undefined) producto.tipoIVA = tipoIVA;
        if (precioMayorista !== undefined) producto.precioMayorista = Number(precioMayorista);
        if (cantidadMinimaMayorista !== undefined) producto.cantidadMinimaMayorista = Number(cantidadMinimaMayorista);
        if (stock !== undefined) producto.stock = Number(stock);
        if (stockMinimo !== undefined) producto.stockMinimo = Number(stockMinimo);
        if (marca !== undefined) producto.marca = marca.trim();
        if (proveedor !== undefined) producto.proveedor = proveedor.trim();
        if (unidadMedida !== undefined) producto.unidadMedida = unidadMedida;
        if (color !== undefined) producto.color = color.trim();
        if (material !== undefined) producto.material = material.trim();
        if (tamanio !== undefined) producto.tamanio = tamanio.trim();
        if (presentacion !== undefined) producto.presentacion = presentacion.trim();
        if (destacado !== undefined) {
            producto.destacado = destacado === 'true' || destacado === true;
        }
        // Guardar cambios en MongoDB
        etapaActual = 'guardando cambios en base de datos';
        await producto.save();
        // Si todo salió bien, borrar imagen anterior
        if (publicIdBorrar) {
            etapaActual = 'eliminando imagen anterior de Cloudinary';
            await cloudinary.uploader.destroy(publicIdBorrar);
        }
        return res.status(200).json({
            msg: 'Producto actualizado correctamente'
        });
    } catch (error) {
        console.error(`ERROR AL EDITAR PRODUCTO [${etapaActual}]:`, error);
        // Si se subió una imagen nueva pero falló el proceso, se elimina
        if (nuevaImagenPublicId) {
            await cloudinary.uploader.destroy(nuevaImagenPublicId);
        }
        return res.status(500).json({
            msg: 'Error interno al actualizar el producto',
            etapa: etapaActual,
            error: error.message
        });
    }
};

// Desactivar producto
const desactivarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({
                msg: 'Producto no encontrado'
            });
        }
        if (producto.estado === false) {
            return res.status(400).json({
                msg: 'El producto ya se encuentra desactivado'
            });
        }
        producto.estado = false;
        await producto.save();
        return res.status(200).json({
            msg: 'Producto desactivado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al desactivar el producto', error: error.message
        });
    }
};

// Activar producto 
const activarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({
                msg: 'Producto no encontrado'
            });
        }
        // Validar si ya está activo
        if (producto.estado) {
            return res.status(400).json({
                msg: 'El producto ya se encuentra activo'
            });
        }
        // Validar categoría activa
        const categoria = await Categoria.findById(producto.categoria);
        if (!categoria || !categoria.estado) {
            return res.status(400).json({
                msg: 'No se puede activar el producto porque su categoría está inactiva'
            });
        }
        producto.estado = true;
        await producto.save();
        return res.status(200).json({
            msg: 'Producto activado correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error al activar el producto', error: error.message
        });
    }
};


// Explorar productos de manera pública con filtros de búsqueda, categoría, marca y destacados, con paginación
const todosProductos = async (req, res) => {
    let etapaActual = 'inicializando exploración de productos';
    try {
        const {
            categoria,
            buscar,
            marca,
            destacado,
            page = 1,
            limit = 20
        } = req.query;
        const filtro = { estado: true };
        etapaActual = 'revisando categorías activas';
        if (categoria?.trim()) {
            const categoriaExiste = await Categoria.findOne({
                _id: categoria.trim(),
                estado: true
            });
            if (!categoriaExiste) {
                return res.status(404).json({
                    msg: 'La categoría seleccionada no existe o está inactiva'
                });
            }
            filtro.categoria = categoria.trim();
        } else {
            const categoriasActivas = await Categoria.find({
                estado: true
            }).select('_id');
            const idsCategoriasActivas = categoriasActivas.map(
                categoria => categoria._id
            );
            filtro.categoria = { $in: idsCategoriasActivas };
        }
        if (buscar?.trim()) {
            filtro.nombre = { $regex: buscar.trim(), $options: 'i' };
        }
        if (marca?.trim()) {
            filtro.marca = { $regex: marca.trim(), $options: 'i' };
        }
        if (destacado !== undefined) {
            filtro.destacado = destacado === 'true';
        }
        const paginaActual = Math.max(Number(page), 1);
        const limite = Math.min(
            Math.max(Number(limit), 1),
            50
        );
        const saltar = (paginaActual - 1) * limite;
        etapaActual = 'consultando productos';
        const [totalProductos, productos] = await Promise.all([
            Producto.countDocuments(filtro),
            Producto.find(filtro)
                .populate({
                    path: 'categoria',
                    select: 'nombre imagen'
                })
                .select(`
                    nombre
                    descripcion
                    precioVenta
                    precioMayorista
                    cantidadMinimaMayorista
                    imagen
                    stock
                    marca
                    unidadMedida
                    color
                    material
                    tamanio
                    presentacion
                    destacado
                    categoria
                `)
                .sort(
                    destacado === 'true'
                        ? { nombre: 1 }
                        : { createdAt: -1 }
                )
                .skip(saltar)
                .limit(limite)
                .lean()
        ]);
        return res.status(200).json({
            totalProductos,
            totalEnPagina: productos.length,
            paginaActual,
            limite,
            totalPaginas: Math.ceil(totalProductos / limite),
            productos
        });
    } catch (error) {
        console.error(`ERROR EXPLORAR PRODUCTOS [${etapaActual}]:`, error);
        return res.status(500).json({
            msg: 'Error al explorar productos',
            etapa: etapaActual,
            error: error.message
        });
    }
};

export {
    crearProducto, obtenerGestionVende, actualizarProducto, desactivarProducto, activarProducto, todosProductos
};