import jwt from "jsonwebtoken";
const soloVendedor = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({
            msg: 'Usuario no autenticado'
        });
    }

    if (req.usuario.rol !== 'VENDEDOR') {
        return res.status(403).json({
            msg: 'Solo los vendedores pueden realizar esta acción'
        });
    }

    next();
};

export default soloVendedor;