import axios from 'axios';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';

/**
 * @param {String} productoId - ID del producto
 * @param {Number} cantidadVendida - Cantidad que se acaba de restar en la venta
 */
const revisarYEnviarAlertaStock = async (productoId, cantidadVendida = 0) => {
    try {
        const producto = await Producto.findById(productoId);

        if (!producto || !producto.estado) {
            return;
        }

        const stockActual = cantidadVendida > 0 ? (producto.stock) : producto.stock;

        console.log(`=== [HELPER] EVALUANDO ALERTA DE STOCK ===`);
        console.log(`Producto: ${producto.nombre} | Stock calculado: ${stockActual} | Mínimo: ${producto.stockMinimo}`);

        if (stockActual <= producto.stockMinimo && producto.alertaStockEnviada === false) {

            const usuariosANotificar = await Usuario.find({
                rol: { $in: ['ADMINISTRADOR', 'VENDEDOR'] },
                estado: true
            }).select('email');

            let correosDestinatarios = usuariosANotificar
                .map(usuario => usuario.email?.trim())
                .filter(Boolean)
                .join(',');


            if (!correosDestinatarios) {
                console.log('--- [ADVERTENCIA] No hay usuarios activos en la BD. Usando correo de respaldo ---');
                correosDestinatarios = "grupomoreno593@gmail.com";
            }

            const payload = {
                productoId: producto._id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                stock: stockActual,
                stockMinimo: producto.stockMinimo,
                proveedor: producto.proveedor,
                marca: producto.marca,
                destinatarios: correosDestinatarios
            };

            console.log('--- ENVIANDO EN VIVO A N8N ---', payload);

            const respuesta = await axios.post(
                process.env.N8N_WEBHOOK_STOCK_BAJO,
                payload
            );

            console.log(`--- RESPUESTA N8N: ${respuesta.status} ---`);


            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: true } });
        }


        if (stockActual > producto.stockMinimo && producto.alertaStockEnviada === true) {
            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: false } });
            console.log('--- Bandera reseteada a false (Stock suficiente) ---');
        }

    } catch (error) {
        console.log('========== ERROR INTERNO ALERTA STOCK ==========');
        console.log(error.message);
    }
};

export default revisarYEnviarAlertaStock;