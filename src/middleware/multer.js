import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const crearUpload = (folder) => {

    const storage = new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => ({
            folder: folder,
            format: file.mimetype.split('/')[1],
        }),
    });

    return multer({
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024
        }
    });
};

export default crearUpload;