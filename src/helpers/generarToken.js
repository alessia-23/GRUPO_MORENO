import crypto from 'crypto';

const generarToken = () => {
    return crypto.randomBytes(20).toString('hex');
};

export default generarToken;