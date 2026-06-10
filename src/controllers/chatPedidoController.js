import mongoose from 'mongoose';
import Pedido from '../models/Pedido.js';
import ChatPedido from '../models/ChatPedido.js';

// Verifica que el usuario autenticado pertenezca al pedido.Solo el cliente que creó el pedido o el vendedor asignado
// pueden acceder al chat relacionado con ese pedido
const validarAccesoPedido = async (pedidoId, usuarioId) => {
    // Buscar el pedido en la base de datos
    const pedido = await Pedido.findById(pedidoId);
    // Validar que el pedido exista
    if (!pedido) {
        return {
            ok: false,
            status: 404,
            msg: 'El pedido no existe'
        };
    }
    // Comprobar si el usuario autenticado es el cliente
    const esCliente = pedido.cliente?.toString() === usuarioId;
    // Comprobar si el usuario autenticado es el vendedor asignado
    const esVendedor = pedido.vendedor?.toString() === usuarioId;
    // Si no pertenece al pedido se bloquea el acceso
    if (!esCliente && !esVendedor) {
        return {
            ok: false,
            status: 403,
            msg: 'No tienes acceso al chat de este pedido'
        };
    }
    return {
        ok: true,
        pedido
    };
};

// Obtener mensajes del chat de un pedido
const obtenerChatPedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const usuarioId = req.usuario.id;
        // Validar formato del ID recibido
        if (!mongoose.Types.ObjectId.isValid(pedidoId)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        // Verificar que el usuario tenga acceso al pedido
        const acceso = await validarAccesoPedido(
            pedidoId, usuarioId
        );
        if (!acceso.ok) {
            return res.status(acceso.status).json({
                msg: acceso.msg
            });
        }
        // Obtener todos los mensajes asociados al pedido
        const mensajes = await ChatPedido.find({
            pedido: pedidoId
        })
            .populate(
                'emisor',
                'email rol imagen perfilId perfilModelo'
            )
            .sort({ createdAt: 1 });
        return res.status(200).json({
            msg: 'Chat obtenido correctamente',
            pedido: {
                id: acceso.pedido._id,
                nombrePedido: acceso.pedido.nombrePedido,
                estado: acceso.pedido.estado
            },
            mensajes
        });
    } catch (error) {
        console.error(
            'Error al obtener chat del pedido:', error
        );
        return res.status(500).json({
            msg: 'Error al obtener el chat del pedido'
        });
    }
};

// Enviar un mensaje al chat de un pedido
const enviarMensajePedido = async (req, res) => {
    try {
        const { pedidoId } = req.params;
        const { mensaje } = req.body;
        const usuarioId = req.usuario.id;
        // Validar formato del ID del pedido
        if (!mongoose.Types.ObjectId.isValid(pedidoId)) {
            return res.status(400).json({
                msg: 'El ID del pedido no es válido'
            });
        }
        // Validar que el mensaje no venga vacío
        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({
                msg: 'El mensaje es obligatorio'
            });
        }
        // Verificar que el usuario pertenezca al pedido
        const acceso = await validarAccesoPedido(
            pedidoId,
            usuarioId
        );
        if (!acceso.ok) {
            return res.status(acceso.status).json({
                msg: acceso.msg
            });
        }
        // No permitir mensajes si el pedido está cancelado
        if (acceso.pedido.estado === 'CANCELADO') {
            return res.status(400).json({
                msg: 'No se puede enviar mensajes en un pedido cancelado'
            });
        }
        // Guardar el mensaje en la base de datos
        const nuevoMensaje = await ChatPedido.create({
            pedido: pedidoId,
            emisor: usuarioId,
            mensaje: mensaje.trim(),
            leidoPor: [usuarioId]
        });
        // Obtener el mensaje completo con datos del emisor
        const mensajeCompleto = await ChatPedido.findById(nuevoMensaje._id)
            .populate(
                'emisor',
                'email rol imagen perfilId perfilModelo'
            );
        return res.status(201).json({
            msg: 'Mensaje enviado correctamente',
            mensaje: mensajeCompleto
        });
    } catch (error) {
        console.error('Error al enviar mensaje del pedido:', error);
        return res.status(500).json({
            msg: 'Error al enviar el mensaje'
        });
    }
};

export {
    obtenerChatPedido, enviarMensajePedido
};