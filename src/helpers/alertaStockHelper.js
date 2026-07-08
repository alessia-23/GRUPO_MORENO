import axios from 'axios';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js';

const revisarYEnviarAlertaStock = async (productoId) => {
    try {
        const producto = await Producto.findById(productoId);

        if (!producto || !producto.estado) {
            return;
        }

        // Solo enviar alerta si llegó al stock mínimo
        if (
            producto.stock <= producto.stockMinimo &&
            producto.alertaStockEnviada === false
        ) {
            const usuariosANotificar = await Usuario.find({
                rol: { $in: ['ADMINISTRADOR', 'VENDEDOR'] },
                estado: true
            }).select('email rol estado');

            console.log('========== USUARIOS ENCONTRADOS ==========');
            console.log(usuariosANotificar);

            const correosDestinatarios = usuariosANotificar
                .map(usuario => usuario.email?.trim())
                .filter(Boolean)
                .join(',');

            console.log('========== DESTINATARIOS ==========');
            console.log(correosDestinatarios);

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

            console.log('========== PAYLOAD QUE SE ENVÍA A N8N ==========');
            console.log(payload);

            if (correosDestinatarios.length > 0) {
                const respuesta = await axios.post(
                    process.env.N8N_WEBHOOK_STOCK_BAJO,
                    payload
                );

                console.log('========== RESPUESTA N8N ==========');
                console.log(respuesta.status);
            } else {
                console.log('No existen administradores o vendedores activos para enviar la alerta.');
            }

            // USAMOS UPDATEONE PARA EVITAR ENTRAR EN VALIDACIONES INTERNAS DEL MODELO
            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: true } });
            console.log('Bandera alertaStockEnviada cambiada a true de forma segura.');
        }

        // Reiniciar bandera cuando vuelva a tener stock suficiente
        if (
            producto.stock > producto.stockMinimo &&
            producto.alertaStockEnviada === true
        ) {
            await Producto.updateOne({ _id: producto._id }, { $set: { alertaStockEnviada: false } });
            console.log('Bandera alertaStockEnviada reseteada a false de forma segura.');
        }

    } catch (error) {
        console.log('========== ERROR ALERTA STOCK ==========');
        if (error.response) {
            console.log(error.response.data);
        } else {
            console.log(error.message);
        }
    }
};

export default revisarYEnviarAlertaStock;