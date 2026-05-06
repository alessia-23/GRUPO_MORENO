import multer from 'multer';

// Almacenamiento temporal en memoria
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    // Límite de tamaño: 5MB
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    // Validación de formatos permitidos
    fileFilter: (req, file, cb) => {
        const formatosPermitidos = ['image/jpeg','image/png','image/jpg','image/webp'];
        if (formatosPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de imagen no permitido'));
        }
    }
});

export default upload;