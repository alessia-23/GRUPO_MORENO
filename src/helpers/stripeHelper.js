import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const cobrarVentaConTarjeta = async ({ venta, paymentMethodId }) => {
    const totalCentavos = Math.round(venta.resumenPago.totalPagar * 100);

    const payment = await stripe.paymentIntents.create({
        amount: totalCentavos,
        currency: 'usd',
        description: `Pago de venta ${venta._id}`,
        payment_method: paymentMethodId,
        confirm: true,
        receipt_email: venta.datosFacturacion?.correo || undefined,
        metadata: {
            ventaId: venta._id.toString(),
            pedidoId: venta.pedido?.toString() || ''
        },
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
        }
    });

    return payment;
};

export {
    stripe,
    cobrarVentaConTarjeta
};