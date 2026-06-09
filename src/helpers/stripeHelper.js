import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const crearSesionPagoStripe = async ({ venta }) => {
    const frontendUrl = process.env.FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',

        payment_method_types: ['card'],

        line_items: venta.articulos.map((item) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: item.nombreProducto
                },
                unit_amount: Math.round(item.precioUnitario * 100)
            },
            quantity: item.cantidad
        })),

        success_url: `${frontendUrl}/pago-exitoso?ventaId=${venta._id}`,

        cancel_url: `${frontendUrl}/pago-cancelado?ventaId=${venta._id}`,

        client_reference_id: venta._id.toString(),

        metadata: {
            ventaId: venta._id.toString(),
            pedidoId: venta.pedido?.toString() || ''
        }
    });

    return session;
};

export {
    stripe,
    crearSesionPagoStripe
};