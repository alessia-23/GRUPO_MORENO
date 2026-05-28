
// Verifica que el usuario autenticado sea cliente
const soloCliente = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            msg: 'Usuario no autenticado'
        });
    }
    if (req.usuario.rol !== 'CLIENTE') {
        return res.status(403).json({
            msg: 'Acceso denegado, solo el cliente puede realizar esta acción'
        });
    }
    next();
};

export default soloCliente;