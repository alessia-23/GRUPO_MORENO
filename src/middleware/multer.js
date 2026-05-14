import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const crearUpload = (folder) => {

    const storage = new CloudinaryStorage({
        cloudinary,

        params: async (req, file) => ({
            folder,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
        })
    });

    return multer({
        storage
    });
};

export default crearUpload;
