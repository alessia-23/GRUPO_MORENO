// Redondear números decimales a 2 dígitos
const redondear = (valor) => {
    return Number(valor.toFixed(2));
};

// Calcular subtotal, IVA y total del pedido
const calcularTotales = (items = []) => {
    let subtotal = 0;
    let iva = 0;

    const itemsCalculados = items.map((item) => {
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precioUnitario);

        const porcentajeIva =
            item.ivaRate !== undefined
                ? Number(item.ivaRate)
                : 0.15;

        const subtotalProducto = cantidad * precio;
        const ivaProducto = subtotalProducto * porcentajeIva;
        const totalProducto = subtotalProducto + ivaProducto;

        subtotal += subtotalProducto;
        iva += ivaProducto;

        item.subtotal = redondear(subtotalProducto);
        item.iva = redondear(ivaProducto);
        item.total = redondear(totalProducto);

        return item;
    });

    return {
        itemsCalculados,
        subtotal: redondear(subtotal),
        iva: redondear(iva),
        total: redondear(subtotal + iva)
    };
};

export {
    calcularTotales,
    redondear
};