import jwt from "jsonwebtoken";

// Verifica que el token exista y sea válido
const protegerRuta = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            msg: "Acceso denegado, token no proporcionado o inválido"
        });
    }
    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            msg: "Token inválido o expirado"
        });
    }
};

export default protegerRuta;