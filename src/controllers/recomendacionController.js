import Recomendacion from '../models/Recomendacion.js';
import Usuario from '../models/Usuario.js';
import mongoose from 'mongoose';

// Crear recomendación
const crearRecomendacion = async (req, res) => {
    try {
        const vendedorId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { asunto, mensaje } = req.body;

        if (rolUsuario !== 'VENDEDOR') {
            return res.status(403).json({
                msg: 'Solo los vendedores pueden enviar recomendaciones'
            });
        }
        if (!asunto || !asunto.trim()) {
            return res.status(400).json({
                msg: 'El asunto es obligatorio'
            });
        }
        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({
                msg: 'El mensaje es obligatorio'
            });
        }
        const nuevaRecomendacion = await Recomendacion.create({
            vendedor: vendedorId,
            rolUsuario,
            asunto: asunto.trim(),
            mensaje: mensaje.trim()
        });
        const io = req.app.get('io');
        if (io) {
            io.to('recomendaciones-admin').emit('nueva-recomendacion', {
                id: nuevaRecomendacion._id,
                asunto: nuevaRecomendacion.asunto,
                estado: nuevaRecomendacion.estado,
                rolUsuario: nuevaRecomendacion.rolUsuario,
                createdAt: nuevaRecomendacion.createdAt
            });
        }
        return res.status(201).json({
            msg: 'Recomendación enviada correctamente'
        });
    } catch (error) {
        console.error('Error al crear recomendación:', error);
        return res.status(500).json({
            msg: 'Error al enviar la recomendación'
        });
    }
};

// Listar mis recomendaciones
const obtenerMisRecomendaciones = async (req, res) => {
    try {
        const vendedorId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { estado } = req.query;
        if (rolUsuario !== 'VENDEDOR') {
            return res.status(403).json({
                msg: 'Solo los vendedores pueden ver sus recomendaciones'
            });
        }
        const filtro = {
            vendedor: vendedorId
        };
        if (estado) {
            if (!['PENDIENTE', 'FINALIZADA'].includes(estado)) {
                return res.status(400).json({
                    msg: 'El estado debe ser PENDIENTE o FINALIZADA'
                });
            }
            filtro.estado = estado;
        }
        const recomendaciones = await Recomendacion.find(filtro)
            .select('asunto mensaje estado respuestaAdmin fechaRespuesta createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            msg: 'Recomendaciones obtenidas correctamente',
            recomendaciones
        });
    } catch (error) {
        console.error('Error al obtener mis recomendaciones:', error);
        return res.status(500).json({
            msg: 'Error al obtener recomendaciones'
        });
    }
};

// Listar todas las recomendaciones para el administrador
const obtenerRecomendacionesAdmin = async (req, res) => {
    try {
        const { estado, buscar } = req.query;
        const filtro = {};
        if (estado) {
            if (!['PENDIENTE', 'FINALIZADA'].includes(estado)) {
                return res.status(400).json({
                    msg: 'El estado debe ser PENDIENTE o FINALIZADA'
                });
            }
            filtro.estado = estado;
        }
        if (buscar?.trim()) {
            const vendedores = await Usuario.find({
                rol: 'VENDEDOR',
                email: {
                    $regex: buscar.trim(),
                    $options: 'i'
                }
            }).select('_id');
            filtro.vendedor = {
                $in: vendedores.map((vendedor) => vendedor._id)
            };
        }
        const recomendaciones = await Recomendacion.find(filtro)
            .populate('vendedor', 'email rol')
            .populate('respondidoPor', 'email rol')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            msg: 'Recomendaciones obtenidas correctamente',
            recomendaciones
        });
    } catch (error) {
        console.error('Error al obtener recomendaciones:', error);
        return res.status(500).json({
            msg: 'Error al obtener las recomendaciones'
        });
    }
};

// Responder una recomendación
const responderRecomendacion = async (req, res) => {
    try {
        const { id } = req.params;
        const { respuestaAdmin } = req.body;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID no es válido'
            });
        }
        if (!respuestaAdmin || !respuestaAdmin.trim()) {
            return res.status(400).json({
                msg: 'La respuesta es obligatoria'
            });
        }
        const recomendacion = await Recomendacion.findById(id);
        if (!recomendacion) {
            return res.status(404).json({
                msg: 'La recomendación no existe'
            });
        }
        if (recomendacion.estado === 'FINALIZADA') {
            return res.status(400).json({
                msg: 'La recomendación ya fue respondida'
            });
        }
        recomendacion.respuestaAdmin = respuestaAdmin.trim();
        recomendacion.respondidoPor = req.usuario.id;
        recomendacion.fechaRespuesta = new Date();
        recomendacion.estado = 'FINALIZADA';
        await recomendacion.save();
        const io = req.app.get('io');
        if (io) {
            io.to(`mis-recomendaciones-${recomendacion.vendedor.toString()}`).emit(
                'recomendacion-respondida',
                {
                    id: recomendacion._id,
                    asunto: recomendacion.asunto,
                    estado: recomendacion.estado,
                    respuestaAdmin: recomendacion.respuestaAdmin,
                    fechaRespuesta: recomendacion.fechaRespuesta
                }
            );
        }
        return res.status(200).json({
            msg: 'Respuesta enviada correctamente'
        });
    } catch (error) {
        console.error('Error al responder recomendación:', error);
        return res.status(500).json({
            msg: 'Error al responder la recomendación'
        });
    }
};

// Obtener detalle de una recomendación
const obtenerDetalleRecomendacion = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID no es válido'
            });
        }
        const recomendacion = await Recomendacion.findById(id)
            .populate('vendedor', 'email rol')
            .populate('respondidoPor', 'email rol');
        if (!recomendacion) {
            return res.status(404).json({
                msg: 'La recomendación no existe'
            });
        }
        if (req.usuario.rol === 'VENDEDOR') {
            if (recomendacion.vendedor._id.toString() !== req.usuario.id) {
                return res.status(403).json({
                    msg: 'No tienes permiso para ver esta recomendación'
                });
            }
        } else if (req.usuario.rol !== 'ADMINISTRADOR') {
            return res.status(403).json({
                msg: 'No tienes permiso para ver esta recomendación'
            });
        }
        return res.status(200).json({
            msg: 'Detalle obtenido correctamente',
            recomendacion
        });
    } catch (error) {
        console.error(
            'Error al obtener detalle de la recomendación:',
            error
        );
        return res.status(500).json({
            msg: 'Error al obtener el detalle'
        });
    }
};

export {
    crearRecomendacion, obtenerMisRecomendaciones, obtenerRecomendacionesAdmin, responderRecomendacion, obtenerDetalleRecomendacion
};