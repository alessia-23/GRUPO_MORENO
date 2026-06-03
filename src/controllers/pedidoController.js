import Pedido from '../models/Pedido.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

// Crear pedido por foto/lista
const crearPedido = async (req, res) => {
    let imagenPedido = { url: null, public_id: null };
    try {
        const clienteId = req.usuario.id;
        if (req.usuario.rol !== 'CLIENTE') {
            return res.status(403).json({
                msg: 'Solo los clientes pueden crear pedidos'
            });
        }
        const { ciudad, direccion, referencia, telefono, observaciones
        } = req.body;
        if (!req.files?.imagen) {
            return res.status(400).json({
                msg: 'Debe subir la imagen de la lista'
            });
        }
        if (!ciudad?.trim() || !direccion?.trim() || !telefono?.trim()) {
            return res.status(400).json({
                msg: 'La ciudad, dirección y teléfono son obligatorios'
            });
        }
        const archivo = req.files.imagen;
        const formatosPermitidos = [
            'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!formatosPermitidos.includes(archivo.mimetype)) {
            return res.status(400).json({
                msg: 'Solo se permiten imágenes PNG, JPG, JPEG y WEBP'
            });
        }
        const pesoMaximo = 5 * 1024 * 1024;
        if (archivo.size > pesoMaximo) {
            return res.status(400).json({
                msg: 'La imagen supera el tamaño máximo permitido de 5MB'
            });
        }
        const { secure_url, public_id } = await subirImagenCloudinary(
            archivo.tempFilePath,
            'pedidos'
        );
        imagenPedido = {
            url: secure_url, public_id
        };
        const pedido = new Pedido({
            cliente: clienteId,
            listaCliente: imagenPedido,
            direccionEntrega: {
                ciudad: ciudad.trim(), direccion: direccion.trim(),
                referencia: referencia?.trim() || '', telefono: telefono.trim()
            },
            observaciones: observaciones?.trim() || ''
        });
        await pedido.save();
        return res.status(201).json({
            msg: 'Pedido enviado correctamente al muro de vendedores', pedido
        });
    } catch (error) {
        if (imagenPedido.public_id) {
            await cloudinary.uploader.destroy(imagenPedido.public_id);
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }
        console.log('ERROR CREAR PEDIDO:', error);
        return res.status(500).json({
            msg: 'Error al crear el pedido', error: error.message
        });
    }
};


// Listar pedidos pendientes
const obtenerPedidosPendientes = async (req, res) => {
    try {
        // Solo vendedores pueden ver el muro
        if (req.usuario.rol !== 'VENDEDOR') {
            return res.status(403).json({
                msg: 'No tienes permisos para ver los pedidos pendientes'
            });
        }
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 15, 1), 50);
        const desde = (page - 1) * limit;
        const filtro = {
            estado: 'PENDIENTE', vendedor: null
        };
        const [total, pedidos] = await Promise.all([
            Pedido.countDocuments(filtro),
            Pedido.find(filtro)
                .populate({
                    path: 'cliente',
                    select: 'email perfilId perfilModelo',
                    populate: {
                        path: 'perfilId',
                        select: 'nombre apellido'
                    }
                })
                .select('cliente listaCliente direccionEntrega estado observaciones createdAt')
                .sort({ createdAt: -1 })
                .skip(desde)
                .limit(limit)
                .lean()
        ]);
        return res.status(200).json({
            total, paginaActual: page, totalPaginas: Math.ceil(total / limit),
            limite: limit, pedidos
        });
    } catch (error) {
        console.log('ERROR LISTAR PEDIDOS PENDIENTES:', error);
        return res.status(500).json({
            msg: 'Error al listar pedidos pendientes', error: error.message
        });
    }
};

export {
    crearPedido, obtenerPedidosPendientes
};