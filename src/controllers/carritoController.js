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
        const {
            productoId,
            cantidad = 1,
            color
        } = req.body;
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
        const coloresDisponibles = Array.isArray(producto.color)
            ? producto.color
            : [];
        let colorSeleccionado = '';
        if (coloresDisponibles.length > 0) {
            if (!color?.trim()) {
                return res.status(400).json({
                    msg: 'Debe seleccionar un color para este producto'
                });
            }
            colorSeleccionado = color.trim();
            const colorExiste = coloresDisponibles.some(
                (colorProducto) =>
                    colorProducto.toLowerCase() === colorSeleccionado.toLowerCase()
            );
            if (!colorExiste) {
                return res.status(400).json({
                    msg: 'El color seleccionado no está disponible para este producto'
                });
            }
            const colorReal = coloresDisponibles.find(
                (colorProducto) =>
                    colorProducto.toLowerCase() === colorSeleccionado.toLowerCase()
            );
            colorSeleccionado = colorReal;
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
            (item) =>
                item.producto.toString() === productoId &&
                item.color === colorSeleccionado
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
                color: colorSeleccionado,
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

export {
    obtenerCarrito,
    agregarAlCarrito
};