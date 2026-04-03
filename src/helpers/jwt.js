import jwt from "jsonwebtoken";

// Crea el token con datos básicos del usuario
const crearTokenJWT = (usuario) => {
    return jwt.sign(
        {
            id: usuario._id,
            rol: usuario.rol,
            perfilId: usuario.perfilId,
            perfilModelo: usuario.perfilModelo
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );
};

export default crearTokenJWT;