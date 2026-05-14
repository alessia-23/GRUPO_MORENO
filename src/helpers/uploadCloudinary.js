import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs-extra';

// Subir archivos a Cloudinary desde la PC
const subirImagenCloudinary = async (filePath, folder = 'Categorias') => {
    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, {
        folder
    });
    await fs.unlink(filePath);
    return { secure_url, public_id };
};

// Subir imagen en Base64 a Cloudinary
const subirBase64Cloudinary = async (base64, folder = 'Categorias') => {
    const buffer = Buffer.from(
        base64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
    );
    const { secure_url, public_id } = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (err, res) => {
                if (err) reject(err);
                else resolve(res);
            }
        );
        stream.end(buffer);
    });
    return { secure_url, public_id };
};

export {
    subirImagenCloudinary,
    subirBase64Cloudinary
};