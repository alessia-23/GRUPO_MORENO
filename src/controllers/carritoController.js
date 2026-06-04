import Carrito from '../models/Carrito.js';

// Obtener carrito del cliente autenticado
const obtenerCarrito = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const carrito = await Carrito.findOne({
            cliente: usuarioId,
            estado: true
        })
            .populate(
                'articulos.producto',
                'nombre codigo precioVenta precioMayorista cantidadMinimaMayorista tipoIVA stock imagen color tamanio estado'
            )
            .select('-__v');
        if (!carrito) {
            return res.status(200).json({
                msg: 'El carrito está vacío',
                carrito: {
                    cliente: usuarioId,
                    articulos: [],
                    subtotalGeneral: 0,
                    ivaGeneral: 0,
                    totalGeneral: 0
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
            msg: 'Error al obtener el carrito',
            error: error.message
        });
    }
};

export {
    obtenerCarrito
};