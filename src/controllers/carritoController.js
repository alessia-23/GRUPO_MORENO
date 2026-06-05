import mongoose from 'mongoose';
import Carrito from '../models/Carrito.js';
import Producto from '../models/Producto.js';

// Obtener carrito del cliente autenticado
const obtenerCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        }).select('-__v');
        if (!carrito) {
            return res.status(200).json({
                msg: 'El carrito está vacío',
                carrito: {
                    cliente: usuarioId,
                    articulos: [],
                    subtotalGeneral: 0,
                    ivaGeneral: 0,
                    totalGeneral: 0,
                    estado: true
                }
            });
        }
        return res.status(200).json({
            msg: 'Carrito obtenido correctamente',
            carrito
        });
    } catch (error) {
        console.log('Error al obtener carrito:', error);
        return res.status(500).json({
            msg: 'Error al obtener el carrito', error: error.message
        });
    }
};

// Agregar producto al carrito del cliente autenticado
const agregarAlCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { productoId, cantidad = 1 } = req.body;
        if (!productoId) {
            return res.status(400).json({
                msg: 'El producto es obligatorio'
            });
        }
        if (!mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({
                msg: 'El ID del producto no es válido'
            });
        }
        const cantidadAgregar = Number(cantidad);
        if (!Number.isInteger(cantidadAgregar) || cantidadAgregar < 1) {
            return res.status(400).json({
                msg: 'La cantidad debe ser un número entero mayor o igual a 1'
            });
        }
        const producto = await Producto.findOne({
            _id: productoId,
            estado: true
        });
        if (!producto) {
            return res.status(404).json({
                msg: 'El producto no existe o no está disponible'
            });
        }
        let carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        });
        if (!carrito) {
            carrito = new Carrito({
                cliente: usuarioId,
                articulos: []
            });
        }
        const indiceArticulo = carrito.articulos.findIndex(
            (item) => item.producto.toString() === productoId
        );
        let cantidadFinal = cantidadAgregar;
        if (indiceArticulo !== -1) {
            cantidadFinal =
                Number(carrito.articulos[indiceArticulo].cantidad) + cantidadAgregar;
        }
        if (producto.stock < cantidadFinal) {
            return res.status(400).json({
                msg: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`
            });
        }
        let precioUnitario = producto.precioVenta;
        let tipoPrecio = 'NORMAL';
        if (
            producto.precioMayorista &&
            producto.cantidadMinimaMayorista &&
            cantidadFinal >= producto.cantidadMinimaMayorista
        ) {
            precioUnitario = producto.precioMayorista;
            tipoPrecio = 'MAYORISTA';
        }
        const porcentajeIva = producto.tipoIVA === '15%' ? 0.15 : 0;
        if (indiceArticulo !== -1) {
            carrito.articulos[indiceArticulo].cantidad = cantidadFinal;
            carrito.articulos[indiceArticulo].precioUnitario = precioUnitario;
            carrito.articulos[indiceArticulo].tipoPrecio = tipoPrecio;
            carrito.articulos[indiceArticulo].porcentajeIva = porcentajeIva;
        } else {
            carrito.articulos.push({
                producto: producto._id,
                nombreProducto: producto.nombre,
                codigo: producto.codigo,
                imagen: {
                    url: producto.imagen?.url || null,
                    public_id: producto.imagen?.public_id || null
                },
                color: producto.color || '',
                tamanio: producto.tamanio || '',
                cantidad: cantidadFinal,
                precioUnitario,
                tipoPrecio,
                porcentajeIva
            });
        }
        await carrito.save();
        return res.status(200).json({
            msg: 'Producto agregado al carrito correctamente',
            carrito: {
                _id: carrito._id,
                cliente: carrito.cliente,
                articulos: carrito.articulos,
                subtotalGeneral: carrito.subtotalGeneral,
                ivaGeneral: carrito.ivaGeneral,
                totalGeneral: carrito.totalGeneral
            }
        });
    } catch (error) {
        console.log('Error al agregar al carrito:', error);
        return res.status(500).json({
            msg: 'Error al agregar producto al carrito', error: error.message
        });
    }
};

// Actualizar cantidad
const actualizarCantidadCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { productoId } = req.params;
        const { cantidad } = req.body;
        if (!mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({
                msg: 'El ID del producto no es válido'
            });
        }
        const nuevaCantidad = Number(cantidad);
        if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 1) {
            return res.status(400).json({
                msg: 'La cantidad debe ser un número entero mayor o igual a 1'
            });
        }
        const producto = await Producto.findOne({
            _id: productoId,
            estado: true
        });
        if (!producto) {
            return res.status(404).json({
                msg: 'El producto no existe o no está disponible'
            });
        }
        if (producto.stock < nuevaCantidad) {
            return res.status(400).json({
                msg: `Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`
            });
        }
        const carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        });
        if (!carrito) {
            return res.status(404).json({
                msg: 'El carrito está vacío'
            });
        }
        const articulo = carrito.articulos.find(
            (item) => item.producto.toString() === productoId
        );
        if (!articulo) {
            return res.status(404).json({
                msg: 'El producto no está en el carrito'
            });
        }
        let precioUnitario = producto.precioVenta;
        let tipoPrecio = 'NORMAL';
        if (
            producto.precioMayorista &&
            producto.cantidadMinimaMayorista &&
            nuevaCantidad >= producto.cantidadMinimaMayorista
        ) {
            precioUnitario = producto.precioMayorista;
            tipoPrecio = 'MAYORISTA';
        }
        articulo.cantidad = nuevaCantidad;
        articulo.precioUnitario = precioUnitario;
        articulo.tipoPrecio = tipoPrecio;
        articulo.porcentajeIva = producto.tipoIVA === '15%' ? 0.15 : 0;
        await carrito.save();
        return res.status(200).json({
            msg: 'Cantidad actualizada correctamente',
            carrito: {
                _id: carrito._id,
                cliente: carrito.cliente,
                articulos: carrito.articulos,
                subtotalGeneral: carrito.subtotalGeneral,
                ivaGeneral: carrito.ivaGeneral,
                totalGeneral: carrito.totalGeneral
            }
        });
    } catch (error) {
        console.log('Error al actualizar cantidad:', error);
        return res.status(500).json({
            msg: 'Error al actualizar cantidad', error: error.message
        });
    }
};

// Eliminar producto del carrito
const eliminarProductoCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { productoId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(productoId)) {
            return res.status(400).json({
                msg: 'El ID del producto no es válido'
            });
        }
        const carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        });
        if (!carrito) {
            return res.status(404).json({
                msg: 'El carrito está vacío'
            });
        }
        const cantidadAntes = carrito.articulos.length;
        carrito.articulos = carrito.articulos.filter(
            (item) => item.producto.toString() !== productoId
        );
        if (carrito.articulos.length === cantidadAntes) {
            return res.status(404).json({
                msg: 'El producto no está en el carrito'
            });
        }
        await carrito.save();
        return res.status(200).json({
            msg: 'Producto eliminado del carrito correctamente',
            carrito: {
                _id: carrito._id,
                cliente: carrito.cliente,
                articulos: carrito.articulos,
                subtotalGeneral: carrito.subtotalGeneral,
                ivaGeneral: carrito.ivaGeneral,
                totalGeneral: carrito.totalGeneral
            }
        });
    } catch (error) {
        console.log('Error al eliminar producto del carrito:', error);
        return res.status(500).json({
            msg: 'Error al eliminar producto del carrito',
            error: error.message
        });
    }
};


// Vaciar carrito
const vaciarCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        });
        if (!carrito) {
            return res.status(404).json({
                msg: 'El carrito ya está vacío'
            });
        }
        carrito.articulos = [];
        await carrito.save();
        return res.status(200).json({
            msg: 'Carrito vaciado correctamente',
            carrito: {
                _id: carrito._id,
                cliente: carrito.cliente,
                articulos: carrito.articulos,
                subtotalGeneral: carrito.subtotalGeneral,
                ivaGeneral: carrito.ivaGeneral,
                totalGeneral: carrito.totalGeneral
            }
        });
    } catch (error) {
        console.log('Error al vaciar carrito:', error);
        return res.status(500).json({
            msg: 'Error al vaciar carrito',
            error: error.message
        });
    }
};
export {
    obtenerCarrito, agregarAlCarrito, actualizarCantidadCarrito, eliminarProductoCarrito, vaciarCarrito
};