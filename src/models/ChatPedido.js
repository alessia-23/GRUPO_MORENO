import mongoose from 'mongoose';

const mensajePedidoSchema = new mongoose.Schema(
    {
        pedido: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pedido',
            required: true,
            index: true
        },
        emisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        mensaje: {
            type: String,
            required: [true, 'El mensaje es obligatorio'],
            trim: true,
            maxlength: [1000, 'El mensaje no puede exceder los 1000 caracteres']
        },
        leidoPor: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Usuario'
            }
        ]
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'ChatsPedidos'
    }
);

const ChatPedido = mongoose.model('ChatPedido', mensajePedidoSchema);
export default ChatPedido;