// Redondear números decimales a 2 dígitos de forma segura
const redondear = (valor = 0) => {
    return Number(Number(valor || 0).toFixed(2));
};

// Calcular subtotal, IVA y total general del carrito
const calcularTotales = (items = []) => {
    let subtotalGeneral = 0;
    let ivaGeneral = 0;

    const itemsCalculados = items.map((item) => {
        const cantidad = Number(item.cantidad || 0);
        const precio = Number(item.precioUnitario || 0);
        const porcentajeIva = Number(item.porcentajeIva || 0);

        const subtotalProducto = cantidad * precio;
        const ivaProducto = subtotalProducto * porcentajeIva;

        subtotalGeneral += subtotalProducto;
        ivaGeneral += ivaProducto;

        item.subtotal = redondear(subtotalProducto);

        return item;
    });

    return {
        itemsCalculados,
        subtotalGeneral: redondear(subtotalGeneral),
        ivaGeneral: redondear(ivaGeneral),
        totalGeneral: redondear(subtotalGeneral + ivaGeneral)
    };
};

export {
    calcularTotales,
    redondear
};