
// Verifica que el usuario autenticado sea administrador
const soloAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            msg: 'Usuario no autenticado'
        });
    }
    if (req.usuario.rol !== 'ADMINISTRADOR') {
        return res.status(403).json({
            msg: 'Acceso denegado, solo el administrador puede realizar esta acción'
        });
    }
    next();
};

export default soloAdmin;