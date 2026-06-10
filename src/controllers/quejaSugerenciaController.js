import QuejaSugerencia from '../models/QuejaSugerencia.js';

// Crear queja o sugerencia
const crearQuejaSugerencia = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { tipo, mensaje } = req.body;
        // Solo clientes y vendedores pueden crear quejas o sugerencias
        if (!['CLIENTE', 'VENDEDOR'].includes(rolUsuario)) {
            return res.status(403).json({
                msg: 'No tienes permiso para enviar quejas o sugerencias'
            });
        }
        // Validar tipo
        if (!tipo || !['QUEJA', 'SUGERENCIA'].includes(tipo)) {
            return res.status(400).json({
                msg: 'El tipo debe ser QUEJA o SUGERENCIA'
            });
        }
        // Validar mensaje
        if (!mensaje || !mensaje.trim()) {
            return res.status(400).json({
                msg: 'El mensaje es obligatorio'
            });
        }
        const nuevaQuejaSugerencia = await QuejaSugerencia.create({
            usuario: usuarioId,
            rolUsuario,
            tipo,
            mensaje: mensaje.trim()
        });
        return res.status(201).json({
            msg: 'Queja o sugerencia enviada correctamente',
            quejaSugerencia: {
                id: nuevaQuejaSugerencia._id,
                tipo: nuevaQuejaSugerencia.tipo,
                mensaje: nuevaQuejaSugerencia.mensaje,
                estado: nuevaQuejaSugerencia.estado,
                createdAt: nuevaQuejaSugerencia.createdAt
            }
        });
    } catch (error) {
        console.error('Error al crear queja o sugerencia:', error);
        return res.status(500).json({
            msg: 'Error al enviar la queja o sugerencia'
        });
    }
};

export {
    crearQuejaSugerencia
};