import axios from 'axios';
import Producto from '../models/Producto.js';
import Usuario from '../models/Usuario.js'; // <-- Importamos tu modelo de Usuario

// Revisa si un producto llegó a stock bajo y envía una alerta
const revisarYEnviarAlertaStock = async (productoId) => {
    try {
        // Buscar el producto actualizado
        const producto = await Producto.findById(productoId);
        // Si no existe o está inactivo no hacemos nada
        if (!producto || !producto.estado) return;

        // Si el stock llegó al mínimo y todavía no se ha enviado alerta
        if (
            producto.stock <= producto.stockMinimo &&
            producto.alertaStockEnviada === false
        ) {
            const usuariosANotificar = await Usuario.find({
                rol: { $in: ['ADMINISTRADOR', 'VENDEDOR'] }, // Tus enums exactos en mayúsculas
                estado: true
            }).select('email'); // Usamos tu campo 'email'
            const correosDestinatarios = usuariosANotificar
                .map(usuario => usuario.email)
                .join(', ');
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
                console.log('No se encontraron administradores o vendedores activos para notificar.');
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
        console.log(
            'Error al revisar/enviar alerta de stock:',
            error.message
        );
    }
};

export default revisarYEnviarAlertaStock;