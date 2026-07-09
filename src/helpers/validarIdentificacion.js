const validarIdentificacion = (numero = '', soloCedula = false) => {
    numero = String(numero).trim();

    // Que solo tenga números y no esté vacío
    if (!/^\d+$/.test(numero)) return false;
    if (/^(\d)\1+$/.test(numero)) return false; // Evitar números repetidos
    const provincia = parseInt(numero.substring(0, 2), 10); // Que la provincia exista
    if ((provincia < 1 || provincia > 24) && provincia !== 30) return false;
    if (soloCedula) { // para vendedor solo cédula
        return numero.length === 10;
    }
    if (numero.length === 10) { // para clientes ruc o cédula
        return true;
    }
    if (numero.length === 13) {
        const establecimiento = numero.substring(10, 13);
        return establecimiento === '001';
    }
    return false;
};

export default validarIdentificacion;