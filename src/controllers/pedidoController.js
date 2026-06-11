import Pedido from '../models/Pedido.js';
import { subirImagenCloudinary } from '../helpers/uploadCloudinary.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import Carrito from '../models/Carrito.js';
import Producto from '../models/Producto.js';
import { calcularTotales } from '../helpers/calcularTotal.js';
import { cobrarConTarjeta } from '../helpers/stripeHelper.js';

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
        const io = req.app.get('io');

        if (io) {
            io.to('vendedores').emit('pedido:nuevo', {
                msg: 'Nuevo pedido pendiente',
                pedido: {
                    id: pedido._id,
                    tipoPedido: pedido.tipoPedido,
                    nombrePedido: pedido.nombrePedido,
                    tipoEntrega: pedido.tipoEntrega,
                    estado: pedido.estado,
                    createdAt: pedido.createdAt
                }
            });
        }
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
                    'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago  resumenPago estado observaciones createdAt updatedAt'
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
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        const pedido = await Pedido.findOneAndUpdate(
            {
                _id: id,
                estado: 'PENDIENTE',
                vendedor: null
            },
            {
                vendedor: req.usuario.id,
                estado: 'EN_PROCESO'
            },
            { returnDocument: 'after' }
        )
            .populate({
                path: 'cliente',
                select: 'email perfilId perfilModelo',
                populate: {
                    path: 'perfilId',
                    select: 'nombre apellido'
                }
            })
            .select(
                'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago  resumenPago estado observaciones createdAt updatedAt'
            );
        if (!pedido) {
            return res.status(400).json({
                msg: 'El pedido ya fue tomado, cancelado o no existe'
            });
        }
        return res.status(200).json({
            msg: 'Pedido aceptado correctamente',
            pedido
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
            estadoPago,
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
        if (estadoPago) {
            if (!['PENDIENTE', 'PAGADO'].includes(estadoPago)) {
                return res.status(400).json({
                    msg: 'El estado de pago no es válido'
                });
            }

            filtro.estadoPago = estadoPago;
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
                    'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago  resumenPago estado observaciones createdAt updatedAt'
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
                'cliente vendedor tipoPedido nombrePedido listaCliente articulos datosFacturacion tipoEntrega direccionEntrega metodoPago estadoPago  resumenPago estado observaciones createdAt updatedAt'
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

// Cambiar estado de un pedido según el rol autenticado// solo cancelar pedido
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

        // Este endpoint solo permite cancelar.
        // FINALIZADO solo debe hacerlo crearVentaDesdePedido.
        if (estado !== 'CANCELADO') {
            return res.status(400).json({
                msg: 'Este endpoint solo permite cancelar pedidos. Para finalizar use la venta'
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

        if (pedido.estado === 'FINALIZADO') {
            return res.status(400).json({
                msg: 'No se puede cancelar un pedido finalizado'
            });
        }

        if (pedido.estado === 'CANCELADO') {
            return res.status(400).json({
                msg: 'El pedido ya está cancelado'
            });
        }

        if (rol === 'CLIENTE') {
            const clienteIdString = (pedido.cliente?._id || pedido.cliente).toString();

            if (clienteIdString !== usuarioId) {
                return res.status(403).json({
                    msg: 'No tiene permisos para cancelar este pedido'
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
                    msg: 'No tiene permisos para cancelar este pedido'
                });
            }

            if (pedido.estado !== 'EN_PROCESO') {
                return res.status(400).json({
                    msg: 'Solo se pueden cancelar pedidos en proceso'
                });
            }
        }

        pedido.estado = 'CANCELADO';
        await pedido.save();

        return res.status(200).json({
            msg: 'Pedido cancelado correctamente',
            pedido: {
                id: pedido._id,
                estado: pedido.estado,
                estadoPago: pedido.estadoPago,
                metodoPago: pedido.metodoPago
            }
        });

    } catch (error) {
        console.log('ERROR CAMBIAR ESTADO PEDIDO:', error);

        return res.status(500).json({
            msg: 'Error al cambiar el estado del pedido',
            error: error.message
        });
    }
};

// Crear pedido desde el carrito del cliente
const crearPedidoDesdeCarrito = async (req, res) => {
    try {
        const clienteId = req.usuario.id;
        const {
            nombrePedido, nombreCompleto, identificacion, correo, telefono, tipoEntrega, direccion, referencia,
            metodoPago, observaciones } = req.body;
        // Validar datos básicos
        if (!nombrePedido?.trim()) {
            return res.status(400).json({
                msg: 'El nombre del pedido es obligatorio'
            });
        }
        if (
            !nombreCompleto?.trim() ||
            !identificacion?.trim() ||
            !correo?.trim() ||
            !telefono?.trim()
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
        if (tipoEntrega === 'ENVIO_DOMICILIO' && !direccion?.trim()) {
            return res.status(400).json({
                msg: 'La dirección es obligatoria para envío a domicilio'
            });
        }
        if (!metodoPago?.trim()) {
            return res.status(400).json({
                msg: 'El método de pago es obligatorio'
            });
        }
        if (!['EFECTIVO', 'TRANSFERENCIA'].includes(metodoPago)) {
            return res.status(400).json({
                msg: 'Para pedidos con tarjeta use otra sección'
            });
        }
        // Buscar carrito activo del cliente
        const carrito = await Carrito.findOne({
            cliente: clienteId,
            estado: true
        });
        if (!carrito || carrito.articulos.length === 0) {
            return res.status(400).json({
                msg: 'El carrito está vacío'
            });
        }
        const articulosPedido = [];
        // Validar stock real y armar artículos del pedido
        for (const item of carrito.articulos) {
            const producto = await Producto.findOne({
                _id: item.producto,
                estado: true
            });
            if (!producto) {
                return res.status(404).json({
                    msg: `El producto "${item.nombreProducto}" ya no está disponible`
                });
            }
            if (producto.stock < item.cantidad) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${item.nombreProducto}". Solo hay ${producto.stock} unidades disponibles`
                });
            }
            articulosPedido.push({
                producto: producto._id,
                nombreProducto: item.nombreProducto,
                codigo: item.codigo,
                color: item.color || '',
                tamanio: item.tamanio || '',
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                porcentajeIva: item.porcentajeIva
            });
        }
        // Calcular subtotal e IVA de productos
        const totales = calcularTotales(articulosPedido);
        const costoEnvio = tipoEntrega === 'ENVIO_DOMICILIO' ? 3.50 : 0;
        const totalPagar = Number(
            (totales.subtotalGeneral + totales.ivaGeneral + costoEnvio).toFixed(2)
        );
        // Crear pedido tipo carrito
        const pedido = new Pedido({
            cliente: clienteId,
            tipoPedido: 'CARRITO',
            nombrePedido: nombrePedido.trim(),
            articulos: totales.itemsCalculados,
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
            metodoPago,
            estadoPago: 'PENDIENTE',
            resumenPago: {
                subtotalProductos: totales.subtotalGeneral,
                ivaProductos: totales.ivaGeneral,
                costoEnvio,
                totalPagar
            },
            observaciones: observaciones?.trim() || '',
            estado: 'PENDIENTE'
        });
        await pedido.save();
        const io = req.app.get('io');

        if (io) {
            io.to('vendedores').emit('pedido:nuevo', {
                msg: 'Nuevo pedido pendiente',
                pedido: {
                    id: pedido._id,
                    tipoPedido: pedido.tipoPedido,
                    nombrePedido: pedido.nombrePedido,
                    tipoEntrega: pedido.tipoEntrega,
                    estado: pedido.estado,
                    createdAt: pedido.createdAt
                }
            });
        }
        // Vaciar carrito después de crear el pedido
        carrito.articulos = [];
        await carrito.save();
        const pedidoRespuesta = pedido.toObject();
        delete pedidoRespuesta.listaCliente;
        if (pedidoRespuesta.tipoEntrega === 'RETIRO_LOCAL') {
            delete pedidoRespuesta.direccionEntrega;
        }
        return res.status(201).json({
            msg: 'Pedido creado desde el carrito correctamente',
            pedido: pedidoRespuesta
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                msg: Object.values(error.errors)[0].message
            });
        }
        console.log('ERROR CREAR PEDIDO DESDE CARRITO:', error);
        return res.status(500).json({
            msg: 'Error al crear pedido desde carrito',
            error: error.message
        });
    }
};

// Vendedor arma un pedido creado mediante foto
const armarPedidoDesdeFoto = async (req, res) => {
    try {
        const { id } = req.params;
        const { articulos } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'ID de pedido no válido'
            });
        }
        if (!Array.isArray(articulos) || articulos.length === 0) {
            return res.status(400).json({
                msg: 'Debe enviar al menos un artículo'
            });
        }
        const pedido = await Pedido.findById(id);
        if (!pedido) {
            return res.status(404).json({
                msg: 'Pedido no encontrado'
            });
        }
        if (pedido.tipoPedido !== 'FOTO_LISTA') {
            return res.status(400).json({
                msg: 'Solo los pedidos por foto pueden ser armados'
            });
        }
        if (pedido.estado !== 'EN_PROCESO') {
            return res.status(400).json({
                msg: 'El pedido debe estar en proceso'
            });
        }
        if (!pedido.vendedor) {
            return res.status(400).json({
                msg: 'El pedido aún no tiene vendedor asignado'
            });
        }
        if (pedido.vendedor.toString() !== req.usuario.id) {
            return res.status(403).json({
                msg: 'No tiene permisos para modificar este pedido'
            });
        }
        const articulosParaCalcular = [];
        for (const item of articulos) {
            const { producto: productoId, cantidad } = item;
            if (!mongoose.Types.ObjectId.isValid(productoId)) {
                return res.status(400).json({
                    msg: `Producto inválido: ${productoId}`
                });
            }
            const producto = await Producto.findOne({
                _id: productoId,
                estado: true
            });
            if (!producto) {
                return res.status(404).json({
                    msg: 'Uno de los productos seleccionados no existe o está inactivo'
                });
            }
            const cantidadNumerica = Number(cantidad);

            if (
                !cantidadNumerica ||
                cantidadNumerica < 1 ||
                !Number.isInteger(cantidadNumerica)
            ) {
                return res.status(400).json({
                    msg: `La cantidad para "${producto.nombre}" debe ser un número entero mayor a cero`
                });
            }
            if (producto.stock < cantidadNumerica) {
                return res.status(400).json({
                    msg: `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}`
                });
            }
            const porcentajeIva = producto.tipoIVA === '15%' ? 0.15 : 0;
            articulosParaCalcular.push({
                producto: producto._id,
                nombreProducto: producto.nombre,
                codigo: producto.codigo,
                color: producto.color || '',
                tamanio: producto.tamanio || '',
                cantidad: cantidadNumerica,
                precioUnitario: producto.precioVenta,
                porcentajeIva
            });
        }
        const totalesCalculados = calcularTotales(articulosParaCalcular);
        pedido.articulos = totalesCalculados.itemsCalculados;
        pedido.resumenPago.subtotalProductos = totalesCalculados.subtotalGeneral;
        pedido.resumenPago.ivaProductos = totalesCalculados.ivaGeneral;
        await pedido.save();
        return res.status(200).json({
            msg: 'Pedido armado correctamente desde la foto',
            pedido: {
                id: pedido._id,
                nombrePedido: pedido.nombrePedido,
                tipoPedido: pedido.tipoPedido,
                estado: pedido.estado,
                estadoPago: pedido.estadoPago,
                tipoEntrega: pedido.tipoEntrega,
                articulos: pedido.articulos,
                resumenPago: pedido.resumenPago,
                updatedAt: pedido.updatedAt
            }
        });
    } catch (error) {
        console.log('ERROR AL ARMAR PEDIDO DESDE FOTO:', error);
        return res.status(500).json({
            msg: 'Error al armar el pedido desde la foto',
            error: error.message
        });
    }
};

// Cliente define método de pago de un pedido por foto ya armado
const definirPagoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { metodoPago, paymentMethodId } = req.body || {};
        const clienteId = req.usuario.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }

        if (!['EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].includes(metodoPago)) {
            return res.status(400).json({
                msg: 'El método de pago no es válido'
            });
        }

        const pedido = await Pedido.findById(id);

        if (!pedido) {
            return res.status(404).json({
                msg: 'Pedido no encontrado'
            });
        }

        if (pedido.cliente.toString() !== clienteId) {
            return res.status(403).json({
                msg: 'No tiene permisos para pagar este pedido'
            });
        }

        if (pedido.tipoPedido !== 'FOTO_LISTA') {
            return res.status(400).json({
                msg: 'Este endpoint solo aplica para pedidos por foto'
            });
        }

        if (pedido.estado !== 'EN_PROCESO') {
            return res.status(400).json({
                msg: 'El pedido debe estar en proceso para definir el pago'
            });
        }

        if (!pedido.articulos || pedido.articulos.length === 0) {
            return res.status(400).json({
                msg: 'El vendedor aún no ha armado el pedido'
            });
        }

        if (!pedido.resumenPago?.totalPagar || pedido.resumenPago.totalPagar <= 0) {
            return res.status(400).json({
                msg: 'El pedido aún no tiene un total válido para pagar'
            });
        }

        if (pedido.metodoPago) {
            return res.status(400).json({
                msg: 'Este pedido ya tiene un método de pago definido'
            });
        }

        if (metodoPago === 'TARJETA') {
            if (!paymentMethodId?.trim()) {
                return res.status(400).json({
                    msg: 'El paymentMethodId es obligatorio para pago con tarjeta'
                });
            }

            const payment = await cobrarConTarjeta({
                totalPagar: pedido.resumenPago.totalPagar,
                correo: pedido.datosFacturacion.correo,
                paymentMethodId,
                descripcion: `Pago de pedido por foto ${pedido.nombrePedido}`
            });

            if (payment.status !== 'succeeded') {
                return res.status(400).json({
                    msg: 'El pago no se completó',
                    estadoStripe: payment.status
                });
            }

            // Si Stripe cobró correctamente, descontar stock inmediatamente
            for (const item of pedido.articulos) {
                const resultadoDescuento = await Producto.updateOne(
                    {
                        _id: item.producto,
                        estado: true,
                        stock: { $gte: item.cantidad }
                    },
                    {
                        $inc: { stock: -item.cantidad }
                    }
                );

                if (resultadoDescuento.modifiedCount === 0) {
                    return res.status(400).json({
                        msg: `El pago fue realizado, pero no hay stock suficiente para "${item.nombreProducto}". Revisar manualmente.`
                    });
                }
            }

            pedido.metodoPago = 'TARJETA';
            pedido.estadoPago = 'PAGADO';
        }

        if (metodoPago === 'EFECTIVO') {
            pedido.metodoPago = 'EFECTIVO';
            pedido.estadoPago = 'PENDIENTE';
        }

        if (metodoPago === 'TRANSFERENCIA') {
            pedido.metodoPago = 'TRANSFERENCIA';
            pedido.estadoPago = 'PENDIENTE';
        }

        await pedido.save();

        return res.status(200).json({
            msg: metodoPago === 'TARJETA'
                ? 'Pago con tarjeta realizado correctamente. Stock descontado'
                : 'Método de pago registrado correctamente',
            pedido: {
                id: pedido._id,
                tipoPedido: pedido.tipoPedido,
                nombrePedido: pedido.nombrePedido,
                metodoPago: pedido.metodoPago,
                estadoPago: pedido.estadoPago,
                estado: pedido.estado,
                resumenPago: pedido.resumenPago
            }
        });

    } catch (error) {
        console.log('ERROR AL DEFINIR PAGO DEL PEDIDO:', error);

        return res.status(500).json({
            msg: 'Error al definir el pago del pedido',
            error: error.message
        });
    }
};

export {
    crearPedidoPorFoto, obtenerPedidosPendientes, aceptarPedido, obtenerMisPedidos, obtenerDetallePedido, cambiarEstadoPedido, crearPedidoDesdeCarrito, armarPedidoDesdeFoto, definirPagoPedido
};