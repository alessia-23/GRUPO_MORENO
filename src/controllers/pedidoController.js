import Pedido from '../models/Pedido.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Crear pedido por foto/lista enviada por el cliente
const crearPedidoPorFoto = async (req, res) => {
    let imagenPedido = { url: null, public_id: null };
    try {
        const clienteId = req.usuario.id;
        const { nombrePedido, nombreCompleto, identificacion, correo, telefono, tipoEntrega, direccion, referencia, observaciones } = req.body;
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
            if (!direccion?.trim()) {
                return res.status(400).json({
                    msg: 'La dirección es obligatoria para envío a domicilio'
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
            page = 1,
            tipoPedido,
            tipoEntrega
        } = req.query;
        const paginaActual = Math.max(Number(page), 1);
        const limite = 15;
        const desde = (paginaActual - 1) * limite;
        const filtro = {
            estado: 'PENDIENTE',
            vendedor: null
        };
        // Filtrar por tipo de pedido: FOTO_LISTA o CARRITO
        if (tipoPedido) {
            if (!['FOTO_LISTA', 'CARRITO'].includes(tipoPedido)) {
                return res.status(400).json({
                    msg: 'El tipo de pedido no es válido'
                });
            }
            filtro.tipoPedido = tipoPedido;
        }
        // Filtrar por tipo de entrega: RETIRO_LOCAL o ENVIO_DOMICILIO
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
                    path: 'cliente',
                    select: 'email perfilId perfilModelo',
                    populate: {
                        path: 'perfilId',
                        select: 'nombre apellido'
                    }
                })
                .select(
                    'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago estadoCotizacion resumenPago estado observaciones createdAt updatedAt'
                )
                .sort({ createdAt: -1 })
                .skip(desde)
                .limit(limite)
                .lean()
        ]);
        return res.status(200).json({
            total,
            paginaActual,
            totalPaginas: Math.ceil(total / limite),
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
                _id: id, estado: 'PENDIENTE', vendedor: null
            },
            {
                // El vendedor actual toma el pedido
                vendedor: req.usuario.id,
                estado: 'EN_PROCESO'
            },
            { returnDocument: 'after' }
        )
            .populate({
                path: 'cliente',
                select: 'email perfilId perfilModelo',
                populate: {
                    path: 'perfilId', select: 'nombre apellido'
                }
            })
            .select(
                'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago estadoCotizacion resumenPago estado observaciones createdAt updatedAt'
            )
        // Si no existe, ya fue tomado, cancelado o no está pendiente
        if (!pedido) {
            return res.status(400).json({
                msg: 'El pedido ya fue tomado, cancelado o no existe'
            });
        }
        return res.status(200).json({
            msg: 'Pedido aceptado correctamente', pedido
        });
    } catch (error) {
        console.log('ERROR ACEPTAR PEDIDO:', error);
        return res.status(500).json({
            msg: 'Error al aceptar el pedido', error: error.message
        });
    }
};

// Listar mis pedidos según el rol del usuario autenticado
const obtenerMisPedidos = async (req, res) => {
    try {
        const {
            page = 1,
            estado,
            tipoPedido,
            tipoEntrega,
            buscar
        } = req.query;
        const paginaActual = Math.max(Number(page), 1);
        const limite = 15;
        const desde = (paginaActual - 1) * limite;
        const filtro = {};
        if (req.usuario.rol === 'CLIENTE') {
            filtro.cliente = req.usuario.id;
            // Cliente busca por nombre/título del pedido
            if (buscar?.trim()) {
                filtro.nombrePedido = {
                    $regex: buscar.trim(),
                    $options: 'i'
                };
            }
        } else if (req.usuario.rol === 'VENDEDOR') {
            filtro.vendedor = req.usuario.id;
            // Vendedor busca por nombre del cliente en datos de facturación
            if (buscar?.trim()) {
                filtro['datosFacturacion.nombreCompleto'] = {
                    $regex: buscar.trim(),
                    $options: 'i'
                };
            }
        } else {
            return res.status(403).json({
                msg: 'No tiene permisos para consultar pedidos'
            });
        }
        if (estado) {
            if (!['PENDIENTE', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO'].includes(estado)) {
                return res.status(400).json({
                    msg: 'El estado del pedido no es válido'
                });
            }
            filtro.estado = estado;
        }
        if (tipoPedido) {
            if (!['FOTO_LISTA', 'CARRITO'].includes(tipoPedido)) {
                return res.status(400).json({
                    msg: 'El tipo de pedido no es válido'
                });
            }
            filtro.tipoPedido = tipoPedido;
        }
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
                    path: 'cliente',
                    select: 'email perfilId perfilModelo',
                    populate: {
                        path: 'perfilId',
                        select: 'nombre apellido'
                    }
                })
                .populate({
                    path: 'vendedor',
                    select: 'email perfilId perfilModelo',
                    populate: {
                        path: 'perfilId',
                        select: 'nombre apellido'
                    }
                })
                .select(
                    'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago estadoCotizacion resumenPago estado observaciones createdAt updatedAt'
                )
                .sort({ updatedAt: -1 })
                .skip(desde)
                .limit(limite)
                .lean()
        ]);
        return res.status(200).json({
            total,
            paginaActual,
            totalPaginas: Math.ceil(total / limite),
            limite,
            rol: req.usuario.rol,
            pedidos
        });
    } catch (error) {
        console.log('ERROR LISTAR MIS PEDIDOS:', error);
        return res.status(500).json({
            msg: 'Error al listar mis pedidos', error: error.message
        });
    }
};

// Ver detalle de un pedido por ID
const obtenerDetallePedido = async (req, res) => {
    try {
        const { id } = req.params;
        // Validar formato del ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        //Excluye los datos peligrosos sin romper el populate anidado
        const pedido = await Pedido.findById(id)
            .populate({
                path: 'cliente',
                select: '-password -token -createdAt -updatedAt -__v',
                populate: {
                    path: 'perfilId',
                    select: 'nombre apellido'
                }
            })
            .populate({
                path: 'vendedor',
                select: '-password -token -createdAt -updatedAt -__v',
                populate: {
                    path: 'perfilId',
                    select: 'nombre apellido'
                }
            })
            .select(
                'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago estadoCotizacion resumenPago estado observaciones createdAt updatedAt'
            )
            .lean();
        if (!pedido) {
            return res.status(404).json({
                msg: 'Pedido no encontrado'
            });
        }
        const usuarioId = req.usuario.id;
        const rol = req.usuario.rol;
        // Solo clientes y vendedores pueden consultar pedidos
        if (!['CLIENTE', 'VENDEDOR'].includes(rol)) {
            return res.status(403).json({
                msg: 'No tiene permisos para ver pedidos'
            });
        }
        // Cliente dueño del pedido (Soporta populado o ID plano)
        const esClienteDelPedido =
            (pedido.cliente?._id || pedido.cliente)?.toString() === usuarioId;
        // Vendedor que aceptó el pedido (Soporta populado o ID plano)
        const esVendedorDelPedido =
            (pedido.vendedor?._id || pedido.vendedor)?.toString() === usuarioId;
        // Pedido pendiente todavía visible en el muro
        const estaDisponibleEnMuro =
            pedido.estado === 'PENDIENTE' && pedido.vendedor === null;
        // El cliente solo puede ver sus propios pedidos
        if (rol === 'CLIENTE' && !esClienteDelPedido) {
            return res.status(403).json({
                msg: 'No tiene permisos para ver este pedido'
            });
        }
        // El vendedor puede ver pedidos pendientes del muro o pedidos que él aceptó
        if (rol === 'VENDEDOR' && !esVendedorDelPedido && !estaDisponibleEnMuro) {
            return res.status(403).json({
                msg: 'No tiene permisos para ver este pedido'
            });
        }
        const pedidoRespuesta = {
            _id: pedido._id,
            cliente: pedido.cliente
                ? {
                    usuarioId: pedido.cliente._id,
                    perfilId: pedido.cliente.perfilId?._id || pedido.cliente.perfilId,
                    nombre: pedido.cliente.perfilId?.nombre || '',
                    apellido: pedido.cliente.perfilId?.apellido || ''
                }
                : null,
            vendedor: pedido.vendedor
                ? {
                    usuarioId: pedido.vendedor._id,
                    perfilId: pedido.vendedor.perfilId?._id || pedido.vendedor.perfilId,
                    nombre: pedido.vendedor.perfilId?.nombre || '',
                    apellido: pedido.vendedor.perfilId?.apellido || ''
                }
                : null,
            tipoPedido: pedido.tipoPedido,
            nombrePedido: pedido.nombrePedido,
            listaCliente: pedido.listaCliente,
            articulos: pedido.articulos,
            datosFacturacion: pedido.datosFacturacion,
            tipoEntrega: pedido.tipoEntrega,
            direccionEntrega: pedido.direccionEntrega,
            metodoPago: pedido.metodoPago,
            estadoPago: pedido.estadoPago,
            estadoCotizacion: pedido.estadoCotizacion,
            resumenPago: pedido.resumenPago,
            estado: pedido.estado,
            observaciones: pedido.observaciones,
            createdAt: pedido.createdAt,
            updatedAt: pedido.updatedAt
        };
        return res.status(200).json({
            pedido: pedidoRespuesta
        });
    } catch (error) {
        console.log('ERROR OBTENER DETALLE PEDIDO:', error);
        return res.status(500).json({
            msg: 'Error al obtener el detalle del pedido',
            error: error.message
        });
    }
};

// Cambiar estado de un pedido según el rol autenticado
const cambiarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        if (!estado?.trim()) {
            return res.status(400).json({
                msg: 'El estado es obligatorio'
            });
        }
        if (!['FINALIZADO', 'CANCELADO'].includes(estado)) {
            return res.status(400).json({
                msg: 'El estado solo puede ser FINALIZADO o CANCELADO'
            });
        }
        const pedido = await Pedido.findById(id);
        if (!pedido) {
            return res.status(404).json({
                msg: 'Pedido no encontrado'
            });
        }
        const usuarioId = req.usuario.id;
        const rol = req.usuario.rol;
        if (!['CLIENTE', 'VENDEDOR'].includes(rol)) {
            return res.status(403).json({
                msg: 'No tiene permisos para cambiar el estado del pedido'
            });
        }
        if (rol === 'CLIENTE') {
            const clienteIdString = (pedido.cliente?._id || pedido.cliente).toString();
            if (clienteIdString !== usuarioId) {
                return res.status(403).json({
                    msg: 'No tiene permisos para cancelar este pedido'
                });
            }
            if (estado !== 'CANCELADO') {
                return res.status(400).json({
                    msg: 'El cliente solo puede cancelar pedidos'
                });
            }
            if (pedido.estado !== 'PENDIENTE') {
                return res.status(400).json({
                    msg: 'Solo puede cancelar pedidos que aún están pendientes'
                });
            }
        }
        if (rol === 'VENDEDOR') {
            const vendedorIdString = (pedido.vendedor?._id || pedido.vendedor)?.toString();
            if (vendedorIdString !== usuarioId) {
                return res.status(403).json({
                    msg: 'No tiene permisos para modificar este pedido'
                });
            }
            if (pedido.estado !== 'EN_PROCESO') {
                return res.status(400).json({
                    msg: 'Solo se pueden actualizar pedidos en proceso'
                });
            }
        }
        pedido.estado = estado;
        await pedido.save();
        return res.status(200).json({
            msg: `Pedido correctamente ${estado}`
        });
    } catch (error) {
        console.log('ERROR CAMBIAR ESTADO PEDIDO:', error);
        return res.status(500).json({
            msg: 'Error al cambiar el estado del pedido', error: error.message
        });
    }
};

export {
    crearPedidoPorFoto, obtenerPedidosPendientes, aceptarPedido, obtenerMisPedidos, obtenerDetallePedido, cambiarEstadoPedido
};