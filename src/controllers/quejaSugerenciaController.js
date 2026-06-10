import QuejaSugerencia from '../models/QuejaSugerencia.js';

// Crear queja o sugerencia
const crearQuejaSugerencia = async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const rolUsuario = req.usuario.rol;
        const { asunto, mensaje } = req.body;
        // Solo clientes y vendedores pueden enviar quejas o sugerencias
        if (!['CLIENTE', 'VENDEDOR'].includes(rolUsuario)) {
            return res.status(403).json({
                msg: 'No tienes permiso para enviar quejas o sugerencias'
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
        await QuejaSugerencia.create({
            usuario: usuarioId,
            rolUsuario,
            asunto: asunto.trim(),
            mensaje: mensaje.trim()
        });
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

export {
    crearQuejaSugerencia
};