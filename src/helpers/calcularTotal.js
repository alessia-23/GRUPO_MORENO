// Redondear números decimales a 2 dígitos
const redondear = (valor) => {
    return Number(valor.toFixed(2));
};

// Calcular subtotal, IVA y total del pedido
const calcularTotales = (items = []) => {
    // Variables acumuladoras generales
    let subtotal = 0;
    let iva = 0;
    // Recorrer cada producto del pedido
    const itemsCalculados = items.map((item) => {
        // Convertir valores numéricos
        const cantidad = Number(item.cantidad);
        const precio = Number(item.precioUnitario);
        // IVA por defecto del 15%
        const porcentajeIva =
            item.ivaRate !== undefined
                ? Number(item.ivaRate)
                : 0.15;
        // Calcular valores del producto
        const subtotalProducto = cantidad * precio;
        const ivaProducto = subtotalProducto * porcentajeIva;
        const totalProducto = subtotalProducto + ivaProducto;
        // Acumular valores generales
        subtotal += subtotalProducto;
        iva += ivaProducto;
        // Guardar cálculos en el producto
        item.subtotal = redondear(subtotalProducto);
        item.iva = redondear(ivaProducto);
        item.total = redondear(totalProducto);
        return item;
    });

    // Retornar cálculos finales
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