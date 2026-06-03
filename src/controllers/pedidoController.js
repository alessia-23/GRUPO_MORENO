import Pedido from '../models/Pedido.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Crear pedido por foto/lista enviada por el cliente
const crearPedidoPorFoto = async (req, res) => {
    let imagenPedido = { url: null, public_id: null };
    try {
        const clienteId = req.usuario.id;
        const {
            nombrePedido, nombreCompleto, identificacion, correo, telefono, tipoEntrega, ciudad, direccion,
            referencia, observaciones
        } = req.body;
        if (!req.files?.imagen) {
            return res.status(400).json({
                msg: 'Debe subir la imagen de la lista'
            });
        }
        if (!nombrePedido?.trim()) {
            return res.status(400).json({
                msg: 'El nombre del pedido es obligatorio'
            });
        }
        if (
            !nombreCompleto?.trim() || !identificacion?.trim() || !correo?.trim() || !telefono?.trim()
        ) {
            return res.status(400).json({
                msg: 'Los datos de facturación son obligatorios'
            });
        }
        if (!tipoEntrega?.trim()) {
            return res.status(400).json({
                msg: 'El tipo de entrega es obligatorio'
            });
        }
        if (!['RETIRO_LOCAL', 'ENVIO_DOMICILIO'].includes(tipoEntrega)) {
            return res.status(400).json({
                msg: 'El tipo de entrega no es válido'
            });
        }
        if (tipoEntrega === 'ENVIO_DOMICILIO') {
            if (!ciudad?.trim() || !direccion?.trim()) {
                return res.status(400).json({
                    msg: 'La ciudad y dirección son obligatorias para envío a domicilio'
                });
            }
        }
        const archivo = req.files.imagen;
        const formatosPermitidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
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
            archivo.tempFilePath, 'pedidos'
        );
        imagenPedido = {
            url: secure_url, public_id
        };
        const pedido = new Pedido({
            cliente: clienteId,
            tipoPedido: 'FOTO_LISTA',
            nombrePedido: nombrePedido.trim(),
            listaCliente: imagenPedido,
            datosFacturacion: {
                nombreCompleto: nombreCompleto.trim(),
                identificacion: identificacion.trim(),
                correo: correo.trim(),
                telefono: telefono.trim()
            },
            tipoEntrega,
            direccionEntrega: tipoEntrega === 'ENVIO_DOMICILIO'
                ? {
                    ciudad: ciudad.trim(),
                    direccion: direccion.trim(),
                    referencia: referencia?.trim() || ''
                }
                : undefined,
            observaciones: observaciones?.trim() || ''
        });
        await pedido.save();
        return res.status(201).json({
            msg: 'Pedido por foto enviado correctamente al muro de vendedores',
            pedido
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
        console.log('ERROR CREAR PEDIDO POR FOTO:', error);
        return res.status(500).json({
            msg: 'Error al crear el pedido por foto',
            error: error.message
        });
    }
};

// Listar pedidos pendientes para el muro de vendedores
const obtenerPedidosPendientes = async (req, res) => {
    try {
        const {
            page = 1, limit = 10, tipoPedido, tipoEntrega
        } = req.query;
        const paginaActual = Math.max(Number(page), 1);
        const limite = Math.max(Number(limit), 1);
        const desde = (paginaActual - 1) * limite;
        const filtro = {
            estado: 'PENDIENTE', vendedor: null
        };
        // Filtro opcional: FOTO_LISTA o CARRITO
        if (tipoPedido) {
            if (!['FOTO_LISTA', 'CARRITO'].includes(tipoPedido)) {
                return res.status(400).json({
                    msg: 'El tipo de pedido no es válido'
                });
            }
            filtro.tipoPedido = tipoPedido;
        }
        // Filtro opcional: RETIRO_LOCAL o ENVIO_DOMICILIO
        if (tipoEntrega) {
            if (!['RETIRO_LOCAL', 'ENVIO_DOMICILIO'].includes(tipoEntrega)) {
                return res.status(400).json({
                    msg: 'El tipo de entrega no es válido'
                });
            }
            filtro.tipoEntrega = tipoEntrega;
        }
        const [total, pedidos] = await Promise.all([
            Pedido.countDocuments(filtro),
            Pedido.find(filtro)
                .populate({
                    path: 'cliente', select: 'email perfilId perfilModelo',
                    populate: {
                        path: 'perfilId', select: 'nombre apellido'
                    }
                })
                .select(
                    'cliente tipoPedido nombrePedido listaCliente articulos tipoEntrega direccionEntrega estado observaciones createdAt'
                )
                .sort({ createdAt: -1 }).skip(desde).limit(limite).lean()
        ]);
        return res.status(200).json({
            total, paginaActual, totalPaginas: Math.ceil(total / limite),
            limite, pedidos
        });
    } catch (error) {
        console.log('ERROR LISTAR PEDIDOS PENDIENTES:', error);
        return res.status(500).json({
            msg: 'Error al listar pedidos pendientes', error: error.message
        });
    }
};

// Aceptar un pedido del muro
const aceptarPedido = async (req, res) => {
    try {
        const { id } = req.params;
        // Validar que el ID tenga formato correcto de MongoDB
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        // Buscar un pedido que siga disponible en el muro
        const pedido = await Pedido.findOneAndUpdate(
            {
                _id: id,estado: 'PENDIENTE',vendedor: null
            },
            {
                // El vendedor actual toma el pedido
                vendedor: req.usuario.id,
                estado: 'EN_PROCESO'
            },
            {new: true}
        )
            .populate({
                path: 'cliente',
                select: 'email perfilId perfilModelo',
                populate: {
                    path: 'perfilId',select: 'nombre apellido'
                }
            })
            .select(
                'cliente vendedor tipoPedido nombrePedido listaCliente articulos tipoEntrega direccionEntrega estado observaciones createdAt updatedAt'
            );
        // Si no existe, ya fue tomado, cancelado o no está pendiente
        if (!pedido) {
            return res.status(400).json({
                msg: 'El pedido ya fue tomado, cancelado o no existe'
            });
        }
        return res.status(200).json({
            msg: 'Pedido aceptado correctamente',pedido
        });
    } catch (error) {
        console.log('ERROR ACEPTAR PEDIDO:', error);
        return res.status(500).json({
            msg: 'Error al aceptar el pedido',error: error.message
        });
    }
};
export {
    crearPedidoPorFoto, obtenerPedidosPendientes, aceptarPedido
};