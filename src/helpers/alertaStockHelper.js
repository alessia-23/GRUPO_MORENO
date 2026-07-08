import axios from 'axios';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';

const revisarYEnviarAlertaStock = async (productoId) => {
    try {
        const producto = await Producto.findById(productoId);

        if (!producto || !producto.estado) {
            return;
        }

        console.log(`=== REVISANDO STOCK DE: ${producto.nombre} ===`);
        console.log(`Stock Actual: ${producto.stock} | Stock Mínimo: ${producto.stockMinimo}`);

        // VALIDACIÓN MATEMÁTICA
        if (producto.stock <= producto.stockMinimo) {
            
            const usuariosANotificar = await Usuario.find({
                rol: { $in: ['ADMINISTRADOR', 'VENDEDOR'] },
                estado: true
            }).select('email');

            // Si no encuentra usuarios en la BD, te pone a ti por defecto para que no vaya vacío
            let correosDestinatarios = usuariosANotificar
                .map(usuario => usuario.email?.trim())
                .filter(Boolean)
                .join(',');

            if (!correosDestinatarios) {
                console.log('ADVERTENCIA: No se hallaron usuarios activos en BD. Usando correo de respaldo.');
                correosDestinatarios = "grupomoreno593@gmail.com"; 
            }

            const payload = {
                productoId: producto._id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                stock: producto.stock,
                stockMinimo: producto.stockMinimo,
                proveedor: producto.proveedor,
                marca: producto.marca,
                destinatarios: correosDestinatarios
            };

            console.log('========== PAYLOAD QUE SALE A N8N ==========');
            console.log(payload);

            const respuesta = await axios.post(
                process.env.N8N_WEBHOOK_STOCK_BAJO,
                payload
            );

            console.log('========== RESPUESTA N8N ==========');
            console.log(`STATUS: ${respuesta.status}`);

            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: true } });
        }

        if (producto.stock > producto.stockMinimo) {
            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: false } });
        }

    } catch (error) {
        console.log('========== ERROR CRÍTICO EN HELPER ==========');
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
};

export default revisarYEnviarAlertaStock;