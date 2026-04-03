import bcrypt from "bcrypt";

// Encripta la contraseña antes de guardarla
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Compara la contraseña ingresada con la encriptada
export const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};