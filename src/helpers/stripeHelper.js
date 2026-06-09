import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);

const cobrarConTarjeta = async ({
    totalPagar,
    correo,
    paymentMethodId,
    descripcion = 'Pago con tarjeta'
}) => {
    const totalCentavos = Math.round(Number(totalPagar) * 100);

    const payment = await stripe.paymentIntents.create({
        amount: totalCentavos,
        currency: 'usd',
        description: descripcion,
        payment_method: paymentMethodId,
        confirm: true,
        receipt_email: correo || undefined,
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
        }
    });

    return payment;
};

export {
    stripe,
    cobrarConTarjeta
};