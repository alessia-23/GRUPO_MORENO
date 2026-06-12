import QuejaSugerencia from '../models/QuejaSugerencia.js';
import mongoose from 'mongoose';

// Crear queja o sugerencia
const crearQuejaSugerencia = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { asunto, mensaje } = req.body;
        // Solo clientes y vendedores pueden enviar quejas o sugerencias
        if (rolUsuario !== 'CLIENTE') {
            return res.status(403).json({
                msg: 'Solo los clientes pueden ver sus quejas o sugerencias'
            });
        }
        // Validar asunto
        if (!asunto || !asunto.trim()) {
            return res.status(400).json({
                msg: 'El asunto es obligatorio'
            });
        }
        // Validar mensaje
        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({
                msg: 'El mensaje es obligatorio'
            });
        }
        // Guardar queja o sugerencia en la base de datos
        const nuevaQuejaSugerencia = await QuejaSugerencia.create({
            usuario: usuarioId,
            rolUsuario,
            asunto: asunto.trim(),
            mensaje: mensaje.trim()
        });

        const io = req.app.get('io');

        if (io) {
            io.to('quejas-admin').emit('nueva-queja-sugerencia', {
                id: nuevaQuejaSugerencia._id,
                asunto: nuevaQuejaSugerencia.asunto,
                estado: nuevaQuejaSugerencia.estado,
                rolUsuario: nuevaQuejaSugerencia.rolUsuario,
                createdAt: nuevaQuejaSugerencia.createdAt
            });
        }
        return res.status(201).json({
            msg: 'Queja o sugerencia enviada correctamente'
        });
    } catch (error) {
        console.error('Error al crear queja o sugerencia:', error);
        return res.status(500).json({
            msg: 'Error al enviar la queja o sugerencia'
        });
    }
};

// Listar mis quejas o sugerencias
const obtenerMisQuejasSugerencias = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { estado } = req.query;
        // Solo clientes y vendedores pueden ver sus quejas o sugerencias
        if (!['CLIENTE', 'VENDEDOR'].includes(rolUsuario)) {
            return res.status(403).json({
                msg: 'No tienes permiso para ver quejas o sugerencias'
            });
        }
        const filtro = {
            usuario: usuarioId
        };
        // Filtro opcional por estado
        if (estado) {
            if (!['PENDIENTE', 'FINALIZADA'].includes(estado)) {
                return res.status(400).json({
                    msg: 'El estado debe ser PENDIENTE o FINALIZADA'
                });
            }
            filtro.estado = estado;
        }
        const quejasSugerencias = await QuejaSugerencia.find(filtro)
            .select('asunto mensaje estado respuestaAdmin fechaRespuesta createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            msg: 'Quejas y sugerencias obtenidas correctamente',
            quejasSugerencias
        });
    } catch (error) {
        console.error('Error al obtener mis quejas o sugerencias:', error);
        return res.status(500).json({
            msg: 'Error al obtener quejas y sugerencias'
        });
    }
};

// Listar todas las quejas y sugerencias para el administrador
const obtenerQuejasSugerenciasAdmin = async (req, res) => {
    try {
        const { estado, rolUsuario } = req.query;
        const filtro = {};
        // Filtrar por estado
        if (estado) {
            if (!['PENDIENTE', 'FINALIZADA'].includes(estado)) {
                return res.status(400).json({
                    msg: 'El estado debe ser PENDIENTE o FINALIZADA'
                });
            }
            filtro.estado = estado;
        }
        // Filtrar por rol
        //if (rolUsuario) {
        //    if (!['CLIENTE', 'VENDEDOR'].includes(rolUsuario)) {
        //        return res.status(400).json({
        //            msg: 'El rol debe ser CLIENTE o VENDEDOR'
        //        });
         //   }
        //    filtro.rolUsuario = rolUsuario;
       // }
        const quejasSugerencias = await QuejaSugerencia.find(filtro)
            .populate(
                'usuario',
                'email rol'
            )
            .sort({ createdAt: -1 });
        return res.status(200).json({
            msg: 'Quejas y sugerencias obtenidas correctamente',
            quejasSugerencias
        });
    } catch (error) {
        console.error(
            'Error al obtener quejas y sugerencias:',
            error
        );
        return res.status(500).json({
            msg: 'Error al obtener las quejas y sugerencias'
        });
    }
};

// Responder una queja o sugerencia
const responderQuejaSugerencia = async (req, res) => {
    try {
        const { id } = req.params;
        const { respuestaAdmin } = req.body;
        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID no es válido'
            });
        }
        // Validar respuesta
        if (!respuestaAdmin || !respuestaAdmin.trim()) {
            return res.status(400).json({
                msg: 'La respuesta es obligatoria'
            });
        }
        const quejaSugerencia = await QuejaSugerencia.findById(id);
        if (!quejaSugerencia) {
            return res.status(404).json({
                msg: 'La queja o sugerencia no existe'
            });
        }
        // Evitar responder dos veces
        if (quejaSugerencia.estado === 'FINALIZADA') {
            return res.status(400).json({
                msg: 'La queja o sugerencia ya fue respondida'
            });
        }
        quejaSugerencia.respuestaAdmin = respuestaAdmin.trim();
        quejaSugerencia.respondidoPor = req.usuario.id;
        quejaSugerencia.fechaRespuesta = new Date();
        quejaSugerencia.estado = 'FINALIZADA';
        await quejaSugerencia.save();
        const io = req.app.get('io');

        if (io) {
            io.to(`mis-quejas-${quejaSugerencia.usuario.toString()}`).emit(
                'queja-sugerencia-respondida',
                {
                    id: quejaSugerencia._id,
                    asunto: quejaSugerencia.asunto,
                    estado: quejaSugerencia.estado,
                    respuestaAdmin: quejaSugerencia.respuestaAdmin,
                    fechaRespuesta: quejaSugerencia.fechaRespuesta
                }
            );
        }
        return res.status(200).json({
            msg: 'Respuesta enviada correctamente'
        });
    } catch (error) {
        console.error('Error al responder queja o sugerencia:', error);
        return res.status(500).json({
            msg: 'Error al responder la queja o sugerencia'
        });
    }
};

// Obtener detalle de una queja o sugerencia
const obtenerDetalleQuejaSugerencia = async (req, res) => {
    try {
        const { id } = req.params;
        // Validar ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                msg: 'El ID no es válido'
            });
        }
        const quejaSugerencia = await QuejaSugerencia.findById(id)
            .populate(
                'usuario',
                'email rol'
            )
            .populate(
                'respondidoPor',
                'email rol'
            );
        if (!quejaSugerencia) {
            return res.status(404).json({
                msg: 'La queja o sugerencia no existe'
            });
        }
        return res.status(200).json({
            msg: 'Detalle obtenido correctamente',
            quejaSugerencia
        });
    } catch (error) {
        console.error(
            'Error al obtener detalle de la queja o sugerencia:',
            error
        );
        return res.status(500).json({
            msg: 'Error al obtener el detalle'
        });
    }
};

export {
    crearQuejaSugerencia, obtenerMisQuejasSugerencias, obtenerQuejasSugerenciasAdmin, responderQuejaSugerencia, obtenerDetalleQuejaSugerencia
};