import axios from 'axios';
import Producto from '../models/Producto.js';

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
            // Enviar información del producto al workflow de n8n
            await axios.post(process.env.N8N_WEBHOOK_STOCK_BAJO, {
                productoId: producto._id,
                nombre: producto.nombre,
                codigo: producto.codigo,
                stock: producto.stock,
                stockMinimo: producto.stockMinimo,
                proveedor: producto.proveedor,
                marca: producto.marca
            });
            // Marcar que la alerta ya fue enviada
            producto.alertaStockEnviada = true;
            await producto.save();
        }
        // Si se repuso el stock, permitir futuras alertas
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