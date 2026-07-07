import axios from 'axios';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';

const revisarYEnviarAlertaStock = async (productoId) => {
    try {
        const producto = await Producto.findById(productoId);
        if (!producto || !producto.estado) return;

        if (
            producto.stock <= producto.stockMinimo &&
            producto.alertaStockEnviada === false
        ) {
            // 1. Buscamos los usuarios activos con los roles requeridos
            const usuariosANotificar = await Usuario.find({
                rol: { $in: ['ADMINISTRADOR', 'VENDEDOR'] },
                estado: true
            }).select('email');

            // 2. Validación defensiva: Si por alguna razón la consulta no devuelve un array, creamos uno vacío
            const listaUsuarios = Array.isArray(usuariosANotificar) ? usuariosANotificar : [];

            // 3. Mapeamos los correos de forma segura
            const correosDestinatarios = listaUsuarios
                .map(usuario => usuario.email)
                .filter(email => email) // Filtra si algún usuario no tiene email cargado
                .join(', ');

            // Si encontramos correos, enviamos la alerta a n8n
            if (correosDestinatarios) {
                await axios.post(process.env.N8N_WEBHOOK_STOCK_BAJO, {
                    productoId: producto._id,
                    nombre: producto.nombre,
                    codigo: producto.codigo,
                    stock: producto.stock,
                    stockMinimo: producto.stockMinimo,
                    proveedor: producto.proveedor,
                    marca: producto.marca,
                    destinatarios: correosDestinatarios
                });
            } else {
                console.log('No se encontraron correos para ADMINISTRADOR o VENDEDOR activos.');
            }

            producto.alertaStockEnviada = true;
            await producto.save();
        }

        if (
            producto.stock > producto.stockMinimo &&
            producto.alertaStockEnviada === true
        ) {
            producto.alertaStockEnviada = false;
            await producto.save();
        }
    } catch (error) {
        console.log('Error al revisar/enviar alerta de stock:', error.message);
    }
};

export default revisarYEnviarAlertaStock;